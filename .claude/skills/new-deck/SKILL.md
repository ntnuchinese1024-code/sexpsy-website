---
name: new-deck
description: 為 sexpsy.tw 的文章做文末簡報：寫 src/content/decks/<slug>.json、重建凝書體子集字型、掛到文章上，可選擇附上設計版 PDF。使用者說「做簡報放在文章下面」「新增文末簡報」「簡報字體跑掉」時使用。
---

# 文末簡報

先讀根目錄 `CLAUDE.md` 的「文末簡報」，以及 `src/content/config.ts` 的 `slideSchema`。可以參考 `src/content/decks/three-circles-island.json`。

1. **規劃**：8–15 頁，第一頁 `cover`、最後一頁 `closing`。內容只來自文章與原始資料。
2. **選版型**：
   - 兩三個並列概念用 `columns`（可加 `tinted`）或 `spectrum`
   - 四個項目用 `grid4`
   - 步驟或演進用 `flow`
   - 條列用 `bullets`
   - 一個重點加插圖用 `feature`（`figure.type`：ripple、waves、target、strands、venn3）
   - 一句話用 `quote` 或 `closing`
3. **斜體欄位只放英文**：封面的 `subtitle`、引言頁的 `quote`。中文放 `lead` 或 `translation`，否則中文會被強制顯示成斜體。
4. **強調**：用 `[[雙中括號]]` 標系列強調色，每頁最多一兩處。
5. **頁尾聲明**：`disclaimers` 沿用既有簡報的寫法（AI 協作聲明、不構成診斷治療、© 沙發上的性心理）。
6. **掛上文章**：文章 frontmatter 加 `deck: <slug>`。
7. **一定要重建字型**：`python3 scripts/build-deck-font.py`，否則新字會用其他字型顯示，標題字體不一致。
8. **設計版 PDF（選用）**：放 `public/downloads/articles/<slug>.pdf`，JSON 加 `"downloadPdf": "/downloads/articles/<slug>.pdf"`；原始檔放 `projects/<專案>/deck/`。
9. **檢查**：`npm run build`，再到 `npm run dev` 的文章頁一頁一頁翻過，確認沒有字溢出或字體混雜。
10. 在 `projects/article-decks/README.md` 的「目前的簡報」加一行。
