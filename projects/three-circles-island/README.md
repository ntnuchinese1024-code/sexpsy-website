# 三圈復元群島：專案總覽

把「三圈復元群島」從構想、工具、簡報到文章的所有內容整理在這裡。網站實際使用的檔案仍放在 Astro 規定的位置，這裡記錄它們在哪裡、怎麼更新。

## 線上連結

| 項目 | 網址 |
|---|---|
| 工具 | https://sexpsy.tw/tools/three-circles |
| 文章：工具介紹 | https://sexpsy.tw/articles/three-circles-recovery-island |
| 文章：日本研討會（隱性減害） | https://sexpsy.tw/articles/harm-reduction-three-circles-japan |
| 簡報 PDF 下載 | https://sexpsy.tw/downloads/articles/three-circles-island.pdf |
| 設計版簡報（Claude，私人） | https://claude.ai/artifact/1qpGAgZbo4engJA8MUqhJV |
| 工具試用頁（Claude，私人） | https://claude.ai/artifact/SpfzLCQt36e2zegFLhYJzf |

## 這個資料夾

| 路徑 | 內容 |
|---|---|
| `設計規格.md` | 工具的完整設計規格與每一版的改動（v0.1–v0.6） |
| `prototype/build-artifact.mjs` | 用網站同一份程式組出可單獨開啟的試用頁 |
| `prototype/three-circles-island.html` | 上面腳本產生的試用頁（不要手改） |
| `deck/deck.json`、`deck/slides/` | 設計版簡報的原始檔（19 頁，1920×1080） |
| `deck/img/` | 簡報用的工具截圖 |

## 網站上的檔案

| 路徑 | 內容 |
|---|---|
| `src/pages/tools/three-circles.astro` | 工具頁 |
| `src/components/three-circles/ThreeCirclesApp.html` | 工具的 HTML 骨架（含寫在前面、使用說明、版權） |
| `src/styles/three-circles.css` | 工具樣式（限定在 `#tc-app` 底下） |
| `src/scripts/three-circles.js` | 工具的所有互動、資料、盤點單、AI 指令（`AI_PROMPT`）、回饋 |
| `src/content/articles/three-circles-recovery-island.md` | 文章：工具介紹（心理急救包系列） |
| `src/content/articles/harm-reduction-three-circles-japan.md` | 文章：日本研討會（馬鈴薯嗑論文系列） |
| `src/content/decks/three-circles-island.json` | 工具介紹文章文末的網站版簡報 |
| `src/content/decks/harm-reduction-three-circles.json` | 研討會文章文末的網站版簡報 |
| `public/downloads/articles/three-circles-island.pdf` | 設計版簡報的 PDF |

## 原始資料（不在 repo 裡）

- 研討會講稿與投影片：`~/Desktop/05_演講與素材/2026演講簡報/2026日本ASHRA演講_英日簡報協作/`
- 研討會文獻與參會心得：`~/Desktop/03_研究與投稿/減害×性成癮演講文獻（2026日本）/`

## 常用操作

- 改了工具程式後，更新試用頁：`node projects/three-circles-island/prototype/build-artifact.mjs`
- 上架：照網站的流程 commit 並推上 `main`，GitHub Actions 會自動部署。
- 回饋信：使用者回饋會透過 Web3Forms 寄到 sexpsy.tw@gmail.com，主旨「三圈復元群島｜使用者回饋」。
