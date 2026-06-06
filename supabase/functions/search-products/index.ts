import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simplified Chinese → Japanese kanji (characters that differ and appear in sake names)
const S2J: Record<string, string> = {
  '产': '産', '酿': '醸', '纯': '純', '传': '伝',
  '龙': '龍', '东': '東', '丰': '豊', '飞': '飛',
  '铃': '鈴', '泽': '澤', '岛': '島', '华': '華',
  '达': '達', '长': '長', '风': '風', '兰': '蘭',
  '荣': '栄', '丽': '麗', '胜': '勝', '实': '実',
  '贵': '貴', '义': '義', '鸟': '鳥', '马': '馬',
  '带': '帯', '门': '門', '汉': '漢', '间': '間',
  '发': '発', '单': '単', '总': '総', '宽': '寛',
  '滨': '浜', '关': '関', '变': '変', '艺': '芸',
  '齐': '斉', '斋': '斎', '庄': '荘', '渔': '漁',
  '亚': '亜',
}

function toJP(s: string): string {
  return s.split('').map(c => S2J[c] ?? c).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { query } = await req.json()
    const raw = (query ?? '').trim()
    if (!raw) return new Response(JSON.stringify([]), { headers: { ...cors, 'Content-Type': 'application/json' } })

    const jp = toJP(raw)

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Build OR filter: always search the converted (Japanese) form;
    // if input contained simplified chars, also search the original
    const terms = jp !== raw
      ? `name.ilike.%${raw}%,name.ilike.%${jp}%,brewery_name.ilike.%${raw}%,brewery_name.ilike.%${jp}%`
      : `name.ilike.%${raw}%,brewery_name.ilike.%${raw}%,name_romaji.ilike.%${raw}%,name_zh.ilike.%${raw}%`

    const { data } = await db
      .from('sake_products')
      .select('id,name,brewery_name,region,type,rice,yeast,polishing,alcohol,smv,acidity')
      .or(terms)
      .order('name')
      .limit(10)

    return new Response(JSON.stringify(data ?? []), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
