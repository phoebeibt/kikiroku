import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { image_base64, mime_type = 'image/jpeg' } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type, data: image_base64 } },
              {
                text: `これは日本酒のボトルラベルです。横書き・縦書きを問わず、ラベル上の日本語テキストをすべて読み取ってください。すべてのフィールドは必ず日本語で返してください（数値フィールドを除く）。翻訳は不要です。

以下のJSONオブジェクトのみを返してください（見つからない場合はnull）:
{
  "name": "銘柄名（例：獺祭、久保田、八海山）",
  "brewery": "蔵元名（例：旭酒造、朝日酒造）",
  "region": "都道府県または産地（例：山口県、新潟県）",
  "type": "種類 — 以下のいずれか: 純米, 純米吟醸, 純米大吟醸, 吟醸, 大吟醸, 特別純米, 本醸造, 普通酒, その他 — または null",
  "rice": "原料米品種（例：山田錦、五百万石）",
  "yeast": "使用酵母",
  "polishing": "%なしの数字のみ（例：50）",
  "alcohol": "%なしの数字のみ（例：15）",
  "smv": "符号付き数字（例：+3 または -1）",
  "acidity": "数字のみ（例：1.4）",
  "bottling_date": "製造年月をYYYY-MM形式で（例：2025-10）"
}
JSONオブジェクトのみ返してください。説明やmarkdown不要。`,
              },
            ],
          }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    )

    const gemini = await resp.json()
    if (gemini.error) throw new Error(`Gemini API error: ${gemini.error.message ?? JSON.stringify(gemini.error)}`)
    const raw = gemini.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '{}'

    let extracted: Record<string, string | null> = {}
    try {
      extracted = JSON.parse(raw)
    } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) extracted = JSON.parse(m[0])
    }

    // Match against DB
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (extracted.brewery) {
      const { data: rows } = await db
        .from('sake_breweries')
        .select('name, area_id')
        .ilike('name', `%${extracted.brewery}%`)
        .limit(1)
      if (rows?.length) {
        extracted.brewery = rows[0].name
        if (!extracted.region && rows[0].area_id) {
          const { data: areas } = await db
            .from('sake_areas').select('name').eq('id', rows[0].area_id).limit(1)
          if (areas?.length) extracted.region = areas[0].name
        }
      }
    }

    if (extracted.rice) {
      const { data: rows } = await db
        .from('sake_rice').select('name').ilike('name', `%${extracted.rice}%`).limit(1)
      if (rows?.length) extracted.rice = rows[0].name
    }

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
