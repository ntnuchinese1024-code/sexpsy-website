# 沙發上的性心理（sexpsy.tw）

這個資料夾同時是 **sexpsy.tw 網站的程式碼** 和 **沛辰寫作用的 Obsidian vault**。Astro 4 + Tailwind，部署在 GitHub Pages。

> **推上 `main` 就會自動上線**（`.github/workflows/deploy.yml`）。沒有沛辰明確同意，不要 push。

## 身分與隱私（最優先）

- 網站刻意**不公開創辦人的真實姓名、學校、服務單位**。文章、簡報、結構化資料都不要寫進去；署名用「沙發上的性心理・心理師」。
- 公開聯絡信箱只有 `sexpsy.tw@gmail.com`。
- 文中提到的個案情境一律改寫，並註明「情境經過改寫，不指涉任何特定個案」。
- 沛辰已同意公開「我也是成癮者」這個自我揭露（見三圈復元群島），其他個人經驗要先問。
- `.env` 不進版控；`PUBLIC_SOFA_NAMESPACE` 是 GitHub Secret。聯絡表單的 Web3Forms access key 設計上就是公開的。

## 品牌

- **色票**（`tailwind.config.mjs`）：燕麥白 `cream #F9F6F0`、深栗棕 `chestnut #3C2A21`、赤陶 `terracotta #C87D65`，加上六大系列色 sage／indigo／wine／caramel／flax／parchment。
- **字體**：標題 Noto Serif TC，內文 Noto Sans TC。品牌標題字「凝書體」只用在文末簡報與設計版簡報，而且是子集字型（見下方「文末簡報」）。
- **六大系列**（`src/lib/series.ts`）：馬鈴薯嗑論文、沙發夜聊室、情慾實驗室、心理急救包、耍廢自癒角、翻頁餘溫。文章的 `category` 必須是其中之一。
- **自學室**（`src/lib/self-study-rooms.ts`）：性與癮、親密關係、身體與情感、性教育。

## 文風

- 第一人稱、溫柔而真誠的反思，像心理師在沙發上慢慢說話。
- 用 `##` 分段；每段一兩句重點用 `<mark>…</mark>` 標出；省略號用 `⋯⋯`；一律全形標點。
- 減害、去污名的用語：用「復元」不用「復原」，用「失手」而不是「破戒」，不羞辱、不說教。
- 學術內容附 APA 7 參考文獻（frontmatter 的 `reference`，一條一行），引用以原始資料為準，**不要自己編造文獻或數據**。
- 參考範文：`src/content/articles/colonized-addicts.md`、`addiction-note07-coexist-with-addiction.md`。

## 目錄

| 路徑 | 內容 |
|---|---|
| `src/content/articles/` | 文章（Markdown，檔名就是網址 slug） |
| `src/content/decks/` | 文末簡報（JSON），文章 frontmatter 用 `deck: <檔名>` 掛上 |
| `src/content/self-study/` | 自學室單元 |
| `src/pages/tools/` | 互動工具（目前：三圈復元群島） |
| `src/content/config.ts` | 所有內容的欄位定義（改內容前先看這裡） |
| `public/images/` | 封面與內文圖片（vault 根目錄的 `images/` 是它的 symlink） |
| `public/downloads/` | 可下載檔案：`articles/`（簡報 PDF）、`self-study/worksheets/` |
| `Templates/文章模板.md` | Obsidian 的文章模板 |
| `projects/` | 各專案的規格、原型、原始檔與索引，見 `projects/README.md` |
| `scripts/` | 封面產生、簡報字型、llms.txt、git hook |
| `.claude/skills/` | 這個專案的常用指令（見下方） |

## 工作流程

### 寫一篇文章
1. 在 `src/content/articles/<slug>.md` 依 `Templates/文章模板.md` 填 frontmatter：`title`、`date`、`category`、`tags`（`'#標籤'`）、`summary`、`reference`、`cover`、`deck`（選填）。
2. 封面：`node scripts/generate-article-images.mjs <slug>`；**改了標題要加 `--force` 重產**，因為封面上印著標題。commit 時 post-commit hook 也會自動補沒有封面的文章、修正標題摘要的半形標點；hook 印出「自動 commit 失敗」通常只是沒有東西要補，不影響。
3. 文章之間、文章與工具之間用站內相對連結，例如 `/articles/<slug>`、`/tools/three-circles`。

### 文末簡報（`src/content/decks/<slug>.json`）
- 版型：`cover`、`quote`、`feature`、`bullets`、`columns`、`grid4`、`flow`、`spectrum`、`converge`、`closing`。文字裡用 `[[雙中括號]]` 標系列強調色。
- 以下欄位會顯示成斜體，**只放英文**：封面 `subtitle`、引言頁 `quote`。中文放 `lead` 或 `translation`。
- **新增或修改簡報後一定要跑** `python3 scripts/build-deck-font.py`，把新出現的字補進凝書體子集，否則標題會混入其他字型。
- 設計完整版的 PDF 放 `public/downloads/articles/<slug>.pdf`，在 JSON 的 `downloadPdf` 指過去。

### 互動工具（以 `src/pages/tools/three-circles.astro` 為範本）
- 標記放 `src/components/<tool>/*.html`，樣式放 `src/styles/<tool>.css` 並全部限定在一個根 id 底下，程式放 `src/scripts/<tool>.js`。
- 使用者資料只存在瀏覽器（localStorage），不上傳。
- 規格、原型、簡報原始檔放 `projects/<tool>/`。

### 上架
1. `npm run build`（會跑 `astro check`、產生 `public/llms*.txt`、建置）。必須 0 errors。
2. 本機看過：`npm run dev`，開 http://localhost:4321。
3. 只 commit 這次相關的檔案。`public/llms-full.txt`、`public/llms.txt` 是建置時自動產生的，CI 也會重產，除非沛辰要求否則不用一起 commit。
4. **得到沛辰同意後** `git push origin main`，用 `gh run list --limit 1`／`gh run watch <id>` 等部署完成，再用 `curl` 確認線上網址回 200。
5. commit 訊息用中文，前綴 `feat:`／`fix:`／`content:`。

## 外部素材（不在 repo 裡）

| 內容 | 位置 |
|---|---|
| IG 圖卡（每篇文章一個資料夾，`carousel_*.png`、`story_*.png`） | `~/Desktop/07_學會與社群/沙發上的性心理ig/` |
| 六大系列的社群版型（IG 封面、內文頁、FB 卡 pptx） | `~/Desktop/07_學會與社群/exports/` |
| 演講講稿與投影片 | `~/Desktop/05_演講與素材/` |
| 研究文獻 | `~/Desktop/03_研究與投稿/` |
| 凝書體原始檔 | `~/Library/Mobile Documents/com~apple~CloudDocs/Desktop/凝書體字體.otf` |

## 其他

- `.claude/worktrees/` 是過去 Claude Code 開發功能時建立的 git worktree（各自是一個分支），不要在主目錄裡直接改它們。
- 網站服務：SofaCounter 用 Abacus 計數（`src/components/SofaCounter.astro`），聯絡表單與工具回饋用 Web3Forms，寄到 `sexpsy.tw@gmail.com`。
