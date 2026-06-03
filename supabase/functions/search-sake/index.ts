import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const form = await req.json()
    // Need at least name or brewery to search
    const query = [form.name, form.brewery, form.type].filter(Boolean).join(' ')
    if (!query) throw new Error('name または brewery を入力してください')

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    // Build list of which fields are currently missing
    const missing = ['name','brewery','region','type','rice','yeast','polishing','alcohol','smv','acidity']
      .filter(k => !form[k] && form[k] !== 0)

    if (missing.length === 0) {
      return new Response(JSON.stringify({}), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const knownFields = Object.entries(form)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')

    const prompt = `日本酒データベースやメーカーサイト・酒販サイトを検索して、以下の日本酒の詳細情報を調べてください。

【既知情報】
${knownFields}

【調べてほしいフィールド】: ${missing.join(', ')}

検索して判明した情報のみをJSONオブジェクトで返してください（不明なフィールドはnull）。
型の制約:
- type は次のいずれか: 純米/純米吟醸/純米大吟醸/吟醸/大吟醸/特別純米/本醸造/普通酒/その他
- polishing/alcohol/acidity は単位なしの数値
- smv は "+3" や "-1" のような符号付き文字列
- region は都道府県名（例: 山口県）
- brewery は法人格（株式会社等）を含まない蔵元名
- すべての文字列フィールドは日本語で返す

JSONオブジェクトのみ返してください（markdownや説明は不要）:`

    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    )

    const gemini = await resp.json()
    if (gemini.error) throw new Error(`Gemini: ${gemini.error.message ?? JSON.stringify(gemini.error)}`)

    const parts = gemini.candidates?.[0]?.content?.parts ?? []
    const raw = (parts.find((p: { thought?: boolean; text?: string }) => !p.thought)?.text ?? '{}').trim()

    // Extract JSON from the response (may be wrapped in text/markdown)
    let found: Record<string, unknown> = {}
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { found = JSON.parse(jsonMatch[0]) } catch { /* leave empty */ }
    }

    // Only return fields that were missing and are now filled
    const result: Record<string, unknown> = {}
    for (const key of missing) {
      if (found[key] !== null && found[key] !== undefined && found[key] !== '') {
        result[key] = found[key]
      }
    }

    // DB-normalize brewery and rice
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
        const { data } = await db.from('sake_rice').select('name')
          .ilike('name', `%${String(result.rice).split(/[・\/、,]/)[0].trim()}%`).limit(1)
        if (data?.length) result.rice = data[0].name
      }
      if (result.name) {
        const { data } = await db.from('sake_brands').select('name')
          .ilike('name', `%${result.name}%`).limit(1)
        if (data?.length) result.name = data[0].name
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
