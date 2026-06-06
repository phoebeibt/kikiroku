import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function stripBrewerySuffix(name: string): string {
  return name
    .replace(/\s*(株式会社|合名会社|合資会社|有限会社|農業生産法人|（株）|\(株\)|㈱)\s*/g, '')
    .trim()
}

function coreRice(name: string): string {
  return name.split(/[・＆&\/、,\s]+/)[0].replace(/\d+%?$/, '').trim()
}

function extractJson(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) } catch { /* fall through */ }
  // Find the outermost {...} block
  const m = raw.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch { /* ignore */ } }
  return {}
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const {
      image_base64, mime_type = 'image/jpeg',
      image_base64_2, mime_type_2 = 'image/jpeg',
    } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const imageParts = [
      { inline_data: { mime_type, data: image_base64 } },
      ...(image_base64_2 ? [{ inline_data: { mime_type: mime_type_2, data: image_base64_2 } }] : []),
    ]

    const prompt = `あなたは日本酒ラベル情報抽出の専門家です。提供された画像（表ラベル・裏ラベルの一方または両方）から情報を正確に読み取り、以下のJSON形式で返してください。

【抽出ルール】

■ name（商品の完全な名前）
- 表ラベルの「銘柄名＋商品種別・グレード名」を全て含める
- 例：「獺祭 純米大吟醸 磨き三割九分」「久保田 萬寿」「八海山 純米吟醸」
- 銘柄名だけでなく、ラベルに書かれた固有のグレード名・商品名を全て含めること

■ brewery（蔵元名）
- 法人格（株式会社・合名会社・有限会社等）は除く
- 例：「旭酒造」「朝日酒造」「八海醸造」

■ region（都道府県）
- 住所・産地表示から「○○県」「○○府」を抽出

■ type（種類）
- 純米 / 純米吟醸 / 純米大吟醸 / 吟醸 / 大吟醸 / 特別純米 / 本醸造 / 普通酒 / その他 のいずれか

■ 裏ラベルの数値フィールド（単位を除いた数値のみ）
- polishing（精米歩合）: 「精米歩合○○%」→ 数値のみ。例: 50
- alcohol（アルコール分）: 「アルコール分○○度」→ 数値のみ。例: 15.5
- smv（日本酒度）: 「日本酒度＋○」「日本酒度−○」→ 符号付き文字列。例: "+3" or "-2"
- acidity（酸度）: 「酸度○.○」→ 数値のみ。例: 1.4

■ rice（原料米）
- 「原料米：山田錦」「使用米：五百万石」から品種名のみ
- 産地・割合・ブレンド情報は除く

■ yeast（使用酵母）
- 「使用酵母：○○」「酵母：○○」から酵母名・番号

■ bottling_date（製造年月）
- 「製造年月 令和○年○月」「製造年月 ○○年○月」→ YYYY-MM 形式

【注意】
- 縦書き・横書き・斜め書きを問わず全テキストを読む
- 数値は必ず単位なしの数値のみを返す
- 見つからない場合は null を返す

以下のJSON形式のみで返してください（説明文・マークダウン・コードブロックは一切不要）:
{"name":null,"brewery":null,"region":null,"type":null,"rice":null,"yeast":null,"polishing":null,"alcohol":null,"smv":null,"acidity":null,"bottling_date":null}`

    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, { text: prompt }] }],
          generationConfig: { temperature: 0 },
        }),
      }
    )

    const geminiText = await resp.text()
    let gemini: Record<string, unknown>
    try { gemini = JSON.parse(geminiText) } catch { throw new Error(`Gemini non-JSON: ${geminiText.slice(0, 200)}`) }
    if (gemini.error) throw new Error(`Gemini: ${(gemini.error as { message?: string }).message ?? JSON.stringify(gemini.error)}`)

    const candidates = (gemini.candidates as Array<{ content?: { parts?: Array<{ thought?: boolean; text?: string }> } }>) ?? []
    const parts = candidates[0]?.content?.parts ?? []
    const raw = parts
      .filter(p => !p.thought && p.text)
      .map(p => p.text)
      .join('')
      .trim()

    if (!raw) throw new Error(`Gemini returned no text. Full response: ${geminiText.slice(0, 300)}`)
    const extracted: Record<string, unknown> = extractJson(raw)

    // DB matching for brewery and rice (normalize to canonical names)
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (extracted.brewery) {
      const candidates = [...new Set([
        stripBrewerySuffix(String(extracted.brewery)),
        String(extracted.brewery),
      ])]
      for (const candidate of candidates) {
        const { data: rows } = await db
          .from('sake_breweries').select('name, area_id')
          .ilike('name', `%${candidate}%`).limit(1)
        if (rows?.length) {
          extracted.brewery = rows[0].name
          if (!extracted.region && rows[0].area_id) {
            const { data: areas } = await db
              .from('sake_areas').select('name').eq('id', rows[0].area_id).limit(1)
            if (areas?.length) extracted.region = areas[0].name
          }
          break
        }
      }
    }

    if (extracted.rice) {
      const core = coreRice(String(extracted.rice))
      const { data: rows } = await db
        .from('sake_rice').select('name').ilike('name', `%${core}%`).limit(1)
      if (rows?.length) extracted.rice = rows[0].name
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
