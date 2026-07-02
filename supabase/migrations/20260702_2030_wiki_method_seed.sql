-- Phase 3 Step 3.6: Align 'nama' → 'namazake' naming + seed 5 missing method Wiki entries.
-- Run in Supabase SQL Editor.
--
-- Context: WIKI_TERMS (wiki.js) and wiki_articles already use 'namazake'.
-- Our new method tag uses 'nama'. Aligning to 'namazake' for consistency.
-- Already-covered by wiki: namazake, genshu, kimoto, yamahai.
-- Missing entries: nigori, koshu, taruzake, sparkling, kijoshu.

BEGIN;

-- ============================================================
-- 1. Rename method tag 'nama' → 'namazake' (align with wiki system)
-- ============================================================
UPDATE sake_tags SET id = 'namazake' WHERE id = 'nama' AND category = 'method';

-- Propagate rename to historical entries
UPDATE sake_entries SET method_tags = array_replace(method_tags, 'nama', 'namazake')
  WHERE 'nama' = ANY(method_tags);

-- ============================================================
-- 2. Seed 5 missing wiki articles for method tags
-- ============================================================
INSERT INTO wiki_articles (term_id, summary_ja, summary_zh, summary_zhtw, summary_en, body_ja, body_zh, body_zhtw, body_en) VALUES

  ('nigori',
    '粗い布で濾した白濁の日本酒。米粒の食感が残り、甘みとコクが特徴。',
    '用粗布过滤而保留米粒感的白浊日本酒。口感甜润，酒体饱满。',
    '用粗布過濾而保留米粒感的白濁日本酒。口感甜潤，酒體飽滿。',
    'Coarsely filtered sake with rice sediment remaining. Cloudy white appearance with a sweet, textured mouthfeel.',
    'にごり酒は醪（もろみ）を目の粗い布や網で濾したもので、米や麹の固形物が残り白濁している。通常の日本酒が微細な布や絹で濾されて透明になるのに対し、あえて残す製法。飲み口は甘くまろやか、口当たりに米の食感がある。発酵が完全に止まっていない「活性にごり」もあり、瓶内で微発泡することがある。冬季限定商品として出回ることが多い。',
    '浊酒（にごり酒）是将醪（发酵中的酒醪）用粗布或粗网过滤而成，保留米粒和麹的固形物，呈现白浊状。相较于普通日本酒使用细密布或绢过滤得到透明酒液，浊酒特意保留固形物。口感甜润圆滑，含有米粒的口感。也有发酵未完全停止的「活性浊酒」，瓶内可能有微气泡。多为冬季限定商品。',
    '濁酒（にごり酒）是將醪（發酵中的酒醪）用粗布或粗網過濾而成，保留米粒和麴的固形物，呈現白濁狀。相較於普通日本酒使用細密布或絹過濾得到透明酒液，濁酒特意保留固形物。口感甜潤圓滑，含有米粒的口感。也有發酵未完全停止的「活性濁酒」，瓶內可能有微氣泡。多為冬季限定商品。',
    'Nigori sake is produced by filtering moromi (fermenting mash) through a coarse cloth or mesh, leaving rice and koji particles that give the sake its cloudy white appearance. In contrast to standard clear sake filtered through fine cloth, nigori intentionally preserves solids. The mouthfeel is sweet and creamy with a distinct rice texture. Some varieties called "kassei nigori" retain active fermentation and may lightly effervesce in the bottle. Commonly released as a seasonal winter product.'),

  ('koshu',
    '3年以上熟成させた日本酒。黄金色〜琥珀色に変化し、ドライフルーツやカラメルのような複雑な熟成香が特徴。',
    '经过3年以上熟成的日本酒。呈金黄至琥珀色，具有干果、焦糖般复杂的熟成香。',
    '經過3年以上熟成的日本酒。呈金黃至琥珀色，具有果乾、焦糖般複雜的熟成香。',
    'Sake aged 3 years or more. Develops golden to amber color with complex aged aromas of dried fruit and caramel.',
    '古酒（長期熟成酒）は3年以上熟成させた日本酒。時間経過とともに色は透明から黄金色、さらに琥珀色へと変化し、香りはドライフルーツ、蜂蜜、カラメル、キノコ、醤油などの複雑な熟成香を帯びる。とろりとした口当たりと濃厚な旨みが特徴で、常温〜燗酒で楽しむのが一般的。近年は10年、20年もの長期熟成古酒も注目されている。ワインやシェリー酒に比肩する日本酒の一形態。',
    '古酒（长期熟成酒）指熟成3年以上的日本酒。随着时间推移，颜色从透明变为金黄色，进而转为琥珀色，香气发展出果干、蜂蜜、焦糖、菇类、酱油等复杂的熟成香。口感浓稠，具有浓厚的旨味，一般以常温或温燗品尝。近年10年、20年的长期熟成古酒也颇受关注。是可与葡萄酒、雪利酒媲美的日本酒品类。',
    '古酒（長期熟成酒）指熟成3年以上的日本酒。隨著時間推移，顏色從透明變為金黃色，進而轉為琥珀色，香氣發展出果乾、蜂蜜、焦糖、菇類、醬油等複雜的熟成香。口感濃稠，具有濃厚的旨味，一般以常溫或溫燗品嚐。近年10年、20年的長期熟成古酒也頗受關注。是可與葡萄酒、雪莉酒媲美的日本酒品類。',
    'Koshu (aged sake) is sake matured for 3 years or more. Over time it transforms from clear to golden to amber, with aromas developing into complex aged notes of dried fruit, honey, caramel, mushrooms, and soy sauce. The mouthfeel becomes rich and viscous with concentrated umami, typically enjoyed at room temperature or warmed. Long-term aged koshu of 10 or 20 years has gained recent attention. A rare Japanese counterpart to Sherry or aged wines.'),

  ('taruzake',
    '杉樽で貯蔵し、樽由来の木香を移した日本酒。香り高く祝い事に用いられることが多い。',
    '在杉木樽内贮存吸取木香的日本酒。香气浓郁，常用于庆典场合。',
    '在杉木樽內貯存吸取木香的日本酒。香氣濃郁，常用於慶典場合。',
    'Sake matured in cedar barrels, gaining a distinctive woody aroma. Often used in celebrations.',
    '樽酒は日本酒を杉樽（主に吉野杉）で一定期間貯蔵し、樽材から溶け出す木香を移したもの。香りが華やかで、鏡開きなど祝い事の場面で振る舞われることが多い。江戸時代、灘や伏見から江戸まで樽廻船で運ばれた歴史があり、当時の日本酒はすべて樽の香りを纏っていた。現代ではガラス瓶が主流だが、樽貯蔵は伝統的な風味として珍重される。',
    '樽酒是将日本酒在杉木樽（主要为吉野杉）内贮存一段时间，吸取樽材木香而成。香气华丽，常在开樽仪式等庆典场合分享。江户时代，灘和伏见的酒经樽船运往江户，那时的日本酒都带有樽香。现代虽以玻璃瓶为主，樽贮藏作为传统风味仍被珍视。',
    '樽酒是將日本酒在杉木樽（主要為吉野杉）內貯存一段時間，吸取樽材木香而成。香氣華麗，常在開樽儀式等慶典場合分享。江戶時代，灘和伏見的酒經樽船運往江戶，那時的日本酒都帶有樽香。現代雖以玻璃瓶為主，樽貯藏作為傳統風味仍被珍視。',
    'Taruzake is sake matured for a period in cedar barrels (typically Yoshino cedar), acquiring wood-derived aromas. Its fragrant character makes it popular at ceremonial "kagami-biraki" barrel-breaking events. During the Edo period, sake from Nada and Fushimi was transported to Edo in barrels, and all sake of that era carried barrel notes. Though glass bottles are standard today, barrel maturation remains a treasured traditional style.'),

  ('sparkling',
    '瓶内二次発酵または炭酸ガス封入で発泡する日本酒。低アルコール・爽快で乾杯用途に人気。',
    '通过瓶内二次发酵或充填二氧化碳而带气泡的日本酒。酒精度低、清爽，适合作为祝酒。',
    '透過瓶內二次發酵或充填二氧化碳而帶氣泡的日本酒。酒精度低、清爽，適合作為祝酒。',
    'Sparkling sake produced via bottle refermentation or CO2 injection. Low alcohol, refreshing, popular for toasts.',
    '発泡日本酒（スパークリング日本酒）は、瓶内二次発酵によって自然な炭酸ガスを封じ込めたものと、瓶詰め時に炭酸ガスを添加したものの二種類がある。前者はシャンパン方式に近く上質。低アルコール（5〜10%程度）の商品が多く、爽やかな酸味と発泡感でシャンパンのような乾杯用途に人気。「AWA SAKE協会」による認証基準もあり、日本酒の新ジャンルとして市場が拡大している。',
    '发泡日本酒（气泡日本酒）分为瓶内二次发酵自然产生二氧化碳的类型，以及瓶装时充填二氧化碳的类型。前者接近香槟法，品质上乘。多为低酒精度（5〜10%）商品，具有清爽的酸味和发泡感，作为香槟式的祝酒饮料广受欢迎。「AWA SAKE协会」也制定了认证标准，作为日本酒新品类正在扩大市场。',
    '發泡日本酒（氣泡日本酒）分為瓶內二次發酵自然產生二氧化碳的類型，以及瓶裝時充填二氧化碳的類型。前者接近香檳法，品質上乘。多為低酒精度（5〜10%）商品，具有清爽的酸味和發泡感，作為香檳式的祝酒飲料廣受歡迎。「AWA SAKE協會」也制定了認證標準，作為日本酒新品類正在擴大市場。',
    'Sparkling sake comes in two main styles: those with natural carbonation from bottle refermentation (similar to Champagne method, considered higher quality), and those with CO2 injected during bottling. Products typically feature lower alcohol (5-10%) with crisp acidity and effervescence, gaining popularity as a Champagne-like toast beverage. The "AWA SAKE Association" has established certification standards, and this category is growing as a new sake genre.'),

  ('kijoshu',
    '仕込み水の代わりに日本酒を使う特殊な製法。極めて濃厚な甘みと旨みが特徴の贅沢な酒。',
    '以日本酒代替仕込水的特殊酿造法。以极浓的甜味和旨味为特色的奢华酒品。',
    '以日本酒代替仕込水的特殊釀造法。以極濃的甜味和旨味為特色的奢華酒品。',
    'Sake brewed with sake instead of water in the mash. Yields intensely sweet, richly flavored premium sake.',
    '貴醸酒は仕込み水の一部を日本酒に置き換えて醸造する特殊な製法の日本酒。1973年に国税庁醸造試験所が古典の三段仕込みに基づいて開発。酒で酒を仕込むため、酵母の発酵が甘みの残る段階で止まり、極めて濃厚な甘みと旨みを持つ酒質となる。琥珀色に近い色調と粘性のある口当たり、蜂蜜やドライフルーツを思わせる香り。デザート酒として食後にストレートで、または熟成させて楽しむ。生産量が少なく高価。',
    '贵酿酒是将仕込水的一部分替换为日本酒进行酿造的特殊制法日本酒。1973年由国税厅酿造试验所根据古代三段仕込法开发。以酒仕酒的方式使酵母发酵在甜味残留的阶段停止，形成极为浓厚的甜味与旨味的酒质。近琥珀色的色泽、粘稠的口感，具有蜂蜜、果干般的香气。作为餐后甜酒纯饮，或陈年后享用。产量少，价格昂贵。',
    '貴釀酒是將仕込水的一部分替換為日本酒進行釀造的特殊製法日本酒。1973年由國稅廳釀造試驗所根據古代三段仕込法開發。以酒仕酒的方式使酵母發酵在甜味殘留的階段停止，形成極為濃厚的甜味與旨味的酒質。近琥珀色的色澤、黏稠的口感，具有蜂蜜、果乾般的香氣。作為餐後甜酒純飲，或陳年後享用。產量少，價格昂貴。',
    'Kijoshu is sake brewed using a special method where part of the mash water is replaced with finished sake. Developed by the National Tax Agency Brewing Research Institute in 1973, based on ancient three-stage brewing techniques. Using sake to brew sake causes yeast fermentation to stop while sweetness remains, producing an extraordinarily rich, sweet, and umami-forward sake. It exhibits an amber-tinged color, viscous mouthfeel, and honeyed dried-fruit aromas. Enjoyed as a dessert sake, served neat after meals or further aged. Production is limited and prices are high.')

ON CONFLICT (term_id) DO NOTHING;

-- ============================================================
-- Verification
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM wiki_articles WHERE term_id IN ('namazake','nigori','koshu','genshu','taruzake','sparkling','kimoto','yamahai','kijoshu')) AS method_wiki_covered,
  (SELECT COUNT(*) FROM sake_tags WHERE id = 'namazake' AND category = 'method') AS method_tag_renamed;

COMMIT;
