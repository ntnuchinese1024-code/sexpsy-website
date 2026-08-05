---
title: "範例文章：如何開始使用這個內容集合"
date: 2026-08-05
category: "使用說明"
tags: ["Obsidian", "內容集合", "範例"]
summary: "這是一篇示範文章，說明 Obsidian Markdown 筆記如何透過 frontmatter 對應到本站的 Content Collection schema。"
reference: "本文為範例，無實際參考文獻。"
---

把你的 Obsidian 筆記複製到 `src/content/articles/` 目錄下，並確保 frontmatter 含有
`title`、`date`、`category`、`tags`、`summary`（`reference` 為選填），即可被本站讀取並套用
`ArticleLayout` 呈現為單欄閱讀版面。

## 在 Obsidian 裡貼圖

在 Obsidian 貼圖時，插入的語法會長這樣（沒有開頭的 `/`）：

![Obsidian 附件示範](images/demo-attachment.svg)

build 時會自動補上開頭的 `/`，變成 `/images/demo-attachment.svg`，瀏覽器才能正確載入。
