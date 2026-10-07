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
| 后端 | Supabase：PostgreSQL＋Auth＋Storage（`sake-photos` bucket）＋Edge Functions（`search-sake`、`search-products`） |
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

---

## 2026-10 改版（「酒札」）

**状态**：✅ 2026-10-07 已上线正式站（`main` = commit `11353fc`）。每页都经设计侧／用户确认后才进下一页。

### 设计来源

| 内容 | 位置 |
|---|---|
| 设计稿 | `~/Documents/ChatGPT/Kikiroku/kikiroku-ui-redesign.html` |
| 交接说明 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_HANDOFF_PROMPT.md` |
| 各页确认答复 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_*_REPLY_*.md` |
| 素材（狸猫、印章、瓶框） | `~/Documents/ChatGPT/Kikiroku/assets/`（廣場狸猫 `plaza-tanuki-*-256.png`；头像取自 `kikiroku-tanuki-expression-sheet-v1/v2`、`kikiroku-tanuki-behavior-scenes-v1`） |
| 每页的版面方案／差异清单 | `~/Downloads/Kikiroku-<页名>-版面方案／待确认差异-<日期>.md` |
| 每页的截图 | `~/Downloads/Kikiroku-review/<页名>/` |

### 进度

| # | 页面 | 状态 |
|---|---|---|
| 1 | マイ帳 `/journal` | ✅ 上线 |
| 2 | 新しい記録（全屏表单） | ✅ 上线（感想区：香り／味わい／メモ／整理 直接全部显示） |
| 3 | 酒詳情 `/journal/:id` | ✅ 上线（旧分享网址 `/entry/:id` 会转到这里） |
| 4 | 廣場 `/` | ✅ 上线（评分色酒札＋狸猫） |
| 5 | 事典 `/wiki`、`/wiki/sake/:id`、`/wiki/brewery/:id` | ✅ 上线（酒款／産地・酒造／用語／原料） |
| 6 | 産地 `/region/:name` | ✅ 上线（只放客观资料） |
| 7 | プロフ `/profile` | ✅ 上线（狸猫头像 9 选 1、回顾、设定、导出） |
| 8 | ログイン `/login` | ✅ 上线 |
| 9 | 飲みたい | ⏳ 未改版（旧样式，可正常使用） |
| 10 | ラベル撮影・裁切 | ⏳ 与新增表单共用，待收尾 |
| 11 | 編集モード | ⏳ 与新增表单共用，待收尾 |

**之后要做**：⑨〜⑪、分享图重做（0.5 分显示）、电脑版双栏、icon／OG 图；事典「公開酒札にある酒」区块是否保留（待决定）。

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
    Wiki.jsx               事典外壳：酒款／産地・酒造／用語（编辑者可直接改三语）／原料
    wiki/SakeShelf.jsx     酒款分页：公開酒札にある酒＋4353 款目录
    wiki/ProductDetail.jsx 酒款详情（/wiki/sake/:id；目录没有的酒用 /wiki/sake/recorded 由公开记录拼出）
    wiki/BreweryDetail.jsx 酒造详情
    wiki/RegionPage.jsx    産地页
    Profile.jsx            プロフ
    Login.jsx              ログイン（单一画面，ログイン／新規登録，邀请码）
  lib/
    ledgerSearch.js        マイ帳搜索（三语 tag、片假名转平假名、简体转日文）
    sakeType.js            酒类型统一成 id（normalizeType）
    sakeMatch.js           酒札 ↔ 酒款比对（先看 product_id，再看酒造＋正规化酒名）；公开酒札快取
    region.js              都道府县正规化（高知／高知縣 → 高知県）、regionPath
    plazaTier.js           评分段、狸猫图路径
    plaza.js               飲みたい、自分も記録（forwardFrom 含 product_id）、相对时间
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
| `auth.users.user_metadata` | `display_name`、`avatar`（头像 id）、`default_public`、`public_name`（都在プロフ设定） |

迁移档（都已在 SQL Editor 执行过）：

- `supabase/migrations/20261006_redesign_foundation.sql`
- `supabase/migrations/20261007_bottle_crop.sql`
- `supabase/migrations/20261007_entry_product_id.sql`
- `supabase/migrations/20261007_region_normalize.sql`

## 脚本与备份

| 用途 | 指令／位置 |
|---|---|
| 资料备份 | `SUPABASE_URL=… SUPABASE_SERVICE_KEY=… node scripts/backup-db.js` → `backups/<时间>/`（10 张表的 JSON；Storage 照片另外备份） |
| 补做缩图 | `node scripts/backfill-thumbs.mjs [--dry]`（需要 ImageMagick；原图不动） |
| 改版前备份 | git tag `pre-redesign-2026-10-06`，以及 `backups/2026-10-06T04-25-20/` |
| 外部照片救回记录 | `backups/2026-10-07-photo-recovery/before.json` |

## 规则（不可违反）

- **读音**：酒名和酒造的读音只用罗马字／假名，**不用中文拼音**（`romaji` 栏是唯一来源）。
- **Tag 三语**：tag 的日／中／英必须同义同步，一律从 `sake_tags` 字典选。
