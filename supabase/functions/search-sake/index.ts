import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Extract the first number from a string like "麹米50% 掛米55%" → 50
function extractNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  const m = String(v).match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

// Try to parse the largest valid JSON object from a freeform string
function extractJson(raw: string): Record<string, unknown> {
  // Try direct parse first
  try { return JSON.parse(raw) } catch { /* fall through */ }
  // Find all {...} blocks and try each
  const blocks = [...raw.matchAll(/\{[\s\S]*?\}/g)].map(m => m[0])
  for (const block of blocks.reverse()) {
    try { return JSON.parse(block) } catch { /* continue */ }
  }
  // Last resort: greedy match
  const m = raw.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch { /* ignore */ } }
  return {}
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const form = await req.json()
    const query = [form.brand, form.name, form.brewery, form.type].filter(Boolean).join(' ')
    if (!query) throw new Error('brand/name または brewery が必要です')

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const missing = ['brand','name','brewery','region','type','rice','yeast','polishing','alcohol','smv','acidity','name_reading']
      .filter(k => !form[k] && form[k] !== 0)

    if (missing.length === 0) {
      return new Response(JSON.stringify({}), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const knownLines = Object.entries(form)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')

    const prompt = `日本酒の詳細情報を調べてください。

【この酒の既知情報】
${knownLines}

【調べて補完が必要なフィールド】: ${missing.join(', ')}

酒蔵公式サイト・SAKETIMEなどの日本酒データベース・ECサイト等を検索し、正確な情報を見つけてください。

フィールドの定義:
- brand: 銘柄名のみ（例：「獺祭」「而今」）
- name: 銘柄を除いた品名・グレード部分（例：「純米大吟醸 磨き三割九分」「純米吟醸 千本錦 火入」）
- name_reading: nameフィールドのヘボン式ローマ字（例：「Junmai Daiginjo Migaki Sanwarinku」）

以下のJSON形式のみで返してください（説明文・マークダウン不要）:
{"brand":"銘柄","name":"品名（銘柄なし）","brewery":"蔵元名（法人格なし）","region":"都道府県","type":"純米/純米吟醸/純米大吟醸/吟醸/大吟醸/特別純米/本醸造/普通酒/その他","rice":"原料米品種","yeast":"使用酵母","polishing":精米歩合数値,"alcohol":アルコール度数数値,"smv":"日本酒度符号付き文字列","acidity":酸度数値,"name_reading":"品名のローマ字"}

不明なフィールドはnullにしてください。`

    const geminiBody = JSON.stringify({
      tools: [{ google_search: {} }],
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0 },
    })

    let resp: Response | null = null
    let lastErr: Error | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        resp = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
            body: geminiBody,
            signal: AbortSignal.timeout(55_000),
          }
        )
        break
      } catch (e) {
        lastErr = e as Error
        if (attempt < 1) await new Promise(r => setTimeout(r, 2000))
      }
    }
    if (!resp) throw new Error(`Gemini request failed: ${lastErr?.message ?? 'unknown'}`)

    const gemini = await resp.json()
    if (gemini.error) throw new Error(`Gemini: ${gemini.error.message ?? JSON.stringify(gemini.error)}`)

    const parts = gemini.candidates?.[0]?.content?.parts ?? []
    const raw = parts
      .filter((p: { thought?: boolean; text?: string }) => !p.thought && p.text)
      .map((p: { text?: string }) => p.text)
      .join('')
      .trim()

    const found = extractJson(raw)

    // Only return missing fields that are now populated; clean up numerics
    const result: Record<string, unknown> = {}
    for (const key of missing) {
      const val = found[key]
      if (val === null || val === undefined || val === '') continue
      if (['polishing', 'alcohol', 'acidity'].includes(key)) {
        const n = extractNumber(val)
        if (n !== null) result[key] = n
      } else {
        result[key] = val
      }
    }

    // DB-normalize brewery, rice, name
    if (result.brewery || result.rice || result.name) {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      if (result.brewery) {
        const { data } = await db.from('sake_breweries').select('name, area_id')
          .ilike('name', `%${result.brewery}%`).limit(1)
        if (data?.length) {
          result.brewery = data[0].name
          if (!form.region && !result.region && data[0].area_id) {
            const { data: areas } = await db.from('sake_areas').select('name').eq('id', data[0].area_id).limit(1)
            if (areas?.length) result.region = areas[0].name
          }
        }
      }
      if (result.rice) {
        const core = String(result.rice).split(/[・\/、,\s]+/)[0].trim()
        const { data } = await db.from('sake_rice').select('name').ilike('name', `%${core}%`).limit(1)
        if (data?.length) result.rice = data[0].name
      }
      if (result.brand) {
        const { data } = await db.from('sake_brands').select('name').ilike('name', `%${result.brand}%`).limit(1)
        if (data?.length) result.brand = data[0].name
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
