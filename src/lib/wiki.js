// Sake terminology wiki — ja / zh / en
export const WIKI_TERMS = [
  {
    id: 'junmai',
    group: 'type',
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
    group: 'type',
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
    group: 'type',
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
    group: 'type',
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
    group: 'type',
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
    group: 'type',
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
    group: 'ingredient',
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
    group: 'flavor',
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
    group: 'flavor',
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
    group: 'method',
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
    group: 'method',
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
    group: 'method',
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
    group: 'method',
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
    group: 'method',
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
    group: 'flavor',
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
    group: 'flavor',
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
    group: 'method',
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
    group: 'people',
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
    group: 'people',
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
    group: 'flavor',
    terms: { ja: ['旨味', '旨み', '旨口'], zh: ['旨味', '鮮味', '鲜味'], en: ['umami'] },
    title: { ja: '旨味', zh: '旨味（鮮味）', en: 'Umami' },
    body: {
      ja: '「美味しさ」を構成する第五の味覚。日本酒では米のグルタミン酸などが生み出す深みのある味わいを指す。',
      zh: '构成"美味"的第五种基本味觉。在日本酒中指米中谷氨酸等产生的深厚醇美感。',
      en: 'The "fifth taste" — savory depth and richness. In sake, it comes from amino acids like glutamate derived from the rice.',
    },
  },
  // ── 酒米 ───────────────────────────────────────────────────────────
  {
    id: 'sake-rice',
    group: 'ingredient',
    terms: { ja: ['酒米', '酒造好適米'], zh: ['酒米', '釀酒米'], en: ['sake rice'] },
    title: { ja: '酒米（酒造好適米）', zh: '酒米（釀酒適性米）', en: 'Sake Rice' },
    body: {
      ja: '日本酒醸造に使われる専用米の総称。食用米に比べ粒が大きく、中心部の白い心白が発達している。タンパク質・脂質が少ないため雑味が出にくく、麹菌が浸透しやすい。山田錦・五百万石・雄町などが代表品種。',
      zh: '专门用于酿造日本酒的大米总称。与食用米相比颗粒大、中心心白发达，蛋白质和脂质少，杂味少，麴菌易于渗透。山田锦、五百万石、雄町为代表品种。',
      en: 'Rice varieties specifically bred for sake brewing. Larger grains with a prominent starchy core (shinpaku), low in protein and fat. The shinpaku allows koji mold to penetrate deeply, producing cleaner, more refined sake. Yamadanishiki, Gohyakumangoku, and Omachi are the leading varieties.',
    },
  },
  {
    id: 'yamadanishiki',
    group: 'major-rice',
    terms: { ja: ['山田錦'], zh: ['山田錦'], en: ['yamadanishiki'] },
    title: { ja: '山田錦', zh: '山田錦', en: 'Yamadanishiki' },
    body: {
      ja: '兵庫県生まれの「酒米の王様」。心白が大きくタンパク質が少ないため、繊細で上品な大吟醸に最適。全国の名醸蔵で広く使われる最高峰の酒米。',
      zh: '兵库县出产的"酒米之王"。心白大、蛋白质少，最适合酿造细腻高雅的大吟酿，全国名酒厂广泛使用，是公认的最高品质酒米。',
      en: 'The "king of sake rice," from Hyogo Prefecture. Its large shinpaku and low protein content make it ideal for elegant daiginjo. The most prized and widely-used premium sake rice in Japan.',
    },
  },
  {
    id: 'gohyakumangoku',
    group: 'major-rice',
    terms: { ja: ['五百万石'], zh: ['五百萬石', '五百万石'], en: ['gohyakumangoku'] },
    title: { ja: '五百万石', zh: '五百萬石', en: 'Gohyakumangoku' },
    body: {
      ja: '新潟県原産の酒米。淡麗辛口スタイルに向き、スッキリとした透明感のある味わいの酒ができる。生産量は山田錦に次ぎ全国2位。新潟の「淡麗辛口」ブームを支えた品種。',
      zh: '新潟县原产酒米，适合淡丽辛口风格，能酿出清爽透明感强的酒。产量居全国第二，是支撑新潟"淡丽辛口"风潮的功勋品种。',
      en: 'An Niigata-origin sake rice perfectly suited to the light, dry style. Produces clean, transparent-tasting sake. Japan\'s second most widely grown sake rice after Yamadanishiki, synonymous with Niigata\'s celebrated "tanrei karakuchi" profile.',
    },
  },
  {
    id: 'omachi',
    group: 'major-rice',
    terms: { ja: ['雄町'], zh: ['雄町'], en: ['omachi'] },
    title: { ja: '雄町', zh: '雄町', en: 'Omachi' },
    body: {
      ja: '岡山県備前市産の古代米。山田錦など多くの酒米のルーツで、明治時代から続く歴史ある品種。力強い旨味とコク、野趣あふれる風味が特徴。「雄町は飲みごたえがある」といわれ、ファンが多い。',
      zh: '冈山县备前市产的古代品种，是山田锦等众多酒米的原祖，历史悠久。以力道强劲的旨味、醇厚感和野性风味著称，素有"雄町有嚼劲"之说，拥有众多忠实粉丝。',
      en: 'An ancient variety from Bizen, Okayama — the ancestral rice of Yamadanishiki and many other modern sake rices. Known for bold umami, body, and a wild, earthy character. A cult favorite among sake enthusiasts who seek depth over delicacy.',
    },
  },
  {
    id: 'miyamanishiki',
    group: 'regional-rice',
    terms: { ja: ['美山錦'], zh: ['美山錦'], en: ['miyamanishiki'] },
    title: { ja: '美山錦', zh: '美山錦', en: 'Miyamanishiki' },
    body: {
      ja: '長野県生まれの耐冷性に優れた酒米。東北・信州の寒冷地で広く栽培される。すっきりした上品な味わいで吟醸酒に向く。長野や東北の蔵に欠かせない品種。',
      zh: '长野县原产的耐寒性酒米，广泛栽培于东北和信州寒冷地区。口感清爽高雅，适合酿造吟酿酒，是长野和东北地区酒厂不可或缺的品种。',
      en: 'A cold-resistant sake rice from Nagano, widely grown across Tohoku and Shinshu. Produces clean, elegant sake well-suited to ginjo brewing. A staple variety for breweries in cold northern regions.',
    },
  },
  {
    id: 'aiyama',
    group: 'regional-rice',
    terms: { ja: ['愛山'], zh: ['愛山'], en: ['aiyama'] },
    title: { ja: '愛山', zh: '愛山', en: 'Aiyama' },
    body: {
      ja: '生産量が極めて少ない希少な酒米。「幻の酒米」とも呼ばれ、甘みのある華やかな香りと深い旨味を引き出すとされる。高価なため特別なラインナップや限定品に使われることが多い。',
      zh: '产量极为稀少的珍贵酒米，又称"梦幻酒米"。能引出甘美华丽的香气和深厚旨味，因价格高昂，多用于特别系列和限量款。',
      en: 'An exceptionally rare sake rice nicknamed the "phantom rice." Said to draw out sweet, floral aromas and profound umami. Its scarcity and high price mean it\'s typically reserved for limited and prestige releases.',
    },
  },
  {
    id: 'hattannishiki',
    group: 'regional-rice',
    terms: { ja: ['八反錦', '八反'], zh: ['八反錦'], en: ['hattannishiki'] },
    title: { ja: '八反錦', zh: '八反錦', en: 'Hattannishiki' },
    body: {
      ja: '広島県の酒米。三段仕込みを生んだ広島の醸造文化と相性が良く、まろやかでふくよかな味わいになる。八反35号を改良した品種で、広島の蔵元に多く使われる。',
      zh: '广岛县酒米。与孕育了三段仕込的广岛酿造文化相性极佳，能酿出圆润丰满的口感。由八反35号改良而来，是广岛酒厂的代表品种。',
      en: 'A Hiroshima sake rice with deep roots in that region\'s brewing culture. Produces mellow, full-bodied sake. Developed from the Hattan 35 variety, it remains central to Hiroshima\'s distinctive sake identity.',
    },
  },
  {
    id: 'kamenoo',
    group: 'regional-rice',
    terms: { ja: ['亀の尾', '亀ノ尾'], zh: ['龜の尾', '亀の尾'], en: ['kamenoo', 'kame no o'] },
    title: { ja: '亀の尾', zh: '龜の尾', en: 'Kame no O' },
    body: {
      ja: '明治時代に東北で生まれた古代品種。一時は絶滅寸前まで衰退したが復活し、今では個性的な旨味と野趣あふれる風味で注目を集める。「くどき上手」など著名な銘柄にも使われる。',
      zh: '明治时代诞生于东北的古代品种，曾一度濒临绝种，如今成功复活。以独特旨味和野性风味重获关注，"くどき上手"等著名品牌也以此米酿造。',
      en: 'An ancient Tohoku rice from the Meiji era that nearly went extinct before being revived. Now prized for its wild, distinctive umami character. Featured in notable sake brands and cherished for its deep historical roots.',
    },
  },
  {
    id: 'dewasansan',
    group: 'major-rice',
    terms: { ja: ['出羽燦々'], zh: ['出羽燦々'], en: ['dewasansan'] },
    title: { ja: '出羽燦々', zh: '出羽燦々', en: 'Dewasansan' },
    body: {
      ja: '山形県が「山田錦を超える」を目標に開発した酒米。大粒で心白が大きく、爽やかでクリーンな甘みと上品な吟醸香が特徴。山形の「十四代」「出羽桜」など名醸蔵が積極的に採用し、山形県のオリジナリティを象徴する品種。',
      zh: '山形县以"超越山田锦"为目标开发的酒米，颗粒大、心白大，以清爽干净的甘味和高雅吟酿香著称，被"十四代"、"出羽桜"等山形名蔵积极采用，是象征山形原创性的代表品种。',
      en: 'A Yamagata-developed sake rice bred to surpass Yamadanishiki. Large grain with prominent shinpaku, producing clean, fresh sweetness and refined ginjo aromas. Adopted by prestigious Yamagata breweries like Juyondai and Dewazakura — the face of Yamagata sake identity.',
    },
  },
  {
    id: 'koshitanrei',
    group: 'major-rice',
    terms: { ja: ['越淡麗'], zh: ['越淡麗'], en: ['koshitanrei'] },
    title: { ja: '越淡麗', zh: '越淡麗', en: 'Koshitanrei' },
    body: {
      ja: '新潟県が山田錦と五百万石を交配して開発した酒米。大粒で心白が明確、栽培しやすく淡麗でありながら旨味のある深みを生む。2004年登場の比較的新しい品種で、新潟の高品質路線を支える中核米。',
      zh: '新潟县以山田锦和五百万石交配育成，颗粒大、心白明确，易于栽培，能酿出淡丽而有旨味深度的酒。2004年登场，是支撑新潟高品质路线的中坚品种。',
      en: 'Niigata\'s premium rice, crossing Yamadanishiki and Gohyakumangoku. Large grain, clear shinpaku, easy to cultivate. Produces sake that is clean and dry yet layered with depth. Debuted 2004, now central to Niigata\'s high-quality sake identity.',
    },
  },
  {
    id: 'akita-sake-komachi',
    group: 'regional-rice',
    terms: { ja: ['秋田酒こまち'], zh: ['秋田酒こまち'], en: ['akita sake komachi'] },
    title: { ja: '秋田酒こまち', zh: '秋田酒こまち', en: 'Akita Sake Komachi' },
    body: {
      ja: '秋田県が開発した酒造好適米。山田錦並みの大粒と発達した心白を持ち、上品で華やかな吟醸香と穏やかな旨味を生む。「雪の茅舎」「刈穂」など秋田の名蔵が使用。冷涼な気候を生かした高品質な酒を実現する。',
      zh: '秋田县开发的酿酒专用米，颗粒大、心白发达，堪比山田锦，产生高雅华丽的吟酿香和温和旨味，"雪の茅舎"、"刈穂"等秋田名蔵使用，充分发挥寒冷气候优势。',
      en: 'Akita\'s premium sake rice, rivaling Yamadanishiki in grain size and shinpaku development. Produces elegant, floral ginjo aromas with gentle umami. Used by top Akita breweries including Yuki no Bosha — a showcase of cold-climate brewing.',
    },
  },
  {
    id: 'yukimegami',
    group: 'regional-rice',
    terms: { ja: ['雪女神'], zh: ['雪女神'], en: ['yukimegami'] },
    title: { ja: '雪女神', zh: '雪女神', en: 'Yukimegami' },
    body: {
      ja: '山形県が2014年に品種登録した新しい酒米。出羽燦々のさらなる改良を目指して開発され、繊細でフルーティーな香りと柔らかい旨味が特徴。山形の大吟醸クラスを中心に急速に普及している注目品種。',
      zh: '山形县2014年登记注册的新酒米，以进一步改良出羽燦々为目标，以细腻果香和柔和旨味为特征，近年迅速在山形大吟酿级别酒中普及。',
      en: 'A recent Yamagata sake rice (registered 2014), bred to surpass Dewasansan. Delicate, fruity aromas and soft umami. Rapidly gaining popularity for daiginjo-class sake from Yamagata breweries.',
    },
  },
  {
    id: 'hanaomoi',
    group: 'regional-rice',
    terms: { ja: ['華想い'], zh: ['華想い'], en: ['hanaomoi'] },
    title: { ja: '華想い', zh: '華想い', en: 'Hanaomoi' },
    body: {
      ja: '福島県オリジナルの酒米。山田錦の血を引き、大粒で心白が大きく、フルーティーで華やかな吟醸香を引き出しやすい。「飛露喜」など福島の蔵で使われ、福島が全国新酒鑑評会で連続金賞を誇る「吟醸王国」の地位を支える品種のひとつ。',
      zh: '福岛县原创酒米，承袭山田锦血统，颗粒大、心白大，易引出果香华丽的吟酿香，"飛露喜"等福岛酒厂有使用，是支撑福岛"吟酿王国"地位的重要品种之一。',
      en: 'Fukushima\'s original sake rice, descended from Yamadanishiki. Large grain and shinpaku, draws out fruity, floral ginjo aromas. One of the variety pillars behind Fukushima\'s "ginjo kingdom" reputation, used by breweries like Hiroki.',
    },
  },
  {
    id: 'ginpu',
    group: 'regional-rice',
    terms: { ja: ['吟風'], zh: ['吟風'], en: ['ginpu'] },
    title: { ja: '吟風', zh: '吟風', en: 'Ginpu' },
    body: {
      ja: '北海道が1997年に品種登録した酒米。北海道の厳しい気候に適応した耐冷性を持ち、さっぱりした淡麗な酸味と穏やかな旨味が特徴。「国稀」「男山」「千歳鶴」など道内の蔵が広く使用する、道産酒米の代表品種。',
      zh: '北海道1997年登记注册的酒米，适应严寒气候，具备耐冷性，以清爽淡丽的酸味和温和旨味为特征，是"国稀"、"男山"、"千歳鶴"等北海道酒厂广泛使用的道产代表品种。',
      en: 'Hokkaido\'s signature sake rice (registered 1997), bred to withstand the island\'s severe cold. Clean, dry flavor with pleasant acidity. The go-to rice for Hokkaido breweries like Kunimare, Otokoyama, and Chitose Tsuru.',
    },
  },
  {
    id: 'tsuyuhakase',
    group: 'regional-rice',
    terms: { ja: ['露葉風'], zh: ['露葉風'], en: ['tsuyuhakase'] },
    title: { ja: '露葉風', zh: '露葉風', en: 'Tsuyuhakase' },
    body: {
      ja: '奈良県に古くから伝わる在来の酒造好適米。醸造発祥地・大和の風土に根ざし、米の甘みと旨味が強く、複雑な味わいの酒になりやすい。「風の森」で知られる油長酒造が積極的に使用し、奈良酒の個性を表現する品種として注目される。',
      zh: '奈良县古老传承的在来酿酒适性米，根植于被誉为酿酒发祥地的大和风土，甜味和旨味强，易酿出复杂口感，以"风の森"著称的油长酒造积极采用，作为展现奈良酒个性的品种备受关注。',
      en: 'A native Nara sake rice with ancient roots in the birthplace of Japanese brewing. Rich in sweetness and umami, producing complex, distinctive sake. Championed by Yucho Shuzo (Kaze no Mori) as an expression of Nara\'s unique brewing heritage.',
    },
  },
  {
    id: 'senbonnishiki',
    group: 'regional-rice',
    terms: { ja: ['千本錦'], zh: ['千本錦'], en: ['senbonnishiki'] },
    title: { ja: '千本錦', zh: '千本錦', en: 'Senbonnishiki' },
    body: {
      ja: '広島県が山田錦と中生新千本を交配して開発した酒米。八反錦とともに広島を代表する品種で、大粒で心白が明確。スッキリした中にも深みがあり、吟醸酒を中心に広島の蔵に幅広く使われる。',
      zh: '广岛县以山田锦和中生新千本交配育成的酒米，与八反錦同为广岛代表品种，颗粒大、心白明确，清爽中带深度，广泛用于广岛吟酿酒酿造。',
      en: 'Hiroshima\'s developed sake rice, crossing Yamadanishiki and Nakate Shinsenbon. Alongside Hattannishiki, it defines modern Hiroshima sake — large grain, clear shinpaku, clean yet flavorful. Widely used for ginjo brewing across the prefecture.',
    },
  },
  {
    id: 'tamasakae',
    group: 'regional-rice',
    terms: { ja: ['玉栄'], zh: ['玉栄'], en: ['tamasakae'] },
    title: { ja: '玉栄', zh: '玉栄', en: 'Tamasakae' },
    body: {
      ja: '滋賀県農業試験場が育成した酒米。心白が大きく旨味が豊かで、醇厚でボリューム感のある酒になりやすい。近畿・東海地方の蔵元に使われ、京都・伏見の蔵にも採用されている。',
      zh: '滋贺县农业试验场育成的酒米，心白大、旨味丰富，易酿出醇厚丰满口感，近畿、东海地区以及京都伏见的酒厂有所采用。',
      en: 'Developed by Shiga Prefecture, with a large shinpaku and rich umami potential. Produces full-bodied, voluminous sake. Used by breweries across Kinki and Tokai, including Fushimi in Kyoto.',
    },
  },
  {
    id: 'wakamizuki',
    group: 'regional-rice',
    terms: { ja: ['若水'], zh: ['若水'], en: ['wakamizuki'] },
    title: { ja: '若水', zh: '若水', en: 'Wakamizuki' },
    body: {
      ja: '愛知県が開発した酒米。大粒で心白の発達が良く、柔らかい旨味とふくよかな甘みを引き出す。「醸し人九平次」「蓬莱泉」など愛知の名蔵が使用し、岐阜・三重などにも普及している。',
      zh: '爱知县开发的酒米，颗粒大、心白发达，能引出柔和旨味和丰盈甘味，"醸し人九平次"、"蓬莱泉"等爱知名蔵使用，也在岐阜、三重等地推广。',
      en: 'Aichi\'s sake rice with large grain and well-developed shinpaku. Draws out soft umami and round sweetness. Used by top Aichi breweries like Kuheiji and Hojusen, and now spread to neighboring Gifu and Mie.',
    },
  },
  {
    id: 'kinmonnishiki',
    group: 'regional-rice',
    terms: { ja: ['金紋錦'], zh: ['金紋錦'], en: ['kinmonnishiki'] },
    title: { ja: '金紋錦', zh: '金紋錦', en: 'Kinmonnishiki' },
    body: {
      ja: '長野県が育成した酒米。山田錦の系統を引き、信州の冷涼な気候でも安定して生育する。豊かな旨味とふくよかな甘みが特徴で、「善哉」「大信州」など長野の蔵が地元米へのこだわりとして使用する。',
      zh: '长野县培育的酒米，承袭山田锦血统，在信州寒冷气候下也能稳定生长，以丰富旨味和丰盈甘味为特征，"善哉"、"大信州"等长野酒厂因坚持使用本地米而采用。',
      en: 'A Nagano sake rice descended from Yamadanishiki, bred to thrive in the cool Shinshu climate. Rich umami with round sweetness. Used by local Nagano breweries as an expression of their commitment to homegrown rice.',
    },
  },
  {
    id: 'ipponjime',
    group: 'regional-rice',
    terms: { ja: ['一本〆'], zh: ['一本〆'], en: ['ipponjime'] },
    title: { ja: '一本〆', zh: '一本〆', en: 'Ipponjime' },
    body: {
      ja: '新潟県が育成したオリジナル酒米。五百万石と山田錦の交配で生まれ、淡麗でキレのある新潟スタイルに合うスッキリとした味わいを生む。地元米使用にこだわる新潟の蔵元を中心に注目されている。',
      zh: '新潟县培育的原创酒米，由五百万石和山田锦交配而成，能酿出契合新潟淡丽辛口风格的清爽口感，受到坚持使用本地米的新潟酒厂关注。',
      en: 'A Niigata original, crossing Gohyakumangoku and Yamadanishiki. Produces clean, crisp sake matching Niigata\'s lean, dry style. Favored by breweries committed to using locally grown rice.',
    },
  },
  {
    id: 'kairyo-omachi',
    group: 'regional-rice',
    terms: { ja: ['改良雄町', 'みつひかり'], zh: ['改良雄町'], en: ['kairyo omachi'] },
    title: { ja: '改良雄町', zh: '改良雄町', en: 'Kairyo Omachi' },
    body: {
      ja: '雄町をベースに耐倒伏性などを改良した品種。雄町の力強い旨味とコクを受け継ぎながら、栽培の難しさを緩和している。兵庫・岡山などで栽培され、雄町ファンに好まれる銘柄にも使われる。',
      zh: '以雄町为基础改良耐倒伏性等特性的品种，继承雄町力道强劲的旨味和醇厚感，同时降低了栽培难度，在兵库、冈山等地栽培，被雄町爱好者喜爱的品牌所使用。',
      en: 'An improved strain of Omachi, bred for better lodging resistance while retaining its bold umami and body. Grown in Hyogo and Okayama, used in many of the same breweries that champion classic Omachi.',
    },
  },
  {
    id: 'ginnoyume',
    group: 'regional-rice',
    terms: { ja: ['吟の夢', '吟の夢(高知)'], zh: ['吟之夢', '吟の夢'], en: ['ginnoyume', 'gin no yume'] },
    title: { ja: '吟の夢', zh: '吟の夢', en: 'Gin no Yume' },
    body: {
      ja: '高知県が「山田錦」×「ヒノヒカリ」を交配して2001年に品種登録した酒米。大粒で心白発現が良く、暖地でも安定して育つ。淡麗ながら米の甘みと旨味を素直に引き出し、フルーティーな吟醸香に向く。「土佐鶴」「酔鯨」など県内蔵のフラッグシップに採用。',
      zh: '高知縣以「山田錦」×「ヒノヒカリ」交配、2001年品種登記的酒米。粒大心白發現佳，暖地也能穩定生長。淡麗中能引出米的甘味與旨味，適合果香型吟釀香。「土佐鶴」「酔鯨」等縣內蔵之旗艦酒款採用。',
      en: 'A Kochi sake rice registered in 2001, bred from Yamadanishiki × Hinohikari. Large grain with reliable shinpaku, stable in warm climates. Draws out clean sweetness and umami suited to fruity ginjo aromas. Adopted by flagship Kochi breweries like Tosatsuru and Suigei.',
    },
  },
  {
    id: 'tosarei',
    group: 'regional-rice',
    terms: { ja: ['土佐麗', 'とされい'], zh: ['土佐麗'], en: ['tosarei'] },
    title: { ja: '土佐麗', zh: '土佐麗', en: 'Tosarei' },
    body: {
      ja: '高知県が2017年に品種登録した新しい酒造好適米。「土佐麗」の名の通り、澄んだ酒質と気品を目標に開発された。低精白でも雑味が出にくく、透明感のあるクリアな味わいを生む。県内の若手蔵元による新世代吟醸酒に多く採用されつつある。',
      zh: '高知縣2017年品種登記的新酒造好適米。以「土佐麗」為名，追求澄澈酒質與氣質而開發。低精白亦不易出雑味，能酿出透明感十足的清澈口感。縣內新世代蔵元的新型吟釀酒逐漸採用。',
      en: 'A newly registered (2017) Kochi sake rice bred for clarity and elegance. Even at modest polishing ratios it yields clean, transparent sake with minimal off-flavors. Increasingly used by younger Kochi brewers for next-generation ginjo styles.',
    },
  },
  {
    id: 'matsuyama-mii',
    group: 'regional-rice',
    terms: { ja: ['松山三井', 'まつやまみい'], zh: ['松山三井'], en: ['matsuyama mii', 'matsuyamamii'] },
    title: { ja: '松山三井', zh: '松山三井', en: 'Matsuyama Mii' },
    body: {
      ja: '愛媛県の食用米として1953年に誕生し、後に酒造適性が認められた愛媛の代表酒米。大粒で心白が大きく、まろやかで柔らかな酒質を生む。「石鎚」「梅錦」「賀儀屋」など愛媛の主要蔵が積極的に使用し、県のオリジナリティを象徴する。',
      zh: '愛媛縣1953年育成的原食用米，其後被認定具酒造適性，成為愛媛代表酒米。粒大心白發達，能酿出圓潤柔和的酒質。「石鎚」「梅錦」「賀儀屋」等愛媛主要蔵積極採用，象徵縣的原創性。',
      en: 'Originally a table rice bred in Ehime in 1953, later recognized for brewing use — now Ehime\'s signature sake rice. Large grain and shinpaku produce mellow, soft-textured sake. Championed by leading Ehime breweries like Ishizuchi, Umenishiki, and Kagiya as an expression of local identity.',
    },
  },
  {
    id: 'gin-ginga',
    group: 'regional-rice',
    terms: { ja: ['吟ぎんが', 'ぎんぎんが'], zh: ['吟ぎんが'], en: ['gin ginga', 'ginginga'] },
    title: { ja: '吟ぎんが', zh: '吟ぎんが', en: 'Gin Ginga' },
    body: {
      ja: '岩手県が1998年に品種登録した酒造好適米。県産の「たかね錦」を親に持ち、耐冷性に優れ、寒冷地・岩手で安定した心白発現を実現。柔らかな旨味と穏やかな香りを引き出し、「南部美人」「あさ開」「浜千鳥」など県内蔵の吟醸造りに広く使われる。',
      zh: '岩手縣1998年品種登記的酒造好適米，親米為縣產「たかね錦」，耐冷性優異，在寒冷的岩手能穩定發現心白。引出柔和旨味與溫和香氣，「南部美人」「あさ開」「浜千鳥」等縣內蔵之吟釀造酒廣泛使用。',
      en: 'An Iwate sake rice registered in 1998, descended from local Takanenishiki. Highly cold-resistant with reliable shinpaku formation in Iwate\'s harsh climate. Yields soft umami and gentle aromas. Widely used for ginjo brewing by Nanbu Bijin, Asabiraki, Hamachidori and other Iwate breweries.',
    },
  },
  {
    id: 'saito-no-shizuku',
    group: 'regional-rice',
    terms: { ja: ['西都の雫', 'さいとのしずく'], zh: ['西都の雫', '西都之雫'], en: ['saito no shizuku', 'saitonoshizuku'] },
    title: { ja: '西都の雫', zh: '西都の雫', en: 'Saito no Shizuku' },
    body: {
      ja: '宮崎県が「山田錦」を父に持つ系統から育成した酒造好適米。暖地・宮崎の気候に適応し、大粒で心白が明確。淡麗さの中にしっかりした旨味と滑らかな口当たりを生む。宮崎の「千徳」「杜氏の里」など地元蔵で使われ、南九州の日本酒アイデンティティを担う。',
      zh: '宮崎縣以「山田錦」為父系育成的酒造好適米，適應暖地宮崎氣候，粒大心白明確。淡麗中帶有紮實旨味與滑順口感。宮崎「千徳」「杜氏の里」等本地蔵使用，承擔南九州日本酒身分認同。',
      en: 'A Miyazaki sake rice descended from Yamadanishiki, adapted to the warm southern climate. Large grain with clear shinpaku produces sake that is clean yet layered with umami and a smooth mouthfeel. Used by local Miyazaki breweries such as Sentoku, anchoring southern Kyushu\'s sake identity.',
    },
  },
  {
    id: 'isehikari',
    group: 'regional-rice',
    terms: { ja: ['イセヒカリ', '伊勢光'], zh: ['イセヒカリ', '伊勢光'], en: ['isehikari', 'ise hikari'] },
    title: { ja: 'イセヒカリ', zh: 'イセヒカリ', en: 'Isehikari' },
    body: {
      ja: '1989年、伊勢神宮の神田で台風後に発見されたコシヒカリの突然変異米。倒伏に強く病気にも強い神秘的な出自を持ち、神宮の御饌米として奉納される。近年、日本酒醸造用にも注目され、「白鷹」「辻本店（御前酒）」などが使用。しっとりとした甘みと落ち着いた旨味が特徴。',
      zh: '1989年在伊勢神宮神田因颱風後發現的コシヒカリ突變米。抗倒伏、抗病，帶有神秘出身，作為神宮御饌米獻上。近年也受日本酒釀造關注，「白鷹」「辻本店（御前酒）」等使用。以濕潤甘味與沉靜旨味為特徵。',
      en: 'A Koshihikari mutation discovered in 1989 in the sacred rice paddies of Ise Grand Shrine after a typhoon. Resistant to lodging and disease, offered as ritual rice at the shrine. Recently adopted for sake brewing by breweries like Hakutaka and Tsujihonten (Gozenshu), yielding moist sweetness and quiet umami.',
    },
  },
  {
    id: 'akitsuho',
    group: 'regional-rice',
    terms: { ja: ['秋津穂', 'アキツホ'], zh: ['秋津穂'], en: ['akitsuho'] },
    title: { ja: '秋津穂', zh: '秋津穂', en: 'Akitsuho' },
    body: {
      ja: '奈良県で長く栽培されてきた食用米。低アミロースで柔らかい米質。奈良・油長酒造の「風の森 秋津穂」シリーズが低精白酒母として使い、酒造好適米に劣らぬ表現力を証明した。米そのものの旨味を強く感じるふくよかな酒に仕上がる。',
      zh: '奈良縣長期栽培的食用米，低直鏈澱粉，米質柔軟。奈良油長酒造「風の森 秋津穂」系列以低精白酒母使用，證明其表現力不遜於酒造好適米。能酿出強烈感受米本身旨味的豐潤酒質。',
      en: 'A long-cultivated Nara table rice with low amylose and soft texture. Yucho Shuzo\'s "Kaze no Mori Akitsuho" series proved its brewing potential at low polishing ratios, delivering rich, expressive sake driven by the rice itself.',
    },
  },
  {
    id: 'tosanishiki',
    group: 'regional-rice',
    terms: { ja: ['土佐錦', 'とさにしき'], zh: ['土佐錦'], en: ['tosanishiki'] },
    title: { ja: '土佐錦', zh: '土佐錦', en: 'Tosanishiki' },
    body: {
      ja: '高知県の在来酒造好適米で、「風鳴子」「吟の夢」以前の県産酒米として長く使われてきた。栽培しやすく、地元の食用米にも近い性格を持ち、しっとりした素朴な味わいを生む。今も高知の一部蔵で地元米使用へのこだわりとして活用される。',
      zh: '高知縣在來酒造好適米，在「風鳴子」「吟の夢」之前長期作為縣產酒米使用。栽培容易，性格接近本地食用米，能酿出濕潤樸實的味道。至今高知部分蔵仍作為堅持使用本地米的表現而活用。',
      en: 'A traditional Kochi sake rice used long before the arrival of Kanaruko or Ginnoyume. Easy to cultivate with characteristics close to local table rice, producing moist, homey-flavored sake. Still used by select Kochi breweries as a statement of local sourcing.',
    },
  },
  {
    id: 'hitogokochi',
    group: 'regional-rice',
    terms: { ja: ['ひとごこち'], zh: ['ひとごこち'], en: ['hitogokochi'] },
    title: { ja: 'ひとごこち', zh: 'ひとごこち', en: 'Hitogokochi' },
    body: {
      ja: '長野県が1994年に品種登録した酒造好適米。「美山錦」×「信交190号」の交配種で、耐冷性と栽培しやすさを兼ね備える。淡麗ですっきりとした酒質を生み、まろやかで柔らかい旨味が特徴。「真澄」「大信州」「亀齢」など長野の蔵が広く使用。',
      zh: '長野縣1994年品種登記的酒造好適米，「美山錦」×「信交190号」交配種，兼具耐冷性與易栽培性。能酿出淡麗清爽的酒質，以圓潤柔和的旨味為特徵。「真澄」「大信州」「亀齢」等長野蔵廣泛使用。',
      en: 'A Nagano sake rice registered in 1994, from Miyamanishiki × Shinko-190. Combines cold resistance with cultivation ease. Produces clean, dry sake with mellow, gentle umami. Widely used by Nagano breweries including Masumi, Daishinshu, and Kirei.',
    },
  },
  {
    id: 'hyogo-nishiki',
    group: 'regional-rice',
    terms: { ja: ['兵庫錦', 'ひょうごにしき'], zh: ['兵庫錦'], en: ['hyogo nishiki', 'hyogonishiki'] },
    title: { ja: '兵庫錦', zh: '兵庫錦', en: 'Hyogo Nishiki' },
    body: {
      ja: '兵庫県が2004年に品種登録した酒造好適米。山田錦の血統を引き、山田錦より栽培しやすく、県内広域で作られる新世代の兵庫酒米。心白発現が良好で、上品な旨味とやわらかい香りの吟醸酒に仕上がる。',
      zh: '兵庫縣2004年品種登記的酒造好適米，承襲山田錦血統，比山田錦更易栽培，是兵庫縣廣域栽培的新世代酒米。心白發現良好，能酿出高雅旨味與柔和香氣的吟釀酒。',
      en: 'A Hyogo sake rice registered in 2004, descended from Yamadanishiki but easier to cultivate. Grown broadly across the prefecture, it offers strong shinpaku formation and produces refined ginjo with soft aromas and elegant umami.',
    },
  },
  {
    id: 'tachiharuka',
    group: 'regional-rice',
    terms: { ja: ['タチハルカ', '立春香'], zh: ['タチハルカ'], en: ['tachiharuka'] },
    title: { ja: 'タチハルカ', zh: 'タチハルカ', en: 'Tachiharuka' },
    body: {
      ja: '九州沖縄農業研究センターが暖地向けに開発した酒造好適米（2010年頃品種登録）。九州の高温期の登熟に強く、大粒で心白発達も良好。九州各県で栽培が広がり、南九州の吟醸酒シーンに新しい選択肢を提供している。',
      zh: '九州沖繩農業研究中心針對暖地開發的酒造好適米（2010年前後品種登記）。耐九州高溫期登熟，粒大心白發達。九州各縣栽培擴展中，為南九州吟釀酒場帶來新選項。',
      en: 'A sake rice developed by the Kyushu-Okinawa Agricultural Research Center for warm-climate cultivation (registered around 2010). Tolerates high summer temperatures at ripening, with large grain and strong shinpaku. Increasingly grown across Kyushu, offering new options for southern ginjo brewing.',
    },
  },
  {
    id: 'iwai',
    group: 'regional-rice',
    terms: { ja: ['祝', 'いわい'], zh: ['祝'], en: ['iwai'] },
    title: { ja: '祝', zh: '祝', en: 'Iwai' },
    body: {
      ja: '京都府の在来酒造好適米。戦前から栽培されたが一度絶えかけ、1990年代以降に復活栽培された歴史ある品種。柔らかく素朴な米の旨味が特徴で、京都伏見の「玉川」「澤屋まつもと」「英勲」など京都蔵に使われ、京都酒のアイデンティティを支える。',
      zh: '京都府在來酒造好適米。戰前開始栽培，曾一度斷絕，1990年代後復活栽培的歷史品種。特徵是柔和樸實的米之旨味。京都伏見的「玉川」「澤屋まつもと」「英勲」等京都蔵使用，支撐京都酒的身分認同。',
      en: 'A native Kyoto sake rice cultivated since prewar times; once nearly extinct, revived from the 1990s onward. Yields soft, rustic rice umami. Used by Kyoto/Fushimi breweries such as Tamagawa, Sawaya Matsumoto, and Eikun as a hallmark of Kyoto sake identity.',
    },
  },
  {
    id: 'sanoto',
    group: 'regional-rice',
    terms: { ja: ['さんおと', 'サンオト'], zh: ['さんおと'], en: ['sanoto'] },
    title: { ja: 'さんおと', zh: 'さんおと', en: 'Sanoto' },
    body: {
      ja: '岩手県産の酒造好適米。「吟ぎんが」と並ぶ岩手の新世代酒米で、心白発現が安定し、寒冷地でも高品質に育つ。素朴で滋味深い旨味と柔らかい香りを生み、南部杜氏の伝統を受け継ぐ岩手の蔵元が採用している。',
      zh: '岩手縣產酒造好適米，與「吟ぎんが」並列為岩手新世代酒米。心白發現穩定，寒冷地也能高品質生長。能酿出樸實深邃的旨味與柔和香氣，繼承南部杜氏傳統的岩手蔵元採用。',
      en: 'An Iwate sake rice, part of the new generation alongside Ginginga. Reliable shinpaku formation and high quality even in cold climates. Delivers rustic, layered umami with soft aromas, adopted by Iwate breweries carrying on the Nanbu Toji tradition.',
    },
  },
  {
    id: 'akebono',
    group: 'regional-rice',
    terms: { ja: ['アケボノ', '曙'], zh: ['アケボノ', '曙'], en: ['akebono'] },
    title: { ja: 'アケボノ', zh: 'アケボノ', en: 'Akebono' },
    body: {
      ja: '岡山県産の食用米で、酒造用にも古くから使われてきた。大粒でしっかりした米質を持ち、雄町の血を引かないため独特のクリアな旨味と落ち着いた味わいを生む。岡山「御前酒」「利守酒造」など地元蔵が地米へのこだわりで採用する。',
      zh: '岡山縣產食用米，自古亦作為酒造用。粒大、米質紮實，因不帶雄町血統，能酿出獨特清澄旨味與沉靜口感。岡山「御前酒」「利守酒造」等本地蔵以地米堅持而採用。',
      en: 'An Okayama table rice long used in brewing. Large grain with firm texture; lacking Omachi ancestry, it produces uniquely clear umami and a settled character. Used by Okayama breweries like Gozenshu and Toshimori as an expression of homegrown rice.',
    },
  },
  {
    id: 'kokuryomiyako',
    group: 'regional-rice',
    terms: { ja: ['穀良都', 'こくりょうみやこ'], zh: ['穀良都'], en: ['kokuryomiyako', 'kokuryo miyako'] },
    title: { ja: '穀良都', zh: '穀良都', en: 'Kokuryomiyako' },
    body: {
      ja: '明治時代に選抜された歴史ある山口県の在来酒造好適米。かつては全国で栽培されたが、栽培難度から一時途絶。近年、山口の「澄川酒造場」「澤の鶴」などが復活栽培に成功し、力強い旨味と伝統酒米らしい野趣ある味わいの酒を生む。',
      zh: '明治時代選拔的山口縣歷史在來酒造好適米。曾遍及全國，因栽培難度一度斷絕。近年山口「澄川酒造場」「澤の鶴」等成功復活栽培，能酿出力道強勁的旨味與傳統酒米獨特的野性風味。',
      en: 'A historic Yamaguchi sake rice selected in the Meiji era, once cultivated nationwide but abandoned due to difficulty. Recently revived by Sumikawa Shuzo, Sawanotsuru, and others, yielding bold umami and the wild, earthy character characteristic of heritage varieties.',
    },
  },
  {
    id: 'kanaruko',
    group: 'regional-rice',
    terms: { ja: ['風鳴子', 'かぜなるこ', '高育63号'], zh: ['風鳴子', '高育63号'], en: ['kanaruko', 'kaze naruko'] },
    title: { ja: '風鳴子', zh: '風鳴子', en: 'Kanaruko' },
    body: {
      ja: '高知県が育成した酒造好適米「高育63号」の名称。「吟の夢」に続く高知の第二世代酒米として位置づけられ、より力強い旨味と芳醇な味わいを引き出す。宇宙酵母と組み合わせた「土佐宇宙酒 完全宇宙酒」で酒米側の担当としても使用された。',
      zh: '高知縣育成的酒造好適米「高育63号」之名稱。作為「吟の夢」之後高知第二世代酒米，能引出更強勁的旨味與芳醇味道。曾在宇宙酵母結合的「土佐宇宙酒 完全宇宙酒」中作為酒米方擔當。',
      en: 'The name given to Kochi\'s "Ko-iku 63" sake rice — positioned as Kochi\'s second-generation variety after Ginnoyume. Draws out bolder umami and richer flavor. Notably featured on the rice side of the "Tosa Uchushu Complete Space Sake" project paired with the space yeast.',
    },
  },
  {
    id: 'fukuhikari',
    group: 'regional-rice',
    terms: { ja: ['フクヒカリ', '福光'], zh: ['フクヒカリ'], en: ['fukuhikari'] },
    title: { ja: 'フクヒカリ', zh: 'フクヒカリ', en: 'Fukuhikari' },
    body: {
      ja: '広く栽培される食用米で、酒造用にも各地で使われる。米質は柔らかく、酒造好適米には分類されないが、地元米使用にこだわる蔵で普通酒や本醸造の掛米として活用される。高知県では県内産米として地元米使用の一環で採用される例がある。',
      zh: '廣泛栽培的食用米，各地也用於酒造。米質柔軟，不屬於酒造好適米，但堅持使用本地米的蔵作為普通酒或本釀造之掛米活用。高知縣有作為縣內產米在本地米堅持中採用的例子。',
      en: 'A widely grown table rice also used in brewing across Japan. Softer than dedicated sake rice; typically serves as kake-mai (steamed rice) in futsushu or honjozo for breweries committed to local sourcing. Occasionally featured on Kochi labels emphasizing homegrown rice.',
    },
  },
  // ── 酵母 ───────────────────────────────────────────────────────────
  {
    id: 'sake-yeast',
    group: 'ingredient',
    terms: { ja: ['酵母'], zh: ['酵母'], en: ['yeast'] },
    title: { ja: '酵母', zh: '酵母', en: 'Sake Yeast' },
    body: {
      ja: '糖をアルコールと炭酸ガスに変える微生物で、日本酒の香りと味わいを大きく左右する。日本醸造協会が頒布する「協会酵母」と、各都道府県が独自に開発した「地域酵母」が広く使われる。',
      zh: '将糖分转化为酒精和二氧化碳的微生物，对日本酒的香气和味道影响极大。日本醸造协会颁布的"协会酵母"与各都道府县独立开发的"地域酵母"被广泛使用。',
      en: 'Microorganisms that convert sugars into alcohol and CO₂, profoundly shaping a sake\'s aroma and flavor. Two main categories: Kyokai (Association) yeasts distributed nationally, and regional yeasts developed by individual prefectures.',
    },
  },
  {
    id: 'kyokai-7',
    group: 'kyokai-yeast',
    terms: { ja: ['協会7号', '7号酵母', '真澄酵母', '協会701号', '701号酵母', 'きょうかい701号'], zh: ['協會7號', '7號酵母', '協會701號', '701號酵母'], en: ['kyokai 7', 'kyokai 701', 'association yeast no.7'] },
    title: { ja: '協会7号酵母', zh: '協會7號酵母', en: 'Kyokai No. 7 Yeast' },
    body: {
      ja: '日本で最も広く使われる協会酵母。長野県諏訪・真澄蔵由来。アルコール耐性が高く安定した発酵が可能で、穏やかな香りとしっかりした旨味を生む。全国の蔵で愛用されるスタンダードな酵母。',
      zh: '日本使用最广泛的协会酵母，源自长野县诹访真澄蔵。耐酒精能力强，发酵稳定，产生温和香气和扎实旨味，是全国酒厂的标准酵母。',
      en: 'The most widely used sake yeast in Japan, originating from Masumi brewery in Suwa, Nagano. Highly alcohol-tolerant, ferments stably, and produces moderate aromas with solid umami. The industry standard.',
    },
  },
  {
    id: 'kyokai-9',
    group: 'kyokai-yeast',
    terms: { ja: ['協会9号', '9号酵母', '熊本酵母', '協会901号', '901号酵母', 'きょうかい901号', 'KA-1', '香露酵母'], zh: ['協會9號', '9號酵母', '熊本酵母', '協會901號', '901號酵母'], en: ['kyokai 9', 'kyokai 901', 'kumamoto yeast', 'KA-1'] },
    title: { ja: '協会9号酵母（熊本酵母）', zh: '協會9號酵母（熊本酵母）', en: 'Kyokai No. 9 Yeast (Kumamoto)' },
    body: {
      ja: '熊本酵母とも呼ばれる。カプロン酸エチルを豊富に生成し、リンゴ・メロンを思わせる爽やかな吟醸香が特徴。「YK35（山田錦・9号酵母・精米35%）」の方程式で全国新酒鑑評会を席巻し、現代の吟醸ブームを牽引した。今も全国の蔵で広く使われる定番酵母で、泡なし株901号も普及している。',
      zh: '又称熊本酵母。大量产生己酸乙酯（カプロン酸エチル），以让人联想到苹果和哈密瓜的清新吟酿香为特征。以"YK35（山田锦・9号酵母・精米35%）"公式席卷全国新酒鑑評会，是推动现代吟酿热潮的核心酵母，至今仍广泛使用，无泡株901号也已普及。',
      en: 'Also known as Kumamoto yeast. Produces abundant ethyl caproate — the signature apple-and-melon ginjo aroma. The famous "YK35" formula (Yamadanishiki + No. 9 + 35% polish) swept national sake competitions for decades. Defined the modern ginjo boom; still widely used. Foam-less variant No. 901 is also widely distributed.',
    },
  },
  {
    id: 'kyokai-14',
    group: 'kyokai-yeast',
    terms: { ja: ['協会14号', '14号酵母', '金沢酵母', '協会1401号', '1401号酵母', '協会1401号＆協会1801号'], zh: ['協會14號', '14號酵母', '金澤酵母', '協會1401號', '1401號酵母'], en: ['kyokai 14', 'kyokai 1401', 'kanazawa yeast'] },
    title: { ja: '協会14号酵母（金沢酵母）', zh: '協會14號酵母（金澤酵母）', en: 'Kyokai No. 14 Yeast (Kanazawa)' },
    body: {
      ja: '金沢酵母とも呼ばれる。酢酸イソアミルを多く生成し、バナナ・マスカットを思わせる華やかな香りが特徴。酸が少なく穏やかな吟醸香で食事との相性が良い。北陸地方を中心に使われ、1998年に開発された泡なし株1401号が広く普及。',
      zh: '又称金泽酵母。大量产生乙酸异戊酯（酢酸イソアミル），以让人联想到香蕉和麝香葡萄的华丽香气为特征，酸度低，吟酿香温和，与食物搭配性佳，主要在北陆地区使用，1998年开发的无泡株1401号被广泛采用。',
      en: 'Also known as Kanazawa yeast. Produces abundant isoamyl acetate — banana and muscat-grape aromas. Low acid and restrained ginjo fragrance that pairs well with food. Centered in the Hokuriku region. The foam-less No. 1401 (1998) is widely used.',
    },
  },
  {
    id: 'cel24',
    group: 'local-yeast',
    terms: { ja: ['CEL-24', 'CEL24'], zh: ['CEL-24', 'CEL24'], en: ['CEL-24', 'CEL24'] },
    title: { ja: 'CEL-24酵母', zh: 'CEL-24酵母', en: 'CEL-24 Yeast' },
    body: {
      ja: '高知県醸造試験場が開発した酵母。強い発泡性と高いリンゴ酸生成能力を持ち、甘みのあるスパークリング日本酒の醸造に最適。「南」「美丈夫」などのスパークリング酒で有名。アルコール度数低めの微発泡酒によく使われる。',
      zh: '高知县酿造试验场开发的酵母。具有强发泡性和高苹果酸产生能力，最适合酿造甘甜的发泡日本酒。以"南"、"美丈夫"等发泡酒闻名，常用于低酒精度微发泡酒。',
      en: 'Developed by the Kochi Brewing Research Institute. Exceptional carbonation and high malic acid production make it ideal for sweet, sparkling sake. Famous through brands like "Minami" and "Bijofubu." A go-to yeast for low-alcohol, lightly sparkling sake.',
    },
  },
  {
    id: 'shizuoka-yeast',
    group: 'local-yeast',
    terms: { ja: ['静岡酵母', 'HD-1', 'NEW-5'], zh: ['靜岡酵母', '静岡酵母'], en: ['shizuoka yeast'] },
    title: { ja: '静岡酵母', zh: '靜岡酵母', en: 'Shizuoka Yeast' },
    body: {
      ja: '静岡県が独自に開発した地域酵母。エステル類が少なくクリアな発酵香で、すっきりした上品な吟醸香と透明感のある味わいを生む。静岡の「淡麗型」スタイルを代表し、国内外で高い評価を得ている。',
      zh: '静冈县独自开发的地域酵母。酯类少、发酵香清洁，产生清爽高雅的吟酿香和高透明感口感，代表静冈"淡丽型"风格，在国内外享有高度评价。',
      en: 'A proprietary regional yeast from Shizuoka. Low in esters with exceptionally clean fermentation character, it produces refined ginjo aromas with remarkable clarity and purity. Defines Shizuoka\'s signature "tanrei" style and is highly regarded internationally.',
    },
  },
  {
    id: 'kyokai-6',
    group: 'kyokai-yeast',
    terms: { ja: ['協会6号', '6号酵母', '新政酵母'], zh: ['協會6號', '6號酵母'], en: ['kyokai 6', 'association yeast no.6'] },
    title: { ja: '協会6号酵母', zh: '協會6號酵母', en: 'Kyokai No. 6 Yeast' },
    body: {
      ja: '秋田の佐藤醸造（現・新政酒造）由来の歴史ある酵母で、最古参の協会酵母のひとつ。酸を多めに生成し、どっしりした旨味と米の風味を重視した複雑な味わいになる。一時は廃れかけたが、新政酒造が「6号」として復活させ、現在は自然派・クラシック系日本酒のアイコン的存在。',
      zh: '来自秋田佐藤醸造（现新政酒造）的历史悠久酵母，是最古老的协会酵母之一。产酸较多，重视扎实旨味和米本身风味，口感复杂。一度几近失传，后由新政酒造以"6号"成功复活，现已成为自然派、复古系日本酒的代表。',
      en: 'Originating from Sato Jozo (now Aramasa) in Akita — one of the oldest surviving Kyokai yeasts. Produces higher acidity and deep umami, favoring rice character over floral showiness. Nearly disappeared, revived by Aramasa as their signature "No. 6" — now iconic in the global natural/classic sake movement.',
    },
  },
  {
    id: 'kyokai-10',
    group: 'kyokai-yeast',
    terms: { ja: ['協会10号', '10号酵母', '協会1001号', '1001号酵母', '小川酵母', '明利小川酵母'], zh: ['協會10號', '10號酵母', '1001號', '協會1001號', '小川酵母'], en: ['kyokai 10', 'kyokai 1001', 'ogawa yeast', 'association yeast no.10'] },
    title: { ja: '協会10号酵母', zh: '協會10號酵母', en: 'Kyokai No. 10 Yeast' },
    body: {
      ja: '茨城県水戸市の明利酒類で小川力博士が開発したことから「小川酵母」「明利小川酵母」とも呼ばれる。全協会酵母中で最も酸が少ない特徴を持ち、低温長期型の発酵でカプロン酸エチルを豊富に生成。繊細で華やかな吟醸香と清澄な味わいを生む。関東・甲信越を中心に普及し、泡なし株1001号が広く使われる。',
      zh: '由茨城县水户市明利酒类的小川力博士开发，又称"小川酵母"或"明利小川酵母"。在所有协会酵母中酸度最低，低温长期型发酵，大量产生己酸乙酯，产生细腻华丽的吟酿香和清澄口感，主要在关东、甲信越地区普及，无泡株1001号被广泛使用。',
      en: 'Also called "Ogawa yeast" after Dr. Ogawa Chikara who developed it at Meiri Shurui in Mito, Ibaraki. Produces the lowest acidity of any Kyokai yeast. Long, cold fermentation with abundant ethyl caproate yields delicate, elegant ginjo aromas and exceptional clarity. Popular in eastern Japan. The foam-less No. 1001 is widely used.',
    },
  },
  {
    id: 'kyokai-11',
    group: 'kyokai-yeast',
    terms: { ja: ['協会11号', '11号酵母'], zh: ['協會11號', '11號酵母'], en: ['kyokai 11', 'association yeast no.11'] },
    title: { ja: '協会11号酵母', zh: '協會11號酵母', en: 'Kyokai No. 11 Yeast' },
    body: {
      ja: '協会7号の20%アルコール環境での選抜育種から生まれた改良株（1975年）。協会史上初の意図的に育種された酵母。高いアルコール耐性と高いリンゴ酸生成能力を持ち、アミノ酸生成が非常に少ない。キレの良い超辛口スタイルの酒を生み、長期発酵でも味が締まる。泡なし株1101号（2014年）もある。',
      zh: '由协会7号经20%酒精环境选拔育种改良而来（1975年），是协会史上首株有意培育的酵母。具有高酒精耐性和高苹果酸（リンゴ酸）产生能力，氨基酸产生量极少，能酿出清爽超辛口风格，即使长时间发酵口感也不松散，2014年开发了无泡株1101号。',
      en: 'An improved strain selectively bred from No. 7 in 20% alcohol — the first purposefully engineered Kyokai yeast (1975). High alcohol tolerance and high malic acid production with very low amino acids. Produces clean, extra-dry sake with excellent finish even through long fermentation. Foam-less No. 1101 added in 2014.',
    },
  },
  {
    id: 'kyokai-15',
    group: 'kyokai-yeast',
    terms: { ja: ['協会15号', '15号酵母'], zh: ['協會15號', '15號酵母'], en: ['kyokai 15', 'association yeast no.15'] },
    title: { ja: '協会15号酵母', zh: '協會15號酵母', en: 'Kyokai No. 15 Yeast' },
    body: {
      ja: '秋田県醸造試験場開発の秋田酵母AK-1が1996年に協会1501号として採用された酵母。最初から泡なし株として設計。カプロン酸エチルの生成量が9号の約2倍で、リンゴ・メロン系の華やかな吟醸香を生む。低温長期型の発酵で酸が少なく、吟醸・大吟醸に広く使われる。',
      zh: '秋田县酿造试验场开发的秋田酵母AK-1于1996年被采用为协会1501号，从一开始就设计为无泡株。己酸乙酯产生量约为9号的两倍，产生苹果・哈密瓜系华丽吟酿香，低温长期型发酵、酸度低，广泛用于吟酿・大吟酿。',
      en: 'Akita\'s AK-1 yeast, developed by the Akita Brewing Research Institute and adopted as Kyokai No. 1501 in 1996. Designed foam-less from the start. Produces approximately 2× the ethyl caproate of No. 9 — vivid apple-and-melon aromas. Low-temperature, long fermentation with low acidity. Widely used for ginjo and daiginjo.',
    },
  },
  {
    id: 'kyokai-16',
    group: 'kyokai-yeast',
    terms: { ja: ['協会1601号', '1601号酵母', '16号酵母'], zh: ['協會1601號', '1601號酵母'], en: ['kyokai 1601', 'association yeast no.1601'] },
    title: { ja: '協会1601号酵母', zh: '協會1601號酵母', en: 'Kyokai No. 1601 Yeast' },
    body: {
      ja: '月桂冠の「セルレニン耐性」技術を用いて開発された画期的な高エステル酵母（1992年頒布）。カプロン酸エチルの生成量が7号の3〜4倍で、当時革命的な華やかさを実現。発酵力がやや弱く901号などとブレンドされることが多い。最初から泡なし株で設計され、後続の1801号の礎を築いた技術的に重要な酵母。',
      zh: '使用月桂冠"塞吕宁耐性"技术开发的划时代高酯酵母（1992年颁布），己酸乙酯产生量为7号的3～4倍，当时实现了革命性的华丽香气。发酵力略弱，常与901号混合使用，本身即无泡株，是奠定后来1801号的重要里程碑酵母。',
      en: 'A landmark high-ester yeast using Gekkeikan\'s cerulenin-resistance technique (distributed 1992). Produces 3–4× the ethyl caproate of No. 7 — revolutionary at the time. Fermentation is somewhat weak and often blended with No. 901. Foam-less by design. Technically the precursor to the dominant 1801号.',
    },
  },
  {
    id: 'kyokai-18',
    group: 'kyokai-yeast',
    terms: { ja: ['協会1801号', '1801号酵母', '18号酵母', '1801', 'きょうかい1801号'], zh: ['協會1801號', '1801號酵母', '1801'], en: ['kyokai 1801', 'association yeast no.1801', '1801'] },
    title: { ja: '協会1801号酵母', zh: '協會1801號酵母', en: 'Kyokai No. 1801 Yeast' },
    body: {
      ja: '現在の全国新酒鑑評会金賞受賞酒の約48%に使われる、現代で最も重要な競技用酵母（2006年頒布）。1601号×901号の交配株で、カプロン酸エチルと酢酸イソアミルの両方が1601号を40〜50%上回る。さらに1601号の「発酵力の弱さ」と1701号の「イソアミルアルコール（老香の原因）の多さ」という両方の弱点を解決。最初から泡なし設計。',
      zh: '目前全国新酒鑑評会金赏获奖酒约48%使用，是现代最重要的竞技用酵母（2006年颁布）。由1601号×901号交配而来，己酸乙酯和乙酸异戊酯两者均比1601号高40～50%，同时解决了1601号发酵力弱和1701号异戊醇（老香原因）多的两大问题，本身即无泡株。',
      en: 'The single most important competition sake yeast today — used in approximately 48% of gold medal entries at the National New Sake Appraisal (distributed 2006). A cross of 1601 × 901, producing ethyl caproate and isoamyl acetate 40–50% higher than 1601号. Simultaneously solves 1601\'s weak fermentation and 1701\'s high isoamyl alcohol (aging precursor) issues. Foam-less by design.',
    },
  },
  {
    id: 'kyokai-28',
    group: 'kyokai-yeast',
    terms: { ja: ['協会28号', '28号酵母'], zh: ['協會28號', '28號酵母'], en: ['kyokai 28', 'association yeast no.28'] },
    title: { ja: '協会28号酵母', zh: '協會28號酵母', en: 'Kyokai No. 28 Yeast' },
    body: {
      ja: '高リンゴ酸生成を目的に開発された特殊酵母（1993年頒布）。有機酸の60〜70%をリンゴ酸が占め、白ワインを思わせる爽快でキリッとした酸味を生む。リンゴ酸は「冷旨酸」と呼ばれ、冷やすほど美味しさが増す特性がある。コハク酸が少なくクリーンな後味で、一般的な酒米酵母とは一線を画す個性的な酸味が特徴。',
      zh: '以高苹果酸（リンゴ酸）产生为目的开发的特殊酵母（1993年颁布），有机酸的60～70%为苹果酸，产生让人联想到白葡萄酒的清爽利落酸味。苹果酸被称为"冷旨酸"，越冷越美味，琥珀酸少，收尾干净，以独特酸味著称。',
      en: 'A specialty yeast engineered for high malic acid production (distributed 1993). Malic acid comprises 60–70% of total organic acids — crisp, white wine-like acidity. Called "cold-delicious acid" (冷旨酸) because it tastes best well-chilled. Low succinic acid gives a clean, distinctive finish unlike typical sake yeasts.',
    },
  },
  {
    id: 'kyokai-12',
    group: 'kyokai-old-yeast',
    terms: { ja: ['協会12号', '12号酵母', '浦霞酵母'], zh: ['協會12號', '12號酵母'], en: ['kyokai 12', 'association yeast no.12'] },
    title: { ja: '協会12号酵母（廃頒布）', zh: '協會12號酵母（已停止）', en: 'Kyokai No. 12 Yeast (Discontinued)' },
    body: {
      ja: '宮城県塩竈市・浦霞蔵（株式会社佐浦）由来の9号系自然変異株（1985年頒布）。繊細なエステル系吟醸香と低酸が特徴で、低温短期醪に適していたが醸造条件に非常に敏感で扱いが難しかった。1995年に菌株変性により廃頒布。2020年代に浦霞蔵が自社で復元・復活させ、その繊細な風味を再び表現している。',
      zh: '来自宫城县盐竈市浦霞蔵（佐浦）的9号系自然变异株（1985年颁布），以细腻酯系吟酿香和低酸为特征，适合低温短期醪，但对酿造条件极为敏感，操作难度大，1995年因菌株变性廃颁布。进入2020年代浦霞蔵已自行复原复活。',
      en: 'A natural variant of the No. 9 lineage from Urakasumi (Saura) in Miyagi (distributed 1985). Delicate ester-driven ginjo aroma with low acid, suited to short cold fermentation but extremely sensitive to brewing conditions. Discontinued 1995 due to strain degradation. Urakasumi has since revived it in-house in the 2020s.',
    },
  },
  {
    id: 'kyokai-8',
    group: 'kyokai-old-yeast',
    terms: { ja: ['協会8号', '8号酵母', '幻の酵母'], zh: ['協會8號', '8號酵母', '幻之酵母'], en: ['kyokai 8', 'association yeast no.8', 'phantom yeast'] },
    title: { ja: '協会8号酵母（幻の酵母）', zh: '協會8號酵母（幻之酵母）', en: 'Kyokai No. 8 Yeast (The Phantom Yeast)' },
    body: {
      ja: '1960年頒布開始。高酸・濃醇なスタイルが当時の「淡麗辛口」志向と合わず1977年に廃頒布となり「幻の酵母」と呼ばれるようになった。豊かな酸味とトロピカルフルーツのような複雑な旨味が特徴で、時代の流れに合わなかった。2003年頃に山口県・村重酒造が復活に成功し「八ノット」シリーズが国際コンクールで受賞。現在は個性的な醸造家に注目されている。',
      zh: '1960年开始颁布，但其高酸、浓醇风格与当时流行的"淡丽辛口"需求不合，1977年廢颁布，从此被称为"幻之酵母"。以丰富酸味和热带水果般的复杂旨味为特征，生不逢时。约2003年山口县村重酒造成功复活，"八ノット"系列在国际大赛获奖，如今受到个性派酿造者青睐。',
      en: 'Distributed from 1960, discontinued 1977 because its high-acid, rich style clashed with the era\'s demand for light, dry sake — earning the nickname "phantom yeast." Rich acidity with complex, tropical-fruit umami, simply ahead of its time. Revived around 2003 by Murashige Shuzo in Yamaguchi, whose "Eight Knot" series won international competitions. Now prized by maverick brewers.',
    },
  },
  {
    id: 'kyokai-1',
    group: 'kyokai-old-yeast',
    terms: { ja: ['協会1号', '1号酵母'], zh: ['協會1號', '1號酵母'], en: ['kyokai 1', 'association yeast no.1'] },
    title: { ja: '協会1号酵母（廃頒布）', zh: '協會1號酵母（已停止）', en: 'Kyokai No. 1 Yeast (Discontinued)' },
    body: {
      ja: '醸造協会が1917年に最初に頒布した記念すべき協会酵母の第1号。兵庫県灘・桜正宗由来で、1906年（明治39年）に高橋禎二によって分離された。酵母頒布事業の起点となった歴史的な株で、安定した発酵力と濃醇な酒質を生む。1935年に廃頒布。後に発見された協会酵母のなかで6号以降は全てこの1号の遺伝的子孫であることが判明している。',
      zh: '醸造协会1917年最初颁布的具有历史意义的协会酵母第1号，来自兵库县滩樱正宗，由高桥禎二于1906年（明治39年）分离，是酵母颁布事业的起点，具有稳定发酵力和浓醇酒质，1935年廢颁布。后来证明协会6号以后的所有酵母都是1号的遗传后裔。',
      en: 'The very first yeast distributed by the Brewing Society in 1917. Isolated from Sakura Masamune in Nada, Hyogo by Takahashi Teizo in 1906 — the origin of the entire Kyokai distribution program. Stable fermentation, rich and full-bodied. Discontinued 1935. Later genomic research confirmed that No. 6 and all subsequent Kyokai yeasts are its genetic descendants.',
    },
  },
  {
    id: 'kyokai-3',
    group: 'kyokai-old-yeast',
    terms: { ja: ['協会3号', '3号酵母'], zh: ['協會3號', '3號酵母'], en: ['kyokai 3', 'association yeast no.3'] },
    title: { ja: '協会3号酵母（廃頒布）', zh: '協會3號酵母（已停止）', en: 'Kyokai No. 3 Yeast (Discontinued)' },
    body: {
      ja: '広島県三原・醉心山根本店由来の酵母（1914年分離）。マスカットに似た葡萄系の爽やかな香りを持ち、当時最高品質と評価された。1931年頃に保存中の菌株が変性し廃頒布。',
      zh: '来自广岛县三原醉心山根本店的酵母（1914年分离），以类似麝香葡萄的清新葡萄系香气著称，当时被评为最高品质，约1931年因保存中菌株变性而廃颁布。',
      en: 'From Suishin Yamane Honten in Mihara, Hiroshima (isolated 1914). Praised for muscat grape-like aromas and considered the finest yeast of its era. Discontinued around 1931 after the preserved strain degraded in storage.',
    },
  },
  {
    id: 'kyokai-5',
    group: 'kyokai-old-yeast',
    terms: { ja: ['協会5号', '5号酵母'], zh: ['協會5號', '5號酵母'], en: ['kyokai 5', 'association yeast no.5'] },
    title: { ja: '協会5号酵母（廃頒布）', zh: '協會5號酵母（已停止）', en: 'Kyokai No. 5 Yeast (Discontinued)' },
    body: {
      ja: '広島県西条・賀茂鶴由来の酵母（1923年分離）。フルーティーで華やかな花系の香りを持ち、穏やかなマスカット様の吟醸香が特徴。当時としては珍しい高香気酵母だったが発酵力がやや弱く、1936年に廃頒布。',
      zh: '来自广岛县西条贺茂鹤的酵母（1923年分离），以果香华丽的花系香气著称，带有温和麝香葡萄吟酿香，是当时罕见的高香气酵母，但发酵力略弱，1936年廃颁布。',
      en: 'From Kamotsuru in Saijo, Hiroshima (isolated 1923). Distinctive fruity, floral character with elegant muscat-like ginjo aroma — unusual for its era. Fermentation was somewhat weak. Discontinued 1936.',
    },
  },
  {
    id: 'akita-yeast',
    group: 'local-yeast',
    terms: { ja: ['秋田酵母', 'AK-1'], zh: ['秋田酵母', 'AK-1'], en: ['akita yeast', 'AK-1'] },
    title: { ja: '秋田酵母（AK-1）', zh: '秋田酵母（AK-1）', en: 'Akita Yeast (AK-1)' },
    body: {
      ja: '秋田県醸造試験場が開発した地域酵母。エステル香が豊かで、リンゴやメロンを思わせる爽やかな吟醸香を生む。低温発酵に適しており、「雪の茅舎」「高清水」など秋田の名蔵が愛用。秋田型の上品で華やかなスタイルを支える。',
      zh: '秋田县酿造试验场开发的地域酵母，富含酯香，产生让人联想到苹果和哈密瓜的清新吟酿香，适合低温发酵，"雪の茅舎"、"高清水"等秋田名蔵钟爱，是支撑秋田风格高雅华丽的核心酵母。',
      en: 'Developed by the Akita Brewing Research Institute. Rich in esters, producing apple-and-melon ginjo aromas. Well-suited to cold fermentation. A cornerstone of Akita\'s elegant, floral sake style, favored by breweries like Yuki no Bosha and Takashimizu.',
    },
  },
  {
    id: 'yamagata-yeast',
    group: 'local-yeast',
    terms: { ja: ['山形酵母', 'KA-4'], zh: ['山形酵母', 'KA酵母'], en: ['yamagata yeast', 'KA yeast'] },
    title: { ja: '山形酵母（KAシリーズ）', zh: '山形酵母（KA系列）', en: 'Yamagata Yeast (KA Series)' },
    body: {
      ja: '山形県産業技術センターが開発したKAシリーズ。カプロン酸エチルを多く生成し、メロンのような豊かな果実香が特徴。「くどき上手」「楯野川」「山形正宗」などに使われ、山形酒の個性的なフルーティーさを形成する。',
      zh: '山形县产业技术中心开发的KA系列酵母，大量产生己酸乙酯，以哈密瓜般丰富的果香为特征，"くどき上手"、"楯野川"、"山形正宗"等使用，形成山形酒独特的果香个性。',
      en: 'The KA series from Yamagata Industrial Technology Center. High in ethyl caproate — melon-forward fruit aromas. Used by Kudoki Jozu, Tatenokawa, and Yamagata Masamune. Defines Yamagata\'s distinctive fruity sake profile.',
    },
  },
  {
    id: 'fukushima-yeast',
    group: 'local-yeast',
    terms: { ja: ['うつくしま夢酵母', '福島酵母', 'TM-1'], zh: ['福島夢酵母', 'TM-1'], en: ['fukushima yeast', 'utsukushima dream yeast'] },
    title: { ja: 'うつくしま夢酵母', zh: '福島夢酵母', en: 'Utsukushima Dream Yeast (Fukushima)' },
    body: {
      ja: '福島県ハイテクプラザが開発した「夢酵母」シリーズ（TM-1が代表）。豊かな吟醸香と旨味のバランスが取れた酒を生む。福島が全国新酒鑑評会で金賞数トップを誇る「吟醸王国」の地位を支える酵母で、「飛露喜」「奈良萬」などに使われる。',
      zh: '福岛县ハイテクプラザ开发的"夢酵母"系列（以TM-1为代表），产生丰富吟酿香，香味平衡优秀，是支撑福岛连年蝉联全国新酒鑑評会金赏数第一的"吟酿王国"地位的关键酵母，被"飛露喜"、"奈良萬"等使用。',
      en: 'The "Dream Yeast" series from Fukushima Hi-Tech Plaza, with TM-1 as flagship. Superb balance of ginjo aroma and umami. A backbone of Fukushima\'s "Ginjo Kingdom" reputation — consistently leading Japan\'s national sake competition in gold medals. Used by Hiroki and Naraman.',
    },
  },
  {
    id: 'hiroshima-yeast',
    group: 'local-yeast',
    terms: { ja: ['広島酵母', 'もみじ酵母'], zh: ['廣島酵母', '紅葉酵母'], en: ['hiroshima yeast', 'momiji yeast'] },
    title: { ja: '広島酵母（もみじ酵母）', zh: '廣島酵母（紅葉酵母）', en: 'Hiroshima Yeast (Momiji)' },
    body: {
      ja: '広島県工業技術センターが開発した酵母。軟水仕込みで有名な広島の酒文化に最適化されており、穏やかな吟醸香と円やかな旨味を生む。広島らしい丸みのある飲み口の酒を実現し、「賀茂鶴」「亀齢」「竹鶴」など広島の蔵に使われる。',
      zh: '广岛县工业技术中心开发的酵母，针对以软水仕込著称的广岛酒文化优化，产生温和吟酿香和圆润旨味，实现广岛特有的圆润饮感，被"贺茂鹤"、"亀齢"、"竹鶴"等酒厂使用。',
      en: 'Developed by Hiroshima Industrial Technology Center, optimized for the region\'s soft-water brewing tradition. Produces gentle ginjo aromas and smooth umami with Hiroshima\'s signature rounded mouthfeel. Used by Kamotsuru, Kirei, Taketsuru, and other Hiroshima breweries.',
    },
  },
  {
    id: 'niigata-yeast',
    group: 'local-yeast',
    terms: { ja: ['新潟酵母', 'G9', 'TK-8'], zh: ['新潟酵母', 'G9'], en: ['niigata yeast'] },
    title: { ja: '新潟酵母（G9・TK-8）', zh: '新潟酵母（G9・TK-8）', en: 'Niigata Yeast (G9 / TK-8)' },
    body: {
      ja: '新潟県醸造試験場が開発した地域酵母シリーズ。エステル香を抑え、低温でも安定した発酵ができる。新潟の「淡麗辛口」スタイルに合ったクリーンで透明感のある味わいを生み、多くの新潟の蔵で使用される。',
      zh: '新潟县酿造试验场开发的地域酵母系列，抑制酯香，低温发酵稳定，产生契合新潟"淡丽辛口"风格的清洁透明感口感，被众多新潟酒厂使用。',
      en: 'Regional yeast series from the Niigata Brewing Research Institute. Restrained ester production and stable cold fermentation. Produces the clean, transparent, crisp taste defining Niigata\'s "tanrei karakuchi" style. Used across many Niigata breweries.',
    },
  },
  {
    id: 'cel19',
    group: 'local-yeast',
    terms: { ja: ['CEL-19', 'CEL19'], zh: ['CEL-19', 'CEL19'], en: ['CEL-19', 'CEL19'] },
    title: { ja: 'CEL-19酵母', zh: 'CEL-19酵母', en: 'CEL-19 Yeast' },
    body: {
      ja: '高知県工業技術センターが開発したCELシリーズの酵母。カプロン酸エチルをNo.9酵母の約2倍生成し、リンゴ・パイナップルを思わせる果実香が特徴。CEL-24より発酵力が強く、安定した醸造がしやすい。高知の「土佐酒」に個性的なフルーティーさを与え、全国新酒鑑評会での受賞歴もある。CEL-24（スパークリング向き）と対をなす、通常の吟醸・純米向けの高知オリジナル酵母。',
      zh: '高知县工业技术中心开发的CEL系列酵母，己酸乙酯（カプロン酸エチル）产生量约为9号酵母的两倍，以苹果和菠萝般的果香为特征。发酵力比CEL-24更强、更稳定，为高知"土佐酒"赋予个性鲜明的果香，在全国新酒鑑評会上也有获奖记录，是与发泡酒用CEL-24相对的、用于普通吟酿・纯米酒的高知原创酵母。',
      en: 'From the Kochi CEL series, producing approximately 2× the ethyl caproate of Kyokai No. 9 yeast — apple and pineapple-like fruit aromas. Ferments more reliably than CEL-24, making it better suited for standard ginjo and junmai brewing. Award-winning at national competitions, it is the everyday counterpart to CEL-24\'s sparkling sake specialization.',
    },
  },
  {
    id: 'uchu-yeast',
    group: 'local-yeast',
    terms: { ja: ['宇宙酵母', '宇宙酒', '土佐宇宙酒'], zh: ['宇宙酵母', '太空酵母', '宇宙酒'], en: ['space yeast', 'uchu yeast', 'cosmic sake'] },
    title: { ja: '宇宙酵母（土佐宇宙酒）', zh: '宇宙酵母（土佐宇宙酒）', en: 'Space Yeast (Tosa Space Sake)' },
    body: {
      ja: '高知県の酒蔵グループが2002年に立ち上げたプロジェクトが生んだ酵母。2005年10月、ソユーズロケットでISSに打ち上げられ10日間宇宙空間に滞在後、地球に帰還。宇宙放射線や無重力環境を経験した酵母で2006年4月に世界初の「宇宙酒」が完成。「司牡丹」「土佐鶴」「高木酒造」など高知の複数の蔵が参加。2009年醸造年度には酒米（吟の夢・風鳴子）も宇宙で育てた「完全宇宙酒」を実現。',
      zh: '高知县酒厂团体于2002年启动的项目所诞生的酵母。2005年10月搭乘联盟号火箭前往国际空间站，在太空停留10天后返回地球，经历宇宙射线和无重力环境，于2006年4月酿成世界首款"宇宙酒"。"司牡丹"、"土佐鶴"、"高木酒造"等多家高知酒厂参与。2009年酿造年度，连酒米（吟の夢・风鸣子）也在太空培育，实现了"完全宇宙酒"。',
      en: 'Born from a 2002 Kochi Prefecture brewery project. In October 2005, the yeast was launched to the ISS aboard a Soyuz rocket, spending 10 days in space exposed to cosmic radiation and microgravity before returning to Earth. The world\'s first "space sake" was produced in April 2006. Participating Kochi breweries include Tsukasabotan, Tosatsuru, and Takagi. By the 2009 vintage, even the sake rice (Gin no Yume variety) was space-cultivated — achieving a fully space-sourced sake.',
    },
  },
  {
    id: 'hana-kobo',
    group: 'local-yeast',
    terms: { ja: ['花酵母', '花こうぼ'], zh: ['花酵母', '花の酵母'], en: ['flower yeast', 'hana kobo'] },
    title: { ja: '花酵母', zh: '花酵母', en: 'Flower Yeast (Hana Kobo)' },
    body: {
      ja: '東京農業大学が花から採取・分離した酵母群の総称。1998年にナデシコ（カーネーション）から初めて単離に成功。現在40種以上が保存・研究され16種以上が商品化されている。ツルバラ、ベゴニア、ひまわり、コスモスなど花の種類ごとに異なる香り成分を生成。「花の香りがするわけではなく」、酵母自身の代謝による洋梨・リンゴ系フルーティー香が主体。茨城の来福酒造が14種以上を使い分けることで知られ、全国30以上の蔵が採用。個性豊かな吟醸香を求める小規模蔵に人気が高い。',
      zh: '东京农业大学从花朵中采集分离的酵母群总称。1998年首次从ナデシコ（石竹/康乃馨）中单离成功。现已保存研究40余种，16种以上商品化。蔓蔷薇、秋海棠、向日葵、波斯菊等不同花卉产生不同香气成分。并非产生"花朵的香气"，而是酵母自身代谢产生洋梨、苹果系果香为主。茨城的来福酒造以使用14种以上闻名，全国30余家酒厂采用，在追求个性吟酿香的小型酒厂中颇受欢迎。',
      en: 'A family of yeasts isolated from flowers by Tokyo University of Agriculture. First successfully isolated from carnation in 1998. Over 40 varieties are preserved; 16+ are commercially available. Each flower — climbing rose, begonia, sunflower, cosmos — yields distinct aroma compounds. Contrary to the name, they don\'t produce floral scents: yeast metabolism creates pear- and apple-like fruity aromas instead. Raifuku brewery (Ibaraki) uses 14+ varieties and is the most celebrated practitioner. 30+ breweries nationwide use flower yeasts.',
    },
  },
  {
    id: 'kochi-yeast',
    group: 'local-yeast',
    terms: { ja: ['高知酵母', '高知県酵母', 'AA-41', 'AA41', 'AC-17', 'AC17', 'AT10', 'かんかん丸'], zh: ['高知酵母', '高知縣酵母'], en: ['kochi yeast', 'AA-41', 'AC-17'] },
    title: { ja: '高知酵母', zh: '高知酵母', en: 'Kochi Yeasts' },
    body: {
      ja: '高知県醸造試験場（現・高知県工業技術センター）が独自に開発した酵母群の総称。AA-41・AC-17・AT-10などの吟醸酵母、発泡性のCEL-19やCEL-24、「かんかん丸」などバリエーションが豊富。総じてリンゴ酸を多く生成し、爽やかで果実感の強い酒質を生む。県内約17蔵が使い分け、高知の「淡麗辛口＋フルーティー」という独自ポジションを支える。',
      zh: '高知縣釀造試驗場（現高知縣工業技術中心）獨自開發的酵母群總稱。AA-41、AC-17、AT-10等吟釀酵母，發泡性CEL-19、CEL-24，「かんかん丸」等品種豐富。整體以蘋果酸產量高、酿出清爽果實感強的酒質為特徵。縣內約17蔵分別使用，支撐高知「淡麗辛口＋果香」的獨特定位。',
      en: 'A family of yeasts developed by the Kochi Brewing Research Institute. Includes ginjo strains like AA-41, AC-17, AT-10, sparkling strains CEL-19 and CEL-24, and specialty strains like "Kankan-Maru." Collectively produce elevated malic acid and vivid fruity character — the backbone of Kochi\'s distinctive "clean-dry-yet-fruity" identity across roughly 17 local breweries.',
    },
  },
  {
    id: 'iwate-yeast',
    group: 'local-yeast',
    terms: { ja: ['岩手酵母', 'ゆうこの想い', 'ジョバンニの調べ', 'すず音'], zh: ['岩手酵母'], en: ['iwate yeast', 'giovanni no shirabe'] },
    title: { ja: '岩手酵母', zh: '岩手酵母', en: 'Iwate Yeasts' },
    body: {
      ja: '岩手県工業技術センターが開発した独自酵母群の総称。「ゆうこの想い」（華やか吟醸系）、「ジョバンニの調べ」（宮沢賢治『銀河鉄道の夜』にちなむ、繊細で幻想的な香り）、「すず音」（発泡向け）など、詩情ある命名で知られる。南部杜氏の伝統に加え、県産酒米「吟ぎんが」「さんおと」と組み合わせて、岩手発の個性豊かな吟醸酒を生む。',
      zh: '岩手縣工業技術中心開發的獨自酵母群總稱。「ゆうこの想い」（華麗吟釀系）、「ジョバンニの調べ」（取自宮澤賢治《銀河鐵道之夜》，纖細幻想香氣）、「すず音」（發泡向）等，以詩意命名聞名。結合南部杜氏傳統與縣產酒米「吟ぎんが」「さんおと」，酿出岩手獨特個性的吟釀酒。',
      en: 'A family of yeasts developed by the Iwate Industrial Research Institute. Includes "Yuko no Omoi" (bright ginjo character), "Giovanni no Shirabe" (named after Miyazawa Kenji\'s Night on the Galactic Railroad — delicate, dreamlike aromas), and "Suzune" for sparkling styles. Combined with Nanbu Toji brewing tradition and local rice varieties, they define Iwate\'s poetic sake voice.',
    },
  },
  {
    id: 'yamaguchi-9e',
    group: 'local-yeast',
    terms: { ja: ['9E', '山口酵母9E', '山口酵母', '山口県酵母9E'], zh: ['9E', '山口酵母', '山口酵母9E'], en: ['yamaguchi 9E', '9E yeast'] },
    title: { ja: '山口酵母 9E', zh: '山口酵母 9E', en: 'Yamaguchi Yeast 9E' },
    body: {
      ja: '山口県産業技術センターが選抜育成した吟醸酵母。協会9号系から派生した株で、カプロン酸エチルを豊富に生成しつつ酸が穏やか、キレの良い吟醸香を持つ。「獺祭」が協会1801号と併用することで知られ、「東洋美人」「雁木」など県内蔵も採用。山口が「吟醸大国」として世界に躍り出た立役者の一つ。',
      zh: '山口縣產業技術中心選拔育成的吟釀酵母。從協會9號系派生的酵母株，能豐富產生己酸乙酯同時酸度溫和，具備爽利吟釀香。「獺祭」以其與協會1801號併用聞名，「東洋美人」「雁木」等縣內蔵也採用。是山口作為「吟釀大國」躍上世界舞台的功臣之一。',
      en: 'A ginjo yeast selectively bred by the Yamaguchi Industrial Technology Center. Derived from the Kyokai No. 9 lineage, it delivers abundant ethyl caproate with restrained acidity and crisp ginjo aromas. Famously blended with Kyokai No. 1801 in Dassai brewing, and used by Toyobijin, Gangi, and other Yamaguchi breweries powering the region\'s global ginjo profile.',
    },
  },
  {
    id: 'kyoto-yeast',
    group: 'local-yeast',
    terms: { ja: ['京都酵母', '京の咲', '京都酵母 京の咲'], zh: ['京都酵母', '京の咲'], en: ['kyoto yeast', 'kyo no saki'] },
    title: { ja: '京都酵母 京の咲', zh: '京都酵母 京の咲', en: 'Kyoto Yeast "Kyo no Saki"' },
    body: {
      ja: '京都府農林水産技術センターが開発した京都府オリジナル酵母。バナナ・洋梨系の柔らかい吟醸香と、京料理に寄り添う穏やかで上品な酸味が特徴。伏見の蔵元を中心に、京都産酒米「祝」との組み合わせで京都テロワールを表現する試みに使われる。',
      zh: '京都府農林水產技術中心開發的京都府原創酵母。以香蕉、洋梨系柔和吟釀香，以及貼近京料理的溫和高雅酸味為特徵。伏見蔵元為中心，與京都產酒米「祝」搭配，用於表現京都風土的嘗試。',
      en: 'A proprietary Kyoto yeast developed by the Kyoto Agricultural Technology Center. Soft banana- and pear-like ginjo aromas with restrained, elegant acidity that pairs with Kyoto cuisine. Used mainly by Fushimi breweries — often together with the Kyoto rice "Iwai" — as an expression of Kyoto terroir.',
    },
  },
  {
    id: 'ringo-san-kobo',
    group: 'local-yeast',
    terms: { ja: ['リンゴ酸酵母', 'リンゴ酸高生産性酵母', 'リンゴ酸高生産酵母', '高リンゴ酸酵母'], zh: ['蘋果酸酵母', 'リンゴ酸酵母'], en: ['malic acid yeast', 'high malic acid yeast'] },
    title: { ja: 'リンゴ酸酵母（高リンゴ酸生産性酵母）', zh: '蘋果酸酵母', en: 'Malic Acid Yeast' },
    body: {
      ja: '通常の酵母より数倍〜十数倍のリンゴ酸を生成する特殊酵母の総称。爽やかで白ワインを思わせる酸味を生み、低アルコール・食中酒向けの日本酒に用いられる。福島県開発の「うつくしま煌酵母」、静岡・山梨など複数の県が独自株を持ち、CEL-24などスパークリング系にも共通する性質。',
      zh: '產生比一般酵母高數倍至十數倍蘋果酸的特殊酵母總稱。能酿出清爽、令人聯想到白酒的酸味，用於低酒精・佐餐向的日本酒。福島縣開發的「うつくしま煌酵母」，靜岡・山梨等多縣皆有獨自酵母株，也與CEL-24等發泡系共通此特性。',
      en: 'A family of specialty yeasts that produce several to over ten times the malic acid of standard strains. Yields crisp, white-wine-like acidity — used for low-alcohol, food-friendly sake. Fukushima\'s "Utsukushima Kirameki," Shizuoka and Yamanashi strains all belong here; the property is also shared by CEL-24 and other sparkling yeasts.',
    },
  },
  {
    id: 'kura-tsuki-kobo',
    group: 'ingredient',
    terms: { ja: ['蔵付酵母', '蔵付き酵母', '蔵付十号酵母', '自社蔵付十號', '家付き酵母', 'ハウス酵母'], zh: ['蔵付酵母', '藏付酵母', '房內酵母'], en: ['kura-tsuki yeast', 'house yeast'] },
    title: { ja: '蔵付酵母', zh: '蔵付酵母', en: 'Kura-tsuki (House) Yeast' },
    body: {
      ja: '酒蔵の建物・設備に自然に住み着いている野生酵母群の総称。長年同じ蔵で酒を醸すうちに、その蔵に適応した独自の酵母群が形成される。協会酵母のような均一な発酵は難しいが、他の蔵では再現できない「その蔵だけの味」を生む。生酛・山廃系や無添加醸造で重視され、「新政」の6号酵母もかつては蔵付酵母だった。',
      zh: '酒蔵建築與設備上自然棲息的野生酵母群總稱。同一蔵長年釀酒的過程中，會形成適應該蔵的獨自酵母群。難以像協會酵母那樣均勻發酵，但能酿出其他蔵無法重現的「該蔵獨有的味道」。生酛・山廃系與無添加釀造重視此類酵母，「新政」6號酵母亦曾是蔵付酵母。',
      en: 'The community of wild yeasts naturally inhabiting a brewery\'s building and equipment. Over generations of brewing, each kura develops its own adapted yeast community. Less predictable than Kyokai yeasts, but produces a "sound of the house" no other brewery can replicate. Central to kimoto/yamahai and additive-free brewing — Aramasa\'s Kyokai No. 6 originated as a house yeast.',
    },
  },
  {
    id: 'kobo-mutenka',
    group: 'method',
    terms: { ja: ['酵母無添加', '無添加', '酵母添加なし'], zh: ['酵母無添加'], en: ['no added yeast', 'yeast-free', 'yeast unadded'] },
    title: { ja: '酵母無添加', zh: '酵母無添加', en: 'No Added Yeast' },
    body: {
      ja: '培養酵母を添加せず、蔵付酵母や酒母中に自然に増殖する酵母のみで発酵させる醸造法。生酛・山廃系との組み合わせが多く、発酵の主導権を微生物の自然な生態系に委ねる。予測しづらいが、複雑で個性的な味わいと蔵の風土を反映した酒が生まれる。近年の自然派・クラシック系ムーブメントの代表的キーワード。',
      zh: '不添加培養酵母，僅以蔵付酵母或酒母中自然增殖之酵母進行發酵的釀造法。多與生酛・山廃系搭配，將發酵主導權交給微生物的自然生態系。難以預測，但能酿出複雜個性的味道，反映蔵之風土。近年自然派・復古系運動的代表關鍵字。',
      en: 'A brewing method that adds no cultured yeast — fermentation relies on the house yeasts already present in the brewery or that naturally proliferate in the moto. Typically paired with kimoto or yamahai. Yields unpredictable but complex, terroir-driven sake, and stands as a signature keyword of the natural/classic sake movement.',
    },
  },
  {
    id: 'shirokoji',
    group: 'ingredient',
    terms: { ja: ['白麹', '白麴', '白麹菌'], zh: ['白麴', '白麴菌'], en: ['shirokoji', 'white koji'] },
    title: { ja: '白麹', zh: '白麴', en: 'Shirokoji (White Koji)' },
    body: {
      ja: '本来は焼酎造りに用いられる麹菌 Aspergillus kawachii（アワモリ黒麹菌の白色変異株）。日本酒の一般的な黄麹と比べクエン酸を大量に生成するため、爽やかで白ワインのような酸味を持つ新感覚の日本酒が造れる。「新政 亜麻猫」を筆頭に、近年一部の革新系蔵元が黄麹と併用して独自の酒質を追求している。',
      zh: '原本用於燒酎釀造的麴菌 Aspergillus kawachii（泡盛黑麴菌之白色變異株）。與日本酒常用之黃麴相比，能大量產生檸檬酸，可酿出清爽如白酒般酸味的新感覺日本酒。「新政 亜麻猫」為首，近年部分革新系蔵元將其與黃麴併用，追求獨特酒質。',
      en: 'A koji mold (Aspergillus kawachii) traditionally used in shochu — a white mutation of the black koji used for awamori. Compared to sake\'s standard yellow koji, it produces abundant citric acid, enabling crisp, white-wine-like sake. Aramasa\'s "Amaneko" popularized its use; a handful of innovative breweries now blend it with yellow koji to craft distinctive new styles.',
    },
  },
  {
    id: 'kijoshu',
    group: 'type',
    terms: { ja: ['貴醸酒'], zh: ['貴釀酒', '贵酿酒'], en: ['kijoshu'] },
    title: { ja: '貴醸酒', zh: '貴釀酒', en: 'Kijoshu' },
    body: {
      ja: '仕込み水の一部に清酒を使って醸造した、濃厚でとろりとした甘口の日本酒。通常の酒より糖度が高く、デザートやチーズとの相性が抜群。NHK会長の依頼で1974年に国税庁醸造試験所が開発した比較的新しい製法。アルコール度数はやや低め（10〜15度）で、とろりとした口当たりと蜂蜜・バナナのような濃密な甜香が特徴。',
      zh: '以清酒代替部分釀造用水釀製，口感濃郁甜潤，糖度高，適合搭配甜點或起司。1974年由日本國稅廳釀造試驗所開發，是相對新穎的釀酒工藝。酒精度略低（約10〜15度），帶有蜂蜜、香蕉般的濃甜香氣。',
      en: 'A rich, sweet sake brewed by substituting sake for part of the brewing water. Developed in 1974 by Japan\'s National Tax Agency brewing lab. Higher sugar content, lower alcohol (10–15%), with honeyed, banana-like sweetness. Pairs well with desserts and cheese.',
    },
  },
  {
    id: 'kire',
    group: 'flavor',
    terms: { ja: ['キレ', '切れ'], zh: ['切れ', '乾淨收尾', '干净收尾'], en: ['kire', 'clean finish'] },
    title: { ja: 'キレ', zh: '切れ（乾淨收尾）', en: 'Kire (Clean Finish)' },
    body: {
      ja: '飲み込んだ後に余韻が長引かず、口の中がすっきりする感覚。辛口の日本酒に多く見られる特徴。',
      zh: '饮后余味不拖沓、口感清爽利落的感觉，多见于辛口日本酒。',
      en: 'A clean, quick finish with little lingering aftertaste. A hallmark of dry sake.',
    },
  },
  {
    id: 'meigara',
    group: 'people',
    terms: { ja: ['銘柄'], zh: ['銘柄', '品牌'], en: ['meigara', 'sake brand'] },
    title: { ja: '銘柄', zh: '銘柄（品牌名）', en: 'Meigara (Brand Name)' },
    body: {
      ja: '日本酒の「ブランド名」にあたる呼び名。「新政」「獺祭」「而今」など、蔵元がその酒に付けた固有の名前。一つの蔵元が複数の銘柄を持つこともある。同じ銘柄でも「純米吟醸」「大吟醸」など品名（酒款）が異なれば別の酒になる。日本酒を選ぶ・記録するときの最も基本的な識別単位。',
      zh: '日本酒的「品牌名稱」。如「新政」「獺祭」「而今」，是蔵元賦予該酒的專屬名稱。同一蔵元可擁有多個銘柄，同一銘柄下又有純米吟釀、大吟釀等不同酒款。銘柄是選酒與記錄時最基本的識別單位。',
      en: 'The brand name of a sake — e.g. Aramasa, Dassai, Jikon. Assigned by the brewery (蔵元). One brewery may produce multiple meigara, and each meigara can have many product lines (junmai ginjo, daiginjo, etc.). The most fundamental unit when identifying, choosing, or recording sake.',
    },
  },
]

// Build a flat lookup for fast keyword detection
// Look up a raw text value (e.g., "山田錦") in WIKI_TERMS and return the
// localized title for the given language. Falls back to the original text
// if no matching term is found. Matches against ja/zh/en alias arrays.
export function localizedTerm(text, lang) {
  if (!text || lang === 'ja') return text
  const effLang = lang === 'zh-tw' ? 'zh' : lang
  for (const term of WIKI_TERMS) {
    const allAliases = [
      ...(term.terms.ja || []),
      ...(term.terms.zh || []),
      ...(term.terms.en || []),
    ]
    if (allAliases.includes(text)) {
      return term.title?.[effLang] || text
    }
  }
  return text
}

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
