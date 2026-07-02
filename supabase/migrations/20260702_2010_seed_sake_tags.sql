-- Phase 3 Step 3.2: Seed 84 sake_tags across 5 categories.
-- Run in Supabase SQL Editor after 20260702_2000 (table creation).
--
-- ON CONFLICT DO NOTHING: idempotent, safe to re-run. Manual edits in
-- Studio (updating a translation) are preserved on re-run.
-- To force overwrite a specific row after re-run, DELETE it first then re-run.
--
-- Order within categories reflects intended picker display order (grouped semantically).

INSERT INTO sake_tags (id, category, ja, zh, en, sort_order) VALUES
  -- ============================================================
  -- AROMA (30) — SSI 上立香四分類
  -- ============================================================
  -- 【吟醸香】(13)
  ('floral',        'aroma', '花のような',                    '花香',       'Floral',        0),
  ('fruity',        'aroma', 'フルーティー',                  '果香',       'Fruity',        1),
  ('ginjo-aroma',   'aroma', '吟醸香（ぎんじょうか）',        '吟釀香',     'Ginjo Aroma',   2),
  ('white-flower',  'aroma', '白い花（しろいはな）',          '白花',       'White Flower',  3),
  ('banana',        'aroma', 'バナナ',                        '香蕉',       'Banana',        4),
  ('melon',         'aroma', 'メロン',                        '哈密瓜',     'Melon',         5),
  ('apple',         'aroma', 'リンゴ',                        '蘋果',       'Apple',         6),
  ('pear',          'aroma', '洋梨（ようなし）',              '西洋梨',     'Pear',          7),
  ('pineapple',     'aroma', 'パイナップル',                  '鳳梨',       'Pineapple',     8),
  ('peach',         'aroma', '桃（もも）',                    '水蜜桃',     'Peach',         9),
  ('muscat',        'aroma', 'マスカット',                    '麝香葡萄',   'Muscat',       10),
  ('citrus',        'aroma', '柑橘（かんきつ）',              '柑橘',       'Citrus',       11),
  ('herbal',        'aroma', 'ハーブ',                        '草本',       'Herbal',       12),
  -- 【原料香】(6)
  ('koji',          'aroma', '麹の香り（こうじのかおり）',    '麴香',       'Koji',         13),
  ('rice-aroma',    'aroma', '米の香り（こめのかおり）',      '米香',       'Rice',         14),
  ('steamed-rice',  'aroma', '蒸米（むしまい）',              '蒸米',       'Steamed Rice', 15),
  ('mochi',         'aroma', '餅（もち）',                    '麻糬',       'Mochi',        16),
  ('lactic',        'aroma', '乳酸系（にゅうさんけい）',      '乳酸',       'Lactic',       17),
  ('yogurt',        'aroma', 'ヨーグルト',                    '優格',       'Yogurt',       18),
  -- 【熟成香】(10)
  ('woody',         'aroma', '木のような',                    '木質',       'Woody',        19),
  ('earthy',        'aroma', '土っぽい',                      '土壤',       'Earthy',       20),
  ('nutty',         'aroma', 'ナッツ',                        '堅果',       'Nutty',        21),
  ('spicy',         'aroma', 'スパイシー',                    '辛香',       'Spicy',        22),
  ('caramel',       'aroma', 'キャラメル',                    '焦糖',       'Caramel',      23),
  ('dried-fruit',   'aroma', 'ドライフルーツ',                '果乾',       'Dried Fruit',  24),
  ('vanilla',       'aroma', 'バニラ',                        '香草',       'Vanilla',      25),
  ('cacao',         'aroma', 'カカオ',                        '可可',       'Cacao',        26),
  ('honey',         'aroma', '蜂蜜（はちみつ）',              '蜂蜜',       'Honey',        27),
  ('soy-sauce',     'aroma', '醤油（しょうゆ）',              '醬油',       'Soy Sauce',    28),
  -- 【綜合印象】(1)
  ('mineral',       'aroma', 'ミネラル',                      '礦物感',     'Mineral',      29),

  -- ============================================================
  -- TASTE (23) — SSI 官能評価
  -- ============================================================
  -- 【味わいの型】(3)
  ('sweet',         'taste', '甘口（あまくち）',              '甘口',       'Sweet',         0),
  ('dry',           'taste', '辛口（からくち）',              '辛口',       'Dry',           1),
  ('umami-style',   'taste', '旨口（うまくち）',              '旨口',       'Umami',         2),
  -- 【濃淡】(3)
  ('light-body',    'taste', '淡麗（たんれい）',              '淡麗',       'Light',         3),
  ('medium-body',   'taste', 'ミディアム',                    '適中',       'Medium',        4),
  ('full-body',     'taste', '濃醇（のうじゅん）',            '濃醇',       'Full-bodied',   5),
  -- 【五味】(4) — 三语用古典日本名
  ('umami-rich',    'taste', '旨味（うまみ）',                '旨味',       'Umami',         6),
  ('acidic',        'taste', '酸味（さんみ）',                '酸味',       'Acidic',        7),
  ('bitter',        'taste', '苦味（にがみ）',                '苦味',       'Bitter',        8),
  ('astringent',    'taste', '渋味（しぶみ）',                '澁味',       'Astringent',    9),
  -- 【口当たり】(4)
  ('smooth',        'taste', 'まろやか',                      '圓潤',       'Smooth',       10),
  ('silky',         'taste', 'シルキー',                      '絲滑',       'Silky',        11),
  ('velvety',       'taste', 'とろり',                        '濃稠',       'Velvety',      12),
  ('juicy',         'taste', 'ジューシー',                    '多汁',       'Juicy',        13),
  -- 【余韻・キレ】(3)
  ('crisp',         'taste', 'キレがある',                    '收尾俐落',   'Crisp',        14),
  ('long-finish',   'taste', '余韻（よいん）が長い',          '餘韻悠長',   'Long Finish',  15),
  ('short-finish',  'taste', '余韻が短い',                    '餘韻短促',   'Short Finish', 16),
  -- 【総合・熟酒特徴】(6)
  ('balanced',      'taste', 'バランス良い',                  '平衡佳',     'Balanced',     17),
  ('complex',       'taste', '複雑（ふくざつ）',              '複雜',       'Complex',      18),
  ('refined',       'taste', '上品（じょうひん）',            '優雅',       'Refined',      19),
  ('aged-character','taste', '熟成感（じゅくせいかん）',      '熟成感',     'Aged Character', 20),
  ('matured-umami', 'taste', '熟旨味（じゅくうまみ）',        '熟旨味',     'Matured Umami',21),
  ('nutty-finish',  'taste', 'ナッツ様（よう）の余韻',        '堅果尾韻',   'Nutty Finish', 22),

  -- ============================================================
  -- FLAVOR (12)
  -- ============================================================
  -- 【入手・希少性】(4)
  ('limited',       'flavor', '限定（げんてい）',             '限定',       'Limited',       0),
  ('seasonal',      'flavor', '季節限定（きせつげんてい）',   '季節限定',   'Seasonal',      1),
  ('hiyaoroshi',    'flavor', 'ひやおろし',                   '冷卸',       'Hiyaoroshi',    2),
  ('shinshu',       'flavor', '新酒（しんしゅ）',             '新酒',       'Shinshu',       3),
  -- 【シーン】(3)
  ('home',          'flavor', '家飲み（いえのみ）',           '家飲',       'At Home',       4),
  ('bar',           'flavor', '酒場（さかば）',               '酒吧',       'Bar',           5),
  ('pairing',       'flavor', '料理に合う（りょうりにあう）', '佐餐',       'Food Pairing',  6),
  -- 【評価・意図】(5)
  ('osusume',       'flavor', 'おすすめ',                     '推薦',       'Recommend',     7),
  ('repeat',        'flavor', 'リピート',                     '回購',       'Buy Again',     8),
  ('bottle-worthy', 'flavor', '一本欲しい（いっぽんほしい）', '值得買整瓶', 'Bottle-worthy', 9),
  ('discovery',     'flavor', '新発見（しんはっけん）',       '新發現',     'New Find',     10),
  ('gift',          'flavor', 'ギフト',                       '禮物',       'Gift',         11),

  -- ============================================================
  -- METHOD (9) — 新 category
  -- ============================================================
  ('nama',          'method', '生酒（なまざけ）',             '生酒',       'Nama',          0),
  ('nigori',        'method', 'にごり',                       '濁酒',       'Nigori',        1),
  ('koshu',         'method', '古酒（こしゅ）',               '古酒',       'Koshu',         2),
  ('genshu',        'method', '原酒（げんしゅ）',             '原酒',       'Genshu',        3),
  ('taruzake',      'method', '樽酒（たるざけ）',             '樽酒',       'Taruzake',      4),
  ('sparkling',     'method', '発泡酒（はっぽうしゅ）',       '氣泡酒',     'Sparkling',     5),
  ('kimoto',        'method', '生酛（きもと）',               '生酛',       'Kimoto',        6),
  ('yamahai',       'method', '山廃（やまはい）',             '山廃',       'Yamahai',       7),
  ('kijoshu',       'method', '貴醸酒（きじょうしゅ）',       '貴釀酒',     'Kijoshu',       8),

  -- ============================================================
  -- TYPE (10) — 特定名称酒法定分類
  -- ============================================================
  ('junmai',            'type', '純米（じゅんまい）',                     '純米',         'Junmai',              0),
  ('tokubetsu-junmai',  'type', '特別純米（とくべつじゅんまい）',         '特別純米',     'Tokubetsu Junmai',    1),
  ('junmai-ginjo',      'type', '純米吟醸（じゅんまいぎんじょう）',       '純米吟釀',     'Junmai Ginjo',        2),
  ('junmai-daiginjo',   'type', '純米大吟醸（じゅんまいだいぎんじょう）', '純米大吟釀',   'Junmai Daiginjo',     3),
  ('honjozo',           'type', '本醸造（ほんじょうぞう）',               '本釀造',       'Honjozo',             4),
  ('tokubetsu-honjozo', 'type', '特別本醸造（とくべつほんじょうぞう）',   '特別本釀造',   'Tokubetsu Honjozo',   5),
  ('ginjo',             'type', '吟醸（ぎんじょう）',                     '吟釀',         'Ginjo',               6),
  ('daiginjo',          'type', '大吟醸（だいぎんじょう）',               '大吟釀',       'Daiginjo',            7),
  ('futsushu',          'type', '普通酒（ふつうしゅ）',                   '普通酒',       'Futsushu',            8),
  ('other',             'type', 'その他（そのた）',                       '其他',         'Other',               9)
ON CONFLICT (id) DO NOTHING;

-- Verification: expect 84 total (30 aroma + 23 taste + 12 flavor + 9 method + 10 type)
SELECT
  category,
  COUNT(*) AS n
FROM sake_tags
GROUP BY category
ORDER BY category;
