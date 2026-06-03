import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Strip company legal suffixes so "旭酒造株式会社" matches "旭酒造" in DB
function stripBrewerySuffix(name: string): string {
  return name
    .replace(/\s*(株式会社|合名会社|合資会社|有限会社|農業生産法人|（株）|\(株\)|㈱)\s*/g, '')
    .trim()
}

// Extract core rice name — "山田錦100%" → "山田錦", "山田錦・五百万石" → first variety
function coreRice(name: string): string {
  return name.split(/[・＆&\/、,\s]+/)[0].replace(/\d+%?$/, '').trim()
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

    // Build image parts — include second image if provided
    const imageParts = [
      { inline_data: { mime_type, data: image_base64 } },
      ...(image_base64_2 ? [{ inline_data: { mime_type: mime_type_2, data: image_base64_2 } }] : []),
    ]

    const prompt = `あなたは日本酒ラベル情報抽出の専門家です。提供された画像（表ラベル・裏ラベルの一方または両方）から情報を読み取り、以下のJSONを返してください。

【裏ラベルの主な記載項目と読み取り方】
- 精米歩合：「精米歩合 ○○%」「精米步合○○」→ polishing（単位なし数字のみ）
- アルコール分：「アルコール分 ○○度」「アルコール ○○%」→ alcohol（単位なし数字のみ）
- 日本酒度：「日本酒度 +○」「日本酒度 ±○」→ smv（符号付き数字）
- 酸度：「酸度 ○.○」→ acidity（数字のみ）
- 使用酵母：「使用酵母 ○○」「酵母 ○○」→ yeast
- 原料米：「原料米 ○○○○」「使用米 ○○○○」→ rice（品種名のみ、産地・割合は除く）
- 製造年月：「製造年月 ○○年○○月」→ bottling_date（YYYY-MM形式）
- 蔵元：製造者住所の前後に記載 → brewery（法人格を除いた蔵元名のみ）
- 都道府県：住所や産地表示から → region

【表ラベルの主な記載項目】
- 銘柄名：最も大きく書かれた商品名 → name
- 種類：純米/純米吟醸/純米大吟醸/吟醸/大吟醸/特別純米/本醸造/普通酒 のいずれか → type

【重要な注意点】
- 数値フィールド（polishing/alcohol/smv/acidity）は必ず単位を除いた数値のみを返す
- 縦書き・横書きを問わず全テキストを読む
- 見つからない・判別不能な場合は null を返す
- breweryには「株式会社」「合名会社」等の法人格を含めない

以下のJSONオブジェクトのみ返してください（説明・markdownは不要）:
{
  "name": "銘柄名 or null",
  "brewery": "蔵元名（法人格なし）or null",
  "region": "都道府県 or null",
  "type": "純米/純米吟醸/純米大吟醸/吟醸/大吟醸/特別純米/本醸造/普通酒/その他 or null",
  "rice": "原料米品種 or null",
  "yeast": "使用酵母 or null",
  "polishing": 数字 or null,
  "alcohol": 数字 or null,
  "smv": "符号付き数字文字列 or null",
  "acidity": 数字 or null,
  "bottling_date": "YYYY-MM or null"
}`

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, { text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 2048 },
          },
        }),
      }
    )

    const gemini = await resp.json()
    if (gemini.error) throw new Error(`Gemini: ${gemini.error.message ?? JSON.stringify(gemini.error)}`)
    const parts = gemini.candidates?.[0]?.content?.parts ?? []
    const raw = (parts.find((p: { thought?: boolean; text?: string }) => !p.thought)?.text ?? '{}').trim()

    let extracted: Record<string, unknown> = {}
    try {
      extracted = JSON.parse(raw)
    } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) extracted = JSON.parse(m[0])
    }

    // DB matching
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Brewery: try with suffix stripped, then as-is
    if (extracted.brewery) {
      const candidates = [...new Set([
        stripBrewerySuffix(String(extracted.brewery)),
        String(extracted.brewery),
      ])]
      for (const candidate of candidates) {
        const { data: rows } = await db
          .from('sake_breweries')
          .select('name, area_id')
          .ilike('name', `%${candidate}%`)
          .limit(1)
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

    // Rice: strip blends and percentages, try core name
    if (extracted.rice) {
      const core = coreRice(String(extracted.rice))
      const { data: rows } = await db
        .from('sake_rice').select('name').ilike('name', `%${core}%`).limit(1)
      if (rows?.length) extracted.rice = rows[0].name
    }

    // Brand name
    if (extracted.name) {
      const { data: rows } = await db
        .from('sake_brands').select('name').ilike('name', `%${extracted.name}%`).limit(1)
      if (rows?.length) extracted.name = rows[0].name
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
