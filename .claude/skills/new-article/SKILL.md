---
name: new-article
description: 在 sexpsy.tw 新增一篇文章：依模板建立 Markdown、用沛辰的文風寫作、產生封面、可選擇掛文末簡報，最後建置與預覽。使用者說「寫一篇文章」「新增文章」「把〈某內容〉寫成文章」時使用。
---

# 新增文章

先讀根目錄 `CLAUDE.md` 的「身分與隱私」「文風」「寫一篇文章」。

1. **確認素材**：問清楚主題、要放的系列（六大系列之一），以及原始資料在哪裡（講稿、文獻、筆記）。內容和引用只能來自這些資料，不足的地方要問，不要自己補。
2. **決定 slug**：英文小寫、用 `-` 連接，檔名 `src/content/articles/<slug>.md`。
3. **寫 frontmatter**（照 `Templates/文章模板.md`）：`title`、`date`（今天）、`category`、`tags`（`'#標籤'` 3–5 個）、`summary`（2–3 句）、`reference`（APA 7，一條一行；沒有就 `null`）、`cover: ""`、`deck`（有簡報才填）。
4. **寫內文**：參考 `colonized-addicts.md` 的語氣；`##` 分段、`<mark>` 標重點句、全形標點、`⋯⋯`。個案情境要改寫並註明。相關文章或工具用站內連結。
5. **產生封面**：`node scripts/generate-article-images.mjs <slug>`（改過標題就加 `--force`）。
6. **有簡報的話**，改用 `new-deck` 的流程做簡報。
7. **檢查**：`npm run build` 要 0 errors；`npm run dev` 開 `http://localhost:4321/articles/<slug>` 看一次。
8. **交給沛辰看**：列出標題、系列、摘要，以及任何涉及個人揭露、真實機構名稱、個案的段落，等確認後再用 `publish` 上架。
