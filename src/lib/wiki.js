// Sake terminology wiki — ja / zh / en
export const WIKI_TERMS = [
  {
    id: 'junmai',
    terms: { ja: ['純米'], zh: ['純米', '纯米'], en: ['junmai'] },
    title: { ja: '純米', zh: '純米', en: 'Junmai' },
    body: {
      ja: '醸造アルコールを一切添加せず、米・米麹・水だけで醸した日本酒。米本来の旨味・コクが出やすく、燗酒でも美味しい。',
      zh: '不添加酿造酒精，仅以米、米麴、水酿成的日本酒。米本身的旨味和醇厚感明显，热饮风味也佳。',
      en: 'Sake brewed from only rice, koji, and water — no added alcohol. Rich, full-bodied, and often excellent warm.',
    },
  },
  {
    id: 'ginjo',
    terms: { ja: ['吟醸'], zh: ['吟釀', '吟酿'], en: ['ginjo'] },
    title: { ja: '吟醸', zh: '吟釀', en: 'Ginjo' },
    body: {
      ja: '精米歩合60%以下の米を使い、低温でゆっくり発酵させた日本酒。華やかな果実香（吟醸香）が特徴。',
      zh: '使用精米步合60%以下的米，低温缓慢发酵。以华丽的果香（吟酿香）为特征。',
      en: 'Sake made from rice polished to at least 60%, fermented slowly at low temperatures. Known for its fruity "ginjo" aroma.',
    },
  },
  {
    id: 'daiginjo',
    terms: { ja: ['大吟醸'], zh: ['大吟釀', '大吟酿'], en: ['daiginjo'] },
    title: { ja: '大吟醸', zh: '大吟釀', en: 'Daiginjo' },
    body: {
      ja: '精米歩合50%以下という高精白の米を使った日本酒。吟醸の中でも最高クラス。繊細でエレガントな香りと味わいが魅力。',
      zh: '使用精米步合50%以下高精白米酿造，是吟酿中的最高级别。以细腻优雅的香气和口感为特征。',
      en: 'The premium tier of ginjo, polished to 50% or less. Delicate, elegant aromas with a refined finish.',
    },
  },
  {
    id: 'honjozo',
    terms: { ja: ['本醸造'], zh: ['本釀造', '本酿造'], en: ['honjozo'] },
    title: { ja: '本醸造', zh: '本釀造', en: 'Honjozo' },
    body: {
      ja: '醸造アルコールを少量添加した日本酒。添加量は白米重量の10%以下と規定されている。軽快でスッキリした飲み口。',
      zh: '添加少量酿造酒精的日本酒，添加量规定为白米重量10%以下。口感轻快清爽。',
      en: 'A small amount of distilled alcohol is added (regulated at ≤10% of rice weight). Light, crisp, and easy-drinking.',
    },
  },
  {
    id: 'tokubetsu-junmai',
    terms: { ja: ['特別純米'], zh: ['特別純米', '特别纯米'], en: ['tokubetsu junmai'] },
    title: { ja: '特別純米', zh: '特別純米', en: 'Tokubetsu Junmai' },
    body: {
      ja: '精米歩合60%以下か特別な製造方法で造られた純米酒。蔵元が「特別」と認める品質を持つ。',
      zh: '精米步合60%以下或采用特殊酿造方法的純米酒，由蔵元认定具有"特别"品质。',
      en: 'A junmai polished to 60% or less, or made by a special method declared by the brewery.',
    },
  },
  {
    id: 'futsushu',
    terms: { ja: ['普通酒'], zh: ['普通酒'], en: ['futsushu'] },
    title: { ja: '普通酒', zh: '普通酒', en: 'Futsushu' },
    body: {
      ja: '特定名称酒の基準を満たさない一般的な日本酒。大量生産が多く日常酒として親しまれている。',
      zh: '不符合特定名称酒标准的普通日本酒，多为大量生产，是日常饮用酒。',
      en: 'Sake that doesn\'t meet the criteria for "tokutei meisho-shu." Mass-produced and everyday-friendly.',
    },
  },
  {
    id: 'seimaibuai',
    terms: { ja: ['精米歩合'], zh: ['精米步合', '精米歩合'], en: ['polishing ratio', 'seimaibuai'] },
    title: { ja: '精米歩合', zh: '精米步合', en: 'Polishing Ratio' },
    body: {
      ja: '玄米を削った後に残る白米の割合（%）。数字が小さいほど多く削られ、雑味が少なく繊細な味になる。例：50% = 半分削った。',
      zh: '精米后剩余白米占玄米的比例（%）。数字越小，磨掉越多，杂味越少，口感越细腻。如50%即磨去了一半。',
      en: 'The percentage of rice remaining after polishing. Lower % = more polished = cleaner, more refined flavor. 50% means half the grain was removed.',
    },
  },
  {
    id: 'nihonshu-do',
    terms: { ja: ['日本酒度'], zh: ['日本酒度'], en: ['nihonshu-do', 'SMV', 'sake meter value'] },
    title: { ja: '日本酒度', zh: '日本酒度 (SMV)', en: 'Nihonshu-do / SMV' },
    body: {
      ja: '日本酒の甘辛を表す指標。プラスが辛口、マイナスが甘口。±0付近が中間。一般的に+3以上は辛口、−3以下は甘口とされる。',
      zh: '表示日本酒甘辛度的指标。正值为辛口（干），负值为甘口（甜）。±0附近为中间。通常+3以上为辛口，-3以下为甘口。',
      en: 'A measure of sweetness/dryness. Positive = drier, negative = sweeter. ±0 is neutral; +3 and above is dry, −3 and below is sweet.',
    },
  },
  {
    id: 'sando',
    terms: { ja: ['酸度'], zh: ['酸度'], en: ['acidity', 'sando'] },
    title: { ja: '酸度', zh: '酸度', en: 'Acidity' },
    body: {
      ja: '日本酒に含まれる酸の量。数値が高いほど酸味が強くなる傾向。一般的に1.0〜1.8の範囲が多い。辛口感や旨味にも影響する。',
      zh: '日本酒中酸的含量。数值越高酸味越强。通常在1.0～1.8之间。影响辛口感和旨味的深度。',
      en: 'Measures total acidity. Higher values = more acidic. Typically 1.0–1.8. Affects how dry or rich the sake tastes.',
    },
  },
  {
    id: 'namazake',
    terms: { ja: ['生酒', '生貯蔵酒'], zh: ['生酒', '生貯藏酒'], en: ['namazake', 'nama sake'] },
    title: { ja: '生酒', zh: '生酒', en: 'Namazake' },
    body: {
      ja: '火入れ（加熱殺菌）を一切行っていない日本酒。フレッシュで活き活きとした風味が楽しめるが、要冷蔵で日持ちしない。',
      zh: '完全未经火入れ（加热杀菌）的日本酒。风味新鲜活泼，但需冷藏保存，不耐久放。',
      en: 'Unpasteurized sake. Fresh, vibrant, and lively — but requires refrigeration and has a shorter shelf life.',
    },
  },
  {
    id: 'genshu',
    terms: { ja: ['原酒'], zh: ['原酒'], en: ['genshu'] },
    title: { ja: '原酒', zh: '原酒', en: 'Genshu' },
    body: {
      ja: '加水せずに絞ったままの日本酒。アルコール度数は17〜20度程度と高め。濃厚で力強い味わいが特徴。',
      zh: '不加水稀释、直接压榨的日本酒。酒精度较高，约17～20度。口感浓厚强劲。',
      en: 'Undiluted sake straight from the press. Alcohol content is higher (17–20%) with a bold, concentrated flavor.',
    },
  },
  {
    id: 'kimoto',
    terms: { ja: ['生酛'], zh: ['生酛', '生酛系'], en: ['kimoto'] },
    title: { ja: '生酛', zh: '生酛', en: 'Kimoto' },
    body: {
      ja: '伝統的な酒母（もと）の製法。乳酸菌を自然に育てる方法で手間がかかるが、複雑で深みのある味わいになる。',
      zh: '传统的酒母（酵母培养基）制法。自然培育乳酸菌，耗时费力，但能带来复杂而有深度的风味。',
      en: 'A traditional yeast-starter method where lactic acid bacteria grow naturally. Labor-intensive, producing complex, layered flavors.',
    },
  },
  {
    id: 'yamahai',
    terms: { ja: ['山廃'], zh: ['山廃', '山廃系'], en: ['yamahai'] },
    title: { ja: '山廃', zh: '山廃', en: 'Yamahai' },
    body: {
      ja: '生酛から山おろしの工程を省いた酒母製法。独特の酸味・旨味・コクが生まれ、温度帯を選ばず楽しめる。',
      zh: '省略生酛中"山おろし"工序的酒母制法。产生独特的酸味、旨味和醇厚感，适合各种温度饮用。',
      en: 'A variant of kimoto that skips the "yamaoroshi" grinding step. Produces sake with distinctive acidity, umami, and body.',
    },
  },
  {
    id: 'hiire',
    terms: { ja: ['火入れ'], zh: ['火入れ', '加熱殺菌'], en: ['hiire', 'pasteurization'] },
    title: { ja: '火入れ', zh: '火入れ（低温殺菌）', en: 'Hiire (Pasteurization)' },
    body: {
      ja: '約65℃で加熱して酵素の働きを止め、品質を安定させる工程。通常1回または2回行う。生酒はこれを行わない。',
      zh: '在约65℃加热，停止酶的活动，稳定品质的工序。通常进行一至两次。生酒不经过此工序。',
      en: 'Heating to ~65°C to stop enzyme activity and stabilize the sake. Usually done once or twice. Namazake skips this step.',
    },
  },
  {
    id: 'amakuchi',
    terms: { ja: ['甘口'], zh: ['甘口', '甜口'], en: ['amakuchi', 'sweet'] },
    title: { ja: '甘口', zh: '甘口（甜）', en: 'Amakuchi (Sweet)' },
    body: {
      ja: '糖分が多く甘みを感じやすい日本酒。日本酒度がマイナスになることが多い。',
      zh: '糖分较多、甜味明显的日本酒。日本酒度多为负值。',
      en: 'Sake with notable sweetness, often indicated by a negative nihonshu-do value.',
    },
  },
  {
    id: 'karakuchi',
    terms: { ja: ['辛口'], zh: ['辛口', '干口'], en: ['karakuchi', 'dry'] },
    title: { ja: '辛口', zh: '辛口（干）', en: 'Karakuchi (Dry)' },
    body: {
      ja: '甘みが少なくシャープな飲み口の日本酒。日本酒度がプラスになることが多い。食事に合わせやすい。',
      zh: '甜味少、口感犀利的日本酒。日本酒度多为正值，易于配餐。',
      en: 'Sake with little sweetness and a sharp, clean finish. Often has a positive nihonshu-do. Pairs well with food.',
    },
  },
  {
    id: 'shiboritate',
    terms: { ja: ['しぼりたて', '搾りたて'], zh: ['搾りたて', '新鮮生酒'], en: ['shiboritate'] },
    title: { ja: 'しぼりたて', zh: '搾りたて（新鮮）', en: 'Shiboritate' },
    body: {
      ja: '搾った直後の新酒。フレッシュで若々しい風味が特徴。多くは冬〜春の季節限定品として出回る。',
      zh: '刚压榨出的新酒。风味新鲜年轻，多为冬春季节限定款。',
      en: 'Freshly pressed new sake. Fresh, lively, and youthful. Usually a seasonal winter–spring release.',
    },
  },
  {
    id: 'toji',
    terms: { ja: ['杜氏'], zh: ['杜氏', '藏匠'], en: ['toji', 'master brewer'] },
    title: { ja: '杜氏', zh: '杜氏（藏匠）', en: 'Toji (Master Brewer)' },
    body: {
      ja: '酒蔵で酒造りを指揮する最高責任者。長年の経験と技術を持ち、その蔵の味わいを決定づける存在。',
      zh: '酒蔵中负责酿酒的最高技术负责人，以多年经验和技艺决定蔵元风格。',
      en: 'The master brewer who oversees all sake production. Their skill and philosophy define the character of the brewery.',
    },
  },
  {
    id: 'kuramoto',
    terms: { ja: ['蔵元'], zh: ['蔵元', '酒廠', '酒厂'], en: ['kuramoto', 'brewery'] },
    title: { ja: '蔵元', zh: '蔵元（酒廠）', en: 'Kuramoto (Brewery)' },
    body: {
      ja: '日本酒を製造・販売する酒蔵のこと。または蔵を経営する家・オーナーを指す場合もある。',
      zh: '酿造和销售日本酒的酒厂，有时也指经营酒厂的家族或业主。',
      en: 'The sake brewery, or the family/owner that operates it.',
    },
  },
  {
    id: 'umami',
    terms: { ja: ['旨味', '旨み', '旨口'], zh: ['旨味', '鮮味', '鲜味'], en: ['umami'] },
    title: { ja: '旨味', zh: '旨味（鮮味）', en: 'Umami' },
    body: {
      ja: '「美味しさ」を構成する第五の味覚。日本酒では米のグルタミン酸などが生み出す深みのある味わいを指す。',
      zh: '构成"美味"的第五种基本味觉。在日本酒中指米中谷氨酸等产生的深厚醇美感。',
      en: 'The "fifth taste" — savory depth and richness. In sake, it comes from amino acids like glutamate derived from the rice.',
    },
  },
  {
    id: 'kire',
    terms: { ja: ['キレ', '切れ'], zh: ['切れ', '乾淨收尾', '干净收尾'], en: ['kire', 'clean finish'] },
    title: { ja: 'キレ', zh: '切れ（乾淨收尾）', en: 'Kire (Clean Finish)' },
    body: {
      ja: '飲み込んだ後に余韻が長引かず、口の中がすっきりする感覚。辛口の日本酒に多く見られる特徴。',
      zh: '饮后余味不拖沓、口感清爽利落的感觉，多见于辛口日本酒。',
      en: 'A clean, quick finish with little lingering aftertaste. A hallmark of dry sake.',
    },
  },
]

// Build a flat lookup for fast keyword detection
// zh-tw uses the zh terms array (which already contains both 繁/简 variants)
export function buildTermIndex(lang) {
  const effectiveLang = lang === 'zh-tw' ? 'zh' : lang
  const index = []
  for (const term of WIKI_TERMS) {
    const words = term.terms[effectiveLang] ?? term.terms.ja ?? []
    for (const w of words) {
      if (w) index.push({ word: w, term })
    }
  }
  // Sort longest first to avoid partial matches
  index.sort((a, b) => b.word.length - a.word.length)
  return index
}

export function segmentText(text, index) {
  if (!text || !index.length) return [{ type: 'text', content: text }]
  const parts = []
  let i = 0
  outer: while (i < text.length) {
    for (const { word, term } of index) {
      if (text.startsWith(word, i)) {
        parts.push({ type: 'term', content: word, term })
        i += word.length
        continue outer
      }
    }
    // Append to last text segment or create new
    if (parts.length && parts[parts.length - 1].type === 'text') {
      parts[parts.length - 1].content += text[i]
    } else {
      parts.push({ type: 'text', content: text[i] })
    }
    i++
  }
  return parts
}
