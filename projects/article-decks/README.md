# 文末簡報系統

文章最下方可以掛一份「網站原生簡報」：用 JSON 寫內容，網站用自己的版型重新排版，手機上也看得清楚，文字能被搜尋引擎讀到。另外可以附一份設計完整版的 PDF 讓人下載。

## 狀態

進行中（最後更新：2026-10-26）

## 目前的簡報

| 簡報 | 掛在哪篇文章 | PDF |
|---|---|---|
| `gp14-squirting-scripts` | 高潮至上主義？潮吹腳本之四大態樣 | 有 |
| `three-circles-island` | 三圈復元群島：一張只屬於你的復元地圖 | 有（設計版 19 頁） |
| `harm-reduction-three-circles` | 不是拿掉界線，而是重新劃定彈性界線 | 無 |

## 網站上的檔案

| 路徑 | 內容 |
|---|---|
| `src/content/decks/*.json` | 每份簡報的內容 |
| `src/content/config.ts` | 簡報欄位與版型定義（`decks`、`slideSchema`） |
| `src/components/SlideDeck.astro` | 簡報的版型與樣式 |
| `src/components/DeckFigure.astro` | 簡報裡的幾何插圖（venn3、ripple、waves、target、strands） |
| `scripts/build-deck-font.py` | 產生凝書體子集字型 |
| `public/fonts/ningshuti-deck.woff2` | 凝書體子集（自動產生，不要手改） |
| `public/downloads/articles/*.pdf` | 設計完整版 PDF |

## 常用操作

- 新增或修改任何簡報文字後：`python3 scripts/build-deck-font.py`
- 文章掛簡報：frontmatter 加 `deck: <簡報檔名>`
- 版型與斜體欄位的注意事項，見根目錄 `CLAUDE.md` 的「文末簡報」。

## 原始素材

- 早期簡報來自 NotebookLM 匯出（整頁點陣圖，所以才重新輸入成 JSON）。
- 三圈復元群島的設計版簡報原始檔：`projects/three-circles-island/deck/`
