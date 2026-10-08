# Kikiroku 更新日志

## 2026-10-08 ⑨飲みたい・⑩瓶身「水平」（`redesign` 预览站，尚未上线）

### ⑨ 飲みたい `/wishlist`
- 用户选方案 B：★優先＋一句メモ；事典酒款页、自己的酒札也能加入。
- **资料以事典为准**：每笔 wish 连到 `sake_products`；来源酒札只当出处。酒札被删或改成非公开，wish 不会消失。事典没有的酒，加入时自动新增到事典。
- 卡片：瓶身、来源（廣場から／事典から／自分の酒札から）、酒造・产地・种类、メモ；操作 記録する／メモ／外す（外す 有确认、显示酒名）。
- 分页：すべて（優先在上）／優先／産地順。空状态用狸猫。
- 入口：マイ帳快捷集合「飲みたい · 次に記録したい酒」；酒款详情「飲みたい」；自己的酒札「また飲みたい」；廣場、他人的酒详情维持。
- 「記録する」行为不变：确认后从清单移出（用户：还没想好，先不改）。
- 删掉 Journal 里旧的 WishlistView／ForwardConfirmDialog。

### ⑩ ラベル撮影・裁切
- 用户：入口和背标裁切维持现状。
- 瓶身编辑器加「水平」滑杆：±45°、0.5° 一格，叠加在「回転」（90°）上；角度数字按一下回 0°；框内加虚线中轴；键盘 `[` `]`。

### 数据库
| 迁移档 | 内容 |
|---|---|
| `20261008_wish_products.sql` | `sake_wishes` 加 `product_id`／`priority`／`note`，`entry_id` 可空且酒札删除时设为 null；每人每酒款一笔；回填（既有 1 笔「司牡丹 Delight Sparkling 純米吟醸」新增到事典）；update RLS |

### 修正与坑
- 旧版「記録する」会漏掉 `product_id`，已修。
- 事典 `sake_products.type` 存漢字，App 新增酒款原本写成 id（junmai-ginjo）→ 改用 `typeKanji()`。
- `ensureProduct` 抽到 `lib/wishes.js`，新增表单和飲みたい共用。

### 待办
- 用户在预览站实测飲みたい（★、メモ、事典加入）→ 合并 main 上线。
- 下一页：⑪編集モード。

## 2026-10-07 ✅ 「酒札」改版上线

- `redesign` 快进合并到 `main`（commit `11353fc`），部署正式站。
- www.kikiroku.com／kikiroku.com／kikiroku.pages.dev 都已确认是新版；访客流程（廣場、事典、産地、ログイン、酒詳情）无错误。
- 回退方式：Cloudflare Pages 后台把上一个 production deployment 设回来。

### 上线前修正
- 旧分享网址 `/entry/:id` 转到新的酒詳情；删除旧 `EntryDetail`、`BrandMark`。
- 分享图页尾改成「Kikiroku · 日本酒の記録帳」；种类显示名称（特別純米）而不是 id。
- 新增表单「感想」：香り／味わい／メモ／整理 改成全部展开（原本的分页按钮和 tag 长得一样，用户以为没有味道标签和笔记栏）。

### 本次新增的页面（10/07 下午～晚上）

| 页面 | 重点 |
|---|---|
| 廣場 v3/v4 | 评分段色框（5.0〜<3.0 六段）、数字＋圆点、印章；设计端透明狸猫从卡片上缘探头；每张卡显示推荐理由（近い好み／飲んだ酒造／記録のある産地／評価上位／新着）；访客一律中性色 |
| 狸猫规则 | 同评分段连续只出现在第一张，评分段换了就出现 |
| 事典 | 酒款／産地・酒造／用語／原料 四分页；酒款详情（规格、みんなの瓶身、你的记录、同酒造酒款、この酒を記録）；目录没有的酒由公开记录拼出详情页；酒造详情（读音、IWC、銘柄、酒款） |
| 産地 | `/region/:name`；只放客观资料（自分の酒札数、よく飲む酒造、酒造数、公開酒札数）；自分の酒札／公開酒札／酒造 |
| プロフ | 狸猫头像 9 选 1；4 个数字跳到マイ帳对应筛选；常选香味、种类、日本地图（点县进産地页）；设定：表示名、言語、プライバシー（新记录默认公开、公开时的名字）、CSV／JSON 导出、登出确认 |
| ログイン | Kikiroku＋狸猫 icon；ログイン／新規登録 单一画面；邀请码；错误讯息改成白话；「ログインせずに廣場を見る」 |
| 品牌栏退场 | 语言和登出移到プロフ；访客的语言按钮留在廣場／事典／ログイン |

### 数据库（10/07 晚）

| 迁移档 | 内容 |
|---|---|
| `20261007_entry_product_id.sql` | `sake_entries.product_id`＋索引；唯一命中回填 10/109 笔 |
| `20261007_region_normalize.sql` | 「高知」等写法统一成「高知県」（entries、products）；执行后无非正式县名 |

### 修正与坑
- **SakeBottleCrop 露出米色底**：列表原本先把照片裁成框大小再位移；改成和编辑器同一套几何（按原图比例 cover 后再变换）。保存的位置不用重调。
- 廣場推荐理由偶尔显示 tag id（honey）：tag 字典晚到时没有重算，已修。
- 临时工具「瓶身まとめて調整」（`/tools/bottles`）：用户把 90 张照片调整完后已移除。
- GitHub 推送：remote 网址里的旧 token 失效 → 改用 `gh auth setup-git`。

### 试过但撤回的
- **廣場 v5（手绘底板卡片）**：用设计端 `plaza-v3-hi-fi` 素材整张重做，好看但和整体设计不搭，已 `git revert`（素材切图仍在 commit `09556ae`）。

---

## 2026-10-06 ～ 10-07 上午（「酒札」改版，`redesign` 分支）

### 概要
- 依照设计稿 `kikiroku-ui-redesign.html` 分页实作，每页送审、确认后才进下一页。
- 预览站：https://redesign.kikiroku.pages.dev
- 正式站已于 2026-10-07 切换（见上方）。

### 已完成的页面

| 页面 | 重点 |
|---|---|
| 地基 | 单一浅色 token；Sheet 弹层（Esc／焦点锁定／打开时隐藏底栏）；底栏有文字标签和 aria；酒类型统一成 id；评分 0.5 级距 |
| マイ帳 | 全文搜索＋命中原因；4 个快捷集合＋飲みたい入口；「書きかけ」草稿区；筛选抽屉（状态／评分／饮用日含期间指定／产地／香气味道）；札／表 两种密度 |
| 新しい記録 | 手机全屏；单一酒名栏（自动拆出銘柄）；饮用日「今日 · 変更」；感想 3 个分页（上线前改为全部展开），「整理」放在筆記下；tag 先显示 12 个＋もっと見る；公开开关放进底部保存栏（第一次公开会确认）；服务器草稿；照片暂存在 IndexedDB；保存错误显示出来（旧版会默默丢掉） |
| 酒瓶裁切 | SakeBottleCrop（1:3.5、写实瓶型）；BottleCropEditor 手动对齐；列表瓶约 31×108，详情 hero 瓶约占 84%；上传时产生缩图 |
| 酒詳情 | `/journal/:id` 独立页面；瓶身／原図／裏ラベル 切换；…菜单（编辑／调整瓶身／切换公开／分享图片／删除）；みんなの瓶身；规格和全部饮用日默认折叠 |
| 廣場 | 新着／高評価／近い好み；公开酒札卡片；飲みたい／自分も記録；他人记录只读；访客隐藏个人资讯 |

### 数据库

| 迁移档 | 内容 |
|---|---|
| `20261006_redesign_foundation.sql` | `status` 栏、草稿不能公开、新记录默认不公开、评分 0.5 级距约束、漢字 type 转成 id（v1 整段 transaction 失败，v2 改成逐句执行） |
| `20261007_bottle_crop.sql` | `photo_crop` jsonb、`thumb_url` |

### 资料修复

- 现有照片补做缩图 90 张（`scripts/backfill-thumbs.mjs`）。
- 有 18 笔记录的照片放在外部网站（swordandcurse.com，已经失效，Wayback 也没有存档）。
  - 从「照片」App 的 sake collection 相簿找回 35 张原图，重新上传。
  - 旧网址备份在 `backups/2026-10-07-photo-recovery/`。

### 其他

- App 名称统一为「Kikiroku — 日本酒の記録帳」。
- 首页图示改成狸猫 logo。
- 改版前备份：git tag `pre-redesign-2026-10-06`，以及 `backups/2026-10-06T04-25-20/`（DB＋Storage）。
- 部署注意：**`git push` 不会自动部署**，一律用 `wrangler pages deploy`。

---

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
