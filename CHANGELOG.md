# Kikiroku 更新日志

## 2026-07-02（Phase 1 + Phase 3 上线日）

### 概要
一次会话完成两大数据库重构：
- **Phase 1**：sake_awards 从字符串匹配升级为 FK 关联
- **Phase 3**：tag 系统从代码常量搬到数据库，5 categories，84 项，SSI 标准对齐

---

## Phase 1 · Awards FK 强类型化

**目标**：消除 Wiki 里酒造受賞查询依赖脆弱的字符串正则匹配。

### 数据库变更（Supabase Migrations）
| 文件 | 内容 |
|---|---|
| `20260702_1000_awards_add_fk.sql` | 加 `brewery_id` / `brand_id` FK 列 |
| `20260702_1010_backfill_awards_fk.sql` | 回填 10,117 brewery FK + 5,533 brand FK（6 chunks × ~2000 行 UPDATE）|
| `20260702_1020_awards_add_indexes.sql` | Partial 索引（brewery_id / brand_id / brewery_gold 复合）|

### 匹配算法（`scripts/match-awards.js`）
多层策略从严到宽：
1. Exact 匹配
2. 剥离法人名（株式会社/有限会社/合資会社/合名会社/合同会社/㈱/㈲/㈾/㈹）
3. 剥离尾部工場/蔵
4. Pipe segment（IWC 格式 `Eng | 日 銘柄 かな`）
5. Substring contains
- **旧字体归一**：國→国 髙→高 櫻→桜 﨑→崎 德→徳 澤→沢 ...
- **全角→半角**：Ｂ→B 等
- **都道府県消歧**：Awards 用「青森」，catalog 用「青森県」，剥后缀比较
- 同都道府県重名：取最低 id

### 匹配结果
- Awards 总行数：27,235
- brewery_id 关联：**10,117 (37.1%)**
- brand_id 关联：5,533 (20.3%)
- 用户实际记录过的 catalog 酒造：**100% 覆盖**
- 未匹配的 63% 是 catalog 外小酒造，NULL 是正确结果

### 前端变更
- **`src/pages/Wiki.jsx` BreweryRow**：受賞查询改用 `brewery_id = brewery.id`（走 FK 索引、精准），未命中回退到旧字符串 ilike—— 零回归

### 意外收获
发现 catalog 内 **122 组重名酒造**（同都道府県、同名多 row 的数据脏点，如桃川 id=12 & 1653），已存记忆，Phase 5 清理。

### 工具脚本
- `scripts/backup-db.js`：REST 全表 JSON dump
- `scripts/match-awards.js`：可复用的多层 fuzzy matcher
- `scripts/gen-backfill-sql.js`：match-plan.json → 分块 UPDATE SQL

### 备份
`backups/2026-07-02T00-46-32/`：9 张表 JSON 快照 11MB（sake_entries 88 行、sake_awards 27235 行 8.4MB 等）

**Commit**：`39ab6b9` Phase 1: Link sake_awards to breweries/brands via FK

---

## Phase 3 · Tag 系统 DB 化

**目标**：把 UI 文案之外的 66 个 tag 常量搬 DB，你在 Supabase Studio 改 tag 翻译，24 小时内所有用户看到新版，不用发版。

### 数据库变更（Supabase Migrations）
| 文件 | 内容 |
|---|---|
| `20260702_2000_create_sake_tags.sql` | 建 sake_tags 表（id text PK, category, ja, zh, en, sort_order, is_active）+ partial 索引 + RLS |
| `20260702_2010_seed_sake_tags.sql` | Seed 84 项 tag（幂等 ON CONFLICT DO NOTHING）|
| `20260702_2020_migrate_entries_tags.sql` | sake_entries 加 method_tags 列 + 老 tag id 迁移 |
| `20260702_2030_wiki_method_seed.sql` | nama→namazake 对齐 + 5 个新 wiki 词条 |

### Tag 全景（84 项 · 5 categories）

**基于 SSI 唎酒師官能評価 + NRIB 感官分析术语**

#### 🌸 aroma（30）— SSI 上立香四分類
- 【吟醸香】(13)：floral, fruity, ginjo-aroma, white-flower, banana, melon, apple, pear, pineapple, peach, muscat, citrus, herbal
- 【原料香】(6)：koji, rice-aroma, steamed-rice, mochi, lactic, yogurt
- 【熟成香】(10)：woody, earthy, nutty, spicy, caramel, dried-fruit, vanilla, cacao, honey, soy-sauce
- 【綜合印象】(1)：mineral

#### 👅 taste（23）— SSI 官能評価六大维度
- 【味わいの型】(3)：sweet, dry, umami-style
- 【濃淡】(3)：light-body, medium-body, full-body
- 【五味】(4) - 三语用古典日本名：umami-rich, acidic, bitter, astringent
- 【口当たり】(4)：smooth, silky, velvety, juicy
- 【余韻・キレ】(3)：crisp, long-finish, short-finish
- 【総合・熟酒特徴】(6)：balanced, complex, refined, aged-character, matured-umami, nutty-finish

#### 🎨 flavor（12）
- 【入手・希少性】(4)：limited, seasonal, hiyaoroshi, shinshu
- 【シーン】(3)：home, bar, pairing
- 【評価・意図】(5)：osusume, repeat, bottle-worthy, discovery, gift

#### ⚗️ method（9 · 新 category）
namazake, nigori, koshu, genshu, taruzake, sparkling, kimoto, yamahai, kijoshu

#### 🏷 type（10）— 特定名称酒法定分類（id 全 romaji 化）
junmai, tokubetsu-junmai, junmai-ginjo, junmai-daiginjo, honjozo, tokubetsu-honjozo, ginjo, daiginjo, futsushu, other

### 历史数据迁移（88 条 entries）
| 迁移类型 | 数量 |
|---|---|
| aroma tag id remap（sweet-aroma→honey, ginjo→ginjo-aroma）| 全部相关行 |
| aroma tag 删除（fresh, mild）| — |
| 跨 category aroma→taste（elegant→refined, rich-aroma→full-body）| — |
| taste tag id remap（umami→umami-style, clean→crisp, deep→full-body, creamy→silky, sharp→crisp, light-feel→light-body）| — |
| taste tag 删除（warm）| — |
| flavor→method 迁移（nama/nigori/koshu）| 相关行 |
| flavor tag 删除（restaurant, anniversary）| — |
| Japanese 自由文本→tag id（生酒→nama, 新酒→shinshu, 季節限定→seasonal, 限定品→limited）| — |
| **貴醸酒 特殊处理**：type='貴醸酒' → type=NULL + method_tags += 'kijoshu' | **2 条** |
| type 汉字→romaji（純米→junmai 等 10 条映射）| 86 条 |

### 前端架构变更
| 文件 | 变更 |
|---|---|
| `src/contexts/TagsContext.jsx` | 新建：TagsProvider + useTags + useTagLabel + useTagResolver。冷启动读 localStorage（24h TTL），异步 fetch DB 覆盖，fallback 到 i18n.js 常量。**双保险**：DB 失败/离线/首屏都不会崩 |
| `src/App.jsx` | 加 TagsProvider 到 provider 链 |
| `src/components/TastingTagPicker.jsx` | `TASTING_TAGS[cat]` → `useTags(cat)` |
| `src/components/FlavorTagPicker.jsx` | `FLAVOR_TAGS` → `useTags('flavor')` |
| `src/pages/Journal.jsx` | 4 处 `getTagLabel/getFlavorTagLabel` → `tagLabel(id, cat)`；SAKE_TYPES.map 用 `tp.ja` 而不是 `tp.id`（因为 id 现在是 romaji） |
| `src/pages/Display.jsx` | 6 处 label 调用切换到 useTagResolver |
| `src/pages/EntryDetail.jsx` | 3 处 label 调用 + typeLabel 简化为 tagLabel(id, 'type') |
| `src/pages/Profile.jsx` | topAroma / topTaste 统计 chip 用 tagLabel |

### 5 个新 Wiki 词条
- **nigori 濁酒**：粗漉し・活性にごり 说明
- **koshu 古酒**：3 年以上熟成 / 与 Sherry 类比
- **taruzake 樽酒**：吉野杉 / 樽廻船历史
- **sparkling 発泡酒**：瓶内二次発酵 vs ガス封入 / AWA SAKE 認証
- **kijoshu 貴醸酒**：1973 年国税庁开发史 / 酒で酒を仕込む

四语覆盖（ja/zh/zh-tw/en）· summary + body。

### 铁律建立
1. **[[kikiroku-tag-trilingual-sync]]**：所有 tag 三语必须同义同步，术语等级匹配
2. **[[kikiroku-sake-naming]]**：酒名读音永远用 romaji，不用中文拼音

**Commit**：`140ad28` Phase 3: Migrate tags to DB with 5 categories + TagsContext

---

## 建立的记忆索引（`~/.claude/projects/-Users-phoebe/memory/`）

新增 8 条记忆：
1. `kikiroku_sake_naming.md` — 酒名读音铁律
2. `kikiroku_phase1_backfill.md` — Phase 1 匹配算法要点 + catalog 122 组重复问题
3. `kikiroku_tag_trilingual_sync.md` — Tag 三语同步铁律
4. `kikiroku_taste_tags_v2.md` — Taste 23 项定案
5. `kikiroku_aroma_tags_v2.md` — Aroma 30 项定案
6. `kikiroku_flavor_tags_v2.md` — Flavor 12 项定案
7. `kikiroku_method_tags_v2.md` — Method 9 项定案（新 category）
8. `kikiroku_sake_types_v2.md` — SAKE_TYPES 10 项定案

---

## 后续独立任务（未来 session 可继续）

### 短期（Phase 3 补丁）
- [ ] **Journal 表单加 method picker UI**：现在数据可迁移进 method_tags 但表单未提供输入
- [ ] flavor 字段的自由日文文本手工映射（如 `甘口 → sweet(taste)`）—— 需要 UI 或脚本

### 中期
- [ ] **Phase 2**：sake_breweries / sake_brands 加 name_zh / name_en（读音仍以 romaji 为准）
- [ ] **Phase 4**：Wiki 完全 DB 化——把 wiki.js 的 WIKI_TERMS 69 条 seed 到 wiki_articles（5 条 method 已入）
- [ ] **UI/UX 字号 token 化 + 卡片密度调整**（讨论时列过，产品分析文档 `kikiroku-产品分析-2026-07-02.txt`）
- [ ] **Journal 拆 3 步流程 + 模板成文**（同上文档）

### 长期
- [ ] **Phase 5**：Catalog 122 组重复酒造清理
- [ ] Wiki 词条持续补充（剩余 4 项：ginjo-aroma 等吟醸香化学基础可补 wiki）

---

## 备份 / 回滚保障

- `backups/2026-07-02T00-46-32/`：Phase 1 之前的完整数据快照
- 所有 migration 幂等（ON CONFLICT DO NOTHING）
- Legacy fallback 在 TagsContext 里：老 tag id 仍能显示 label

## 关键地址

- 生产：https://www.kikiroku.com
- Supabase Dashboard：https://supabase.com/dashboard/project/iqfgzxbwthdybokvafsi
- GitHub：https://github.com/phoebeibt/kikiroku
- 最新提交：`140ad28` (Phase 3) / `39ab6b9` (Phase 1)
