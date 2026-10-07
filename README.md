# Kikiroku — 日本酒の記録帳

一个安静、快速、有记忆感的个人日本酒笔记 App。核心是三件事：

1. 快速记录一瓶酒
2. 以后能找回来
3. 愿意时公开分享其中一部分

- 正式站：https://www.kikiroku.com （`main` 分支）
- 改版预览：https://redesign.kikiroku.pages.dev （`redesign` 分支）
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
```

- `.env.local` 需要：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。脚本还需要 `SUPABASE_SERVICE_ROLE_KEY`。
- DB 结构变更（DDL）要到 Supabase **SQL Editor** 手动执行 `supabase/migrations/` 里的 SQL。

---

## 2026-10 改版（「酒札」）

**状态**：分阶段进行，每页都经设计侧确认后才进下一页。正式站还没切换。

### 设计来源

| 内容 | 位置 |
|---|---|
| 设计稿 | `~/Documents/ChatGPT/Kikiroku/kikiroku-ui-redesign.html` |
| 交接说明 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_HANDOFF_PROMPT.md` |
| 各页确认答复 | `~/Documents/ChatGPT/Kikiroku/CLAUDE_*_REPLY_*.md` |
| 每页的差异清单 | `~/Downloads/Kikiroku-<页名>-待确认差异-<日期>.md` |
| 每页的截图 | `~/Downloads/Kikiroku-review/<页名>/` |

### 进度

| # | 页面 | 状态 |
|---|---|---|
| 1 | マイ帳 `/journal` | ✅ 已确认 |
| 2 | 新しい記録（`/journal?new=1`，全屏表单） | ✅ v2 已采纳 |
| 3 | 酒詳情 `/journal/:id` | ✅ 已确认 |
| 4 | 廣場 `/` | ⏳ 送审中 |
| 5 | 事典 `/wiki` | — 先包装现有功能 |
| 6 | 産地 | — 新页面；入口是详情和マイ帳里的产地文字 |
| 7 | プロフ `/profile` | — 语言切换和登出会移到这里 |
| 8 | ログイン | — 保留邮箱／密码／邀请码 |
| 9 | 飲みたい | — 维持收藏型资料，只换外观 |
| 10 | ラベル撮影・裁切 | — 只做拍摄＋裁切，不做 OCR |
| 11 | 編集モード | — 共用新增表单，可以跳到指定区块 |

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
- **新记录默认不公开**。

---

## 程式结构（改版后的部分）

```
src/
  main.jsx                 全站共用样式在这里统一 import（任何页面都可能是第一个打开的）
  index.css                设计 token（旧变数名都 alias 到新颜色）
  components/
    Nav.jsx / Nav.css      底栏（72px、当前页有金点、中央 ＋ 記録）；topbar={false} 可以隐藏品牌栏
    LangButton.jsx         语言切换（プロフ重做前暂放）
    ui/Sheet.jsx           所有弹层：Esc 关闭、焦点锁定、打开时隐藏底栏；variant = sheet / dialog / viewer
    ui/Toast.jsx           保存成功的印章提示
    record/RatingPicker    0.5 级距评分（滑杆语义）
    bottle/
      crop.js              瓶型模板：比例 1:3.5、BOTTLE_POINTS、预设裁切 {x, y, scale 1.5, rotation, maskType}
      SakeBottleCrop.jsx   用瓶型轮廓显示照片；没有照片或读不到时显示深青绿剪影
      BottleCropEditor.jsx 手动对齐（拖动／双指缩放／旋转／重设），不用 AI
  pages/
    journal/Ledger.jsx     マイ帳：全文搜索＋命中原因、快捷集合、筛选抽屉、札／表 两种密度
    Journal.jsx            マイ帳外壳＋新增／编辑表单（下書き／正式保存、单一酒名栏、照片暂存在 IndexedDB）
    SakeDetail.jsx         酒詳情：瓶身／原図／裏ラベル、…菜单、みんなの瓶身；他人的记录只读，访客隐藏个人资讯
    plaza/Plaza.jsx        廣場：新着／高評価／近い好み
    Display.jsx            旧廣場（已不在路由上，确认后删除）
  lib/
    ledgerSearch.js        マイ帳搜索（三语 tag、片假名转平假名、简体转日文）
    sakeType.js            酒类型统一成 id（normalizeType）
    plaza.js               飲みたい、自分も記録、相对时间
    draftPhotos.js         草稿照片的 IndexedDB 暂存
    upload.js              照片上传＋240px 缩图
    labels.js / rating.js / a11y.js
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

迁移档：

- `supabase/migrations/20261006_redesign_foundation.sql`
- `supabase/migrations/20261007_bottle_crop.sql`

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
