# Kikiroku — 日本酒の記録帳

一个安静、快速、有记忆感的个人日本酒笔记 App。核心是三件事：

1. 快速记录一瓶酒
2. 以后能找回来
3. 愿意时公开分享其中一部分

- 正式站：https://www.kikiroku.com （`main` 分支）
- 预览站：https://redesign.kikiroku.pages.dev （`redesign` 分支；新功能先在这里确认，再合并到 `main`）
- ⚠️ 预览站连的是**正式数据库**。在预览站做的保存、删除、公开都是真实数据。

---

## 技术栈

| 层 | 用的东西 |
|---|---|
| 前端 | React 19 + Vite（SPA），react-router |
| 后端 | Supabase：PostgreSQL＋Auth＋Storage（`sake-photos` bucket）＋Edge Functions（`search-sake`；`search-products` 已不再被酒名候选使用，见下） |
| 部署 | Cloudflare Pages（project `kikiroku`） |
| 语言 | 日／中／英三语（`src/lib/i18n.js`；新画面多用组件内的 `L(ja, zh, en)`） |

## 开发与部署

```bash
npm install
npm run dev          # 本机开发
npm run build        # 产出 dist/

# 部署（⚠️ git push 不会自动部署，一律手动）
npx wrangler pages deploy dist --project-name kikiroku --branch redesign   # 预览
npx wrangler pages deploy dist --project-name kikiroku --branch main       # 正式

# 发布流程：redesign 确认 → main 快进合并 → 推送 → 部署正式
git checkout main && git merge --ff-only redesign && git push origin main
npm run build && npx wrangler pages deploy dist --project-name kikiroku --branch main
# 出问题时：Cloudflare Pages 后台把上一个 production deployment 设回来即可
```

- GitHub 推送用 `gh` 的登录（`gh auth setup-git`），remote 网址里不放 token。
- `.env.local` 需要：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。脚本还需要 `SUPABASE_SERVICE_ROLE_KEY`。
- DB 结构变更（DDL）要到 Supabase **SQL Editor** 手动执行 `supabase/migrations/` 里的 SQL。
- 资料修正（不改结构）可以用 `SUPABASE_SERVICE_ROLE_KEY` 走 REST 的脚本做（本机没有 DB 密码，也没装 supabase CLI，所以不能跑交易 SQL）。脚本一律：先 dry run 列计划 → 备份到 `backups/` → 先改连结、最后才删除 → 核对笔数。

---

## 2026-10 改版（「酒札」）

**状态**：✅ 2026-10-07 首次上线；最近一次上线 2026-10-13（`main` = commit `2ea9c0c`）。每页都经设计侧／用户确认后才进下一页。

### 设计来源

| 内容 | 位置 |
|---|---|
| 设计稿 | `~/Documents/ChatGPT/Kikiroku/kikiroku-ui-redesign.html` |
| 交接说明 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_HANDOFF_PROMPT.md` |
| 各页确认答复 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_*_REPLY_*.md` |
| 素材（狸猫、印章、瓶框） | `~/Documents/ChatGPT/Kikiroku/assets/`（廣場狸猫 `plaza-tanuki-*-256.png`；头像取自 `kikiroku-tanuki-expression-sheet-v1/v2`、`kikiroku-tanuki-behavior-scenes-v1`） |
| 每页的版面方案／差异清单 | `~/Documents/Claude Projects/_reports/Kikiroku-<页名>-版面方案／待确认差异-<日期>.md` |
| 每页的截图 | `~/Documents/Claude Projects/Kikiroku-review/<页名>/` |

### 进度

| # | 页面 | 状态 |
|---|---|---|
| 1 | マイ帳 `/journal` | ✅ 上线 |
| 2 | 新しい記録（全屏表单） | ✅ 上线（四段进度、引导式保存钮、特定名称＋スタイル・製法、酒名全库候选、装瓶年月选择器；详见下方 10-11〜13 精修） |
| 3 | 酒詳情 `/journal/:id` | ✅ 上线（B 版：小瓶身＋右侧评价与规格；旧分享网址 `/entry/:id` 会转到这里） |
| 4 | 廣場 `/` | ✅ 上线（评分色酒札＋狸猫） |
| 5 | 事典 `/wiki`、`/wiki/sake/:id`、`/wiki/brewery/:id` | ✅ 上线（酒款／産地・酒造／用語／原料） |
| 6 | 産地 `/region/:name` | ✅ 上线（只放客观资料） |
| 7 | プロフ `/profile` | ✅ 上线（狸猫头像 9 选 1、回顾、设定、导出） |
| 8 | ログイン `/login` | ✅ 上线 |
| 9 | 飲みたい `/wishlist` | ✅ 已上线（2026-10-11）（★優先、メモ、すべて／優先／産地順；资料以事典酒款为准） |
| 10 | ラベル撮影・裁切 | ✅ 已上线（2026-10-11）：瓶身编辑器加「水平」微调（±45°）；入口与背标裁切维持现状 |
| 11 | 編集モード | ⏳ 与新增表单共用，待收尾 |

**之后要做**：⑪、记帐页边狸猫（设计候选）、访客可见范围（待用户决定）、背标裁切按钮仍写死中文「取消／確認裁剪」（用户选维持现状）、分享图重做（0.5 分显示）、电脑版双栏、icon／OG 图；事典「公開酒札にある酒」区块是否保留（待决定）。
资料面：事典 946 款酒名里没有种类词（种类可能仍错，需要其他资料来源）；7 笔非公开记录未连事典；7 款共同酿造（DATE SEVEN、NEXT FIVE）没有单一酒造。

### 2026-10-11〜13 精修（都已上线）

| 范围 | 内容 | 依据 |
|---|---|---|
| 酒詳情 | B 版落地：评分 `#7A6227`、「ほかN回」展开飲んだ履歴、他人酒札写「Neroの評価／メモ」且空栏不显示、整理 tag 只给本人（3＋N）、みんなの瓶身 4＋すべて見る；**装瓶日以外的规格全放照片右侧**（用户 10-11 决定，设计端原本只放两项）；返回键按来源显示 マイ帳／廣場／飲みたい／戻る；写真原图完整放进框；顶栏 44×44 | `CLAUDE_DETAIL_B_REPLY_2026-10-09.md`、`KIKIROKU_LIVE_REVIEW_2026-10-13.md` |
| 全站 | 返回上一页恢复捲动位置（`ScrollMemory`）；マイ帳搜索／筛选按浏览纪录保存，从产地页返回仍是筛选结果 | 同上 |
| 新しい記録 | 顶部四段进度（可点、固定）；缺酒名／评分时保存钮改引导文案并跳到该栏；chip 只露最近 3＋常用 6，其余进「もっと見る」（选了不跳位；≤10 个的组全显示）；**特定名称**（首项「表記なし」，「その他」已废）与 **スタイル・製法** 移到「どのお酒？」；酒名候选搜整个事典（每个词都要符合、可捲动、自动载入更多）；装瓶日＝年／月选择器 | `CLAUDE_DETAIL_AND_FLOW_REPLY_2026-10-08.md` §2§3、用户 10-13 |
| スタイル・製法 | 10 → 31 个，按酿造步骤分 6 组（酒母・仕込み・搾り・火入れ・にごり・熟成）；「発泡酒」改名「スパークリング」（日本法定的発泡酒是啤酒类） | 用户 10-13；依事典 4418 款酒名的用词频率 |
| 事典 | 新增 24 个制法条目（日／中繁／英）并按 6 组排列；酒詳情「状態」的制法可点开说明、连到事典；修正「生酒」说明里生貯蔵／生詰め写反；酒款分页的「酒款カタログ」预设收起（标题列显示总数、可展开；搜寻或种类筛选时照常显示结果；同一分页内记住开合），「公開酒札にある酒」维持先显示 5 笔 | 用户 10-13 |
| 酒詳情 × 事典 | 種類、项目名（精米歩合・日本酒度・酸度・原料米・酵母）、原料米与酵母的值都可点开事典说明（`SpecRow`＋`WikiTermChips`／`WikiText`）；多种酒米各自一个连结。事典补上 純米吟醸・純米大吟醸・特別本醸造，酒米 夢吟香・夢山水・吟のいろは・蔵の華・出羽の里・神の穂・野条穂・夢ごこち，酵母 協会77号・三重県酵母（MK／MLA）・M310；别名 協会18号・7号・1101号・KA1・9号系。数字开头的词不从数字中间配对（協会77号 ≠ 7号） | 用户 10-13；条目内容只写查得到出处的事实（日本醸造協会、各县试验场、酒蔵说明） |
| 廣場 | 卡片读屏名称＝酒名、評価、作者、时间；飲みたい／自分も記録 带酒名；狸猫对读屏隐藏 | 交接 §4 |
| マイ帳 | 表模式：36px 瓶槽、固定高度、酒名两行、评分＋日期固定右栏；命中原因「メモに「梨」」「タグ: メロン」「産地: 長野」；札模式 tag 3＋N | 交接 §5 |
| 産地 | 「公開酒札」包含自己的公开酒札（原本排除自己，宮城显示 0）；读取失败显示错误 | 正式站检查 10-13 |

### 视觉原则

- **色票**：
  - 米纸白 `#F8F5EE`
  - 卡片白 `#FFFDF8`
  - 墨黑 `#1F1F1D`
  - 次级文字 `#746C60`
  - 深青绿 `#2F5B4B`
  - 青绿辅助 `#4F8A7B`
  - 清酒淡金 `#B9974A`
  - 木札色 `#D9BE8C`
  - 印章赤褐 `#8F4A35`
  - 危险朱红 `#B9473B`
- **单一浅色主题**（旧的 3 套主题已废除）。
- **对比度**：清酒淡金只用于圆点或装饰，评分数字用深金 `#7A6227`。青绿辅助色不用于小字。
- **公开状态**：公開中＝青绿 pill，非公開＝灰褐 pill。
- **新记录默认不公开**（プロフ › プライバシー可以改成默认公开）。
- **廣場评分色**（`src/lib/plazaTier.js`）：5.0 宝物札／4.5 また飲みたい／4.0 いい記録／3.5 余韻あり／3.0 ふつうに記録／<3.0 好みではない，各有外框色、数字色、印章。访客看不到评分，所以一律中性色。
- **狸猫出现规则（廣場）**：同一评分段连续时只在第一张出现，评分段换了就出现（2026-10-07 用户指定）。狸猫只用在低频、关键时刻，不当装饰。
- **事典不放个人主观资讯**：産地页只放件数、常喝酒造、酒造数、公开数，不放评分／口味倾向／笔记。
- **分页切换不能和内容长得一样**：新增表单的感想区原本用和 tag 一样的 chip 当分页，用户看不出来，已改为全部展开。
- **特定名称 ≠ スタイル・製法**：特定名称是等级（純米・吟醸…，酒标没写就「表記なし」）；にごり・貴醸酒・原酒・生酒・山廃等是スタイル・製法，可多选。季节词（しぼりたて・ひやおろし・新酒）属于「整理」tag。

---

## 程式结构（改版后的部分）

```
src/
  main.jsx                 全站共用样式在这里统一 import（任何页面都可能是第一个打开的）
  index.css                设计 token（旧变数名都 alias 到新颜色）
  App.jsx                  路由；/entry/:id → /journal/:id
  components/
    Nav.jsx / Nav.css      底栏（72px、当前页有金点、中央 ＋ 記録）；旧品牌栏已退场（topbar 预设 false）
    LangButton.jsx         语言切换：只给访客用（廣場／事典标题列、ログイン）；登录后在プロフ切换
    JapanMap.jsx           日本地图（青绿色阶），プロフ用
    ui/Sheet.jsx           所有弹层：Esc 关闭、焦点锁定、打开时隐藏底栏；variant = sheet / dialog / viewer
    ui/Toast.jsx           保存成功的印章提示
    record/RatingPicker    0.5 级距评分（滑杆语义）
    ScrollMemory.jsx       返回／前进恢复捲动位置（按 history key 存 sessionStorage；新页面从顶部开始）
    ChipPicker.jsx         tag 选择：最近 3＋常用 6，其余进「もっと見る」抽屉（可分组）；≤10 个全显示
    TastingTagPicker.jsx   香り／味わい／スタイル・製法（method 用 methodGroups 分组）
    FlavorTagPicker.jsx    整理 tag＋自订标签（自订输入在抽屉里）
    MonthPicker.jsx        装瓶年月选择器（值 `yyyy-mm`；也读得懂旧的 202609／2026-6）
    Autocomplete.jsx       NameInput＝酒名候选：前端直接查 sake_products（每个词 AND、30 笔分页、显示总数）
    WikiTooltip.jsx        事典小说明框（WikiText＝从文字里找用语，多个酒米各自连结；WikiPopup；WikiTermChips＝按 id 连结，制法／种类 id＝事典条目 id）
    plaza/PlazaStamp.jsx   廣場印章（暂定几何图案，等设计端正式版）
    bottle/
      crop.js              瓶型模板：比例 1:3.5、BOTTLE_POINTS、预设裁切 {x, y, scale 1.5, rotation, maskType}
      SakeBottleCrop.jsx   用瓶型轮廓显示照片；载入后按原图比例做 cover，再位移／缩放／旋转（和编辑器同一套几何）
      BottleCropEditor.jsx 手动对齐（拖动／双指／滚轮／方向键、旋转、重设），不用 AI
  pages/
    journal/Ledger.jsx     マイ帳：全文搜索＋命中原因、快捷集合、筛选抽屉（含酒造）、札／表；接收 state: region / brewery / view
    Journal.jsx            マイ帳外壳＋新增／编辑表单；存 product_id、产地正规化、プライバシー默认值
    SakeDetail.jsx         酒詳情：瓶身／原図／裏ラベル、…菜单、みんなの瓶身、分享图；他人只读、访客隐藏个人资讯
    plaza/Plaza.jsx        廣場：新着／高評価／近い好み，每张卡都有推荐理由
    wishlist/Wishlist.jsx  飲みたい（/wishlist）：瓶身、来源、★優先、メモ、記録する／外す
    Wiki.jsx               事典外壳：酒款／産地・酒造／用語（编辑者可直接改三语）／原料
    wiki/SakeShelf.jsx     酒款分页：公開酒札にある酒（先 5 笔）＋酒款カタログ（4418 款，预设收起；开合存 sessionStorage `kk-wiki-catalog-open`）
    wiki/ProductDetail.jsx 酒款详情（/wiki/sake/:id；目录没有的酒用 /wiki/sake/recorded 由公开记录拼出）
    wiki/BreweryDetail.jsx 酒造详情
    wiki/RegionPage.jsx    産地页
    Profile.jsx            プロフ
    Login.jsx              ログイン（单一画面，ログイン／新規登録，邀请码）
  lib/
    ledgerSearch.js        マイ帳搜索（三语 tag、片假名转平假名、简体转日文）
    methodGroups.js        スタイル・製法 6 组（表单抽屉与事典共用；新 tag 不在清单里会落到最后一组）
    recentTags.js          最近用过的 tag（本机 localStorage，保存记录时更新）
    wiki.js                事典用语（静态三语条目，133 条；DB `wiki_articles` 有内容时以 DB 为准，没有 summary 时取正文第一句）。新增条目先查出处、只写能确认的事实；`terms` 是 WikiText 用来配对的别名
    sakeType.js            酒类型统一成 id（normalizeType）；写事典用漢字（typeKanji）
    sakeMatch.js           酒札 ↔ 酒款比对（先看 product_id，再看酒造＋正规化酒名）；公开酒札快取
    region.js              都道府县正规化（高知／高知縣 → 高知県）、regionPath
    plazaTier.js           评分段、狸猫图路径
    plaza.js               自分も記録（forwardFrom 含 product_id）、相对时间
    wishes.js              飲みたい（useWishes）、ensureProduct（找同名酒款或新增到事典；新增表单也用）
    avatars.js             プロフ头像清单（9 个）
    exportEntries.js       CSV（带 BOM，tag 转当前语言）／JSON 导出
    draftPhotos.js         草稿照片的 IndexedDB 暂存
    upload.js              照片上传＋240px 缩图
    shareCard.js           分享图（旧设计，待重做）
    labels.js / rating.js / a11y.js
public/
  plaza/tanuki-<段>.webp   廣場狸猫（设计端透明素材）
  avatars/<id>.webp        プロフ头像
```

## 数据库（这次改版新增的部分）

| 栏位 | 说明 |
|---|---|
| `sake_entries.status` | `draft` / `published`。草稿不能公开（有约束） |
| `sake_entries.is_public` | 默认改为 `false` |
| `sake_entries.rating` | 0.5 级距（约束） |
| `sake_entries.type` | 一律存 `sake_tags` 的 id（漢字已经清掉） |
| `sake_entries.photo_crop` | jsonb，瓶身裁切参数 |
| `sake_entries.thumb_url` | 列表用的缩图（约 240px 宽，存在 `<uid>/thumbs/`） |
| `sake_entries.product_id` | 对应 `sake_products.id`（新记录自动带入；旧资料只回填了唯一命中的 10 笔） |
| `sake_entries.region` / `sake_products.region` | 一律存正式县名（`高知県`），存档时正规化 |
| `sake_wishes.product_id` | 飲みたい对应的事典酒款（必有）；`entry_id` 只是来源酒札，可空，酒札删除后 wish 仍在 |
| `sake_wishes.priority` / `note` | ★優先、一句メモ（60 字） |
| `sake_products.type` | ⚠️ 事典存**漢字**（純米吟醸），和 `sake_entries.type`（id）不同；2026-10-13 已按酒名里的等级词校正 897 笔 |
| `sake_entries.type` 空值 | ＝「表記なし」。`other`（その他）已不再使用，旧资料已改为空 |
| `sake_entries.method_tags` | スタイル・製法 id 阵列；可选值见 `sake_tags`（category `method`，31 个） |
| `sake_entries.bottling_date` | `yyyy-mm` 字串 |
| `auth.users.user_metadata` | `display_name`、`avatar`（头像 id）、`default_public`、`public_name`（都在プロフ设定）；`public_ok`＝看过"公开会让大家看到什么"的确认（每个账号一次） |
| `sake_entries.rating` 空值 | ＝「未評価」。2026-10-21 起只要酒名就能保存（评分可空，也可公开） |
| `account_deletions` | 账号删除申请：`purge_after`（申请＋30 天）、`public_entry_ids`（申请时公开的记录，取消时恢复）。只能经 RPC `request_account_deletion()` / `cancel_account_deletion()` 写入 |

**资料整理（2026-10-13）**：酒款 4354 → 4418（删重复 25、新增 89 款来自用户公开记录）、酒造 1688 → 1682（合并 6 组）、得奖删重复 1；用户 112 笔记录中 105 笔已连 `product_id`；113 款酒款补上 `brewery_id`；39 笔记录按酒名补上制法。

迁移档（都已在 SQL Editor 执行过）：

- `supabase/migrations/20261006_redesign_foundation.sql`
- `supabase/migrations/20261007_bottle_crop.sql`
- `supabase/migrations/20261007_entry_product_id.sql`
- `supabase/migrations/20261007_region_normalize.sql`
- `supabase/migrations/20261008_wish_products.sql`（2026-10-08 执行；既有 1 笔 wish 已连到事典）
- `supabase/migrations/20261021_account_deletion.sql`（2026-10-21 执行）

**账号删除（2026-10-21）**：プロフ › アカウントを削除 → 输入密码 → 记录立刻全部不公开，30 天内登录会看到"削除予定"画面、可取消。到期由 Cloudflare Worker `kikiroku-purge`（`workers/purge`，每天 03:00 JST）删除：照片 → `sake_cheers` → `sake_wishes` → `sake_entries` → auth 用户（`sake_entries.user_id` 对 auth.users 没有 cascade，所以顺序不能换）。事典（`sake_products`）保留。Worker 的 secret：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`；改代码后在 `workers/purge` 里 `npx wrangler deploy`。日志在 Cloudflare 后台（只记件数和 user id 前 8 码）。

## 脚本与备份

| 用途 | 指令／位置 |
|---|---|
| 资料备份 | `SUPABASE_URL=… SUPABASE_SERVICE_KEY=… node scripts/backup-db.js` → `backups/<时间>/`（10 张表的 JSON；Storage 照片另外备份） |
| 补做缩图 | `node scripts/backfill-thumbs.mjs [--dry]`（需要 ImageMagick；原图不动） |
| 改版前备份 | git tag `pre-redesign-2026-10-06`，以及 `backups/2026-10-06T04-25-20/` |
| 外部照片救回记录 | `backups/2026-10-07-photo-recovery/before.json` |
| 2026-10-13 资料整理 | `scripts/dedupe-2026-10-13/`：`dedupe.py`（查重）、`fix_types.py`＋`type_fix_plan.json`（种类）、`link_entries.py`（记录连事典）、`link_breweries.py`（酒款连酒造）、`method_tags.py`（制法分类）、`backfill_methods.py`（按酒名补制法）。都可重跑（不带 `--apply` 只列计划） |
| 2026-10-13 备份 | `backups/2026-10-13-before-dedupe/`、`backups/2026-10-13-apply/`、`backups/2026-10-13-types/`（含各步骤改动前的 JSON） |

## 规则（不可违反）

- **读音**：酒名和酒造的读音只用罗马字／假名，**不用中文拼音**（`romaji` 栏是唯一来源）。
- **Tag 三语**：tag 的日／中／英必须同义同步，一律从 `sake_tags` 字典选。
- **事典内容**：新增或修改条目前先查可靠出处（公家试验场、日本醸造協会、酒蔵官网）；查不到的不写（例：「酒株2号」目前不建条目）。
- **资料修正**：动正式数据库前先备份、先 dry run；用户自己的记录只在用户同意后才批量改（例：39 笔制法补齐、11 笔その他→表記なし）。
