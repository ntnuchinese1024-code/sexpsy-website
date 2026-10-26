# 自學室

給讀者自己練習的單元：每個單元有一段說明、一份可下載的學習單，以及一段可以貼給 AI 的陪伴指令。

## 狀態

進行中（最後更新：2026-10-26）

## 線上連結

| 項目 | 網址 |
|---|---|
| 自學室首頁 | https://sexpsy.tw/self-study |
| 求助資源 | https://sexpsy.tw/self-study/resources |

## 四個房間（`src/lib/self-study-rooms.ts`）

| slug | 名稱 |
|---|---|
| `sex-and-addiction` | 性與癮自學室 |
| `intimacy` | 親密關係自學室 |
| `body` | 身體與情感自學室 |
| `sex-education` | 性教育自學室 |

## 目前的單元

| 檔案 | 房間 |
|---|---|
| `surge-wave.md`（認識渴望的波浪） | 性與癮 |
| `dual-control-model.md`（「失控」的性行為：失控調節機制盤點） | 性與癮 |

## 網站上的檔案

| 路徑 | 內容 |
|---|---|
| `src/content/self-study/*.md` | 單元內容（欄位：`room`、`order`、`summary`、`downloadPdf`、`downloadWord`、`aiPrompt`、`disclaimerType`、`relatedArticles` 等，見 `src/content/config.ts`） |
| `src/pages/self-study/` | 自學室頁面 |
| `src/lib/emergency-resources.ts` | 全站共用的求助資源清單（號碼異動時改這裡） |
| `public/downloads/self-study/worksheets/` | 學習單 PDF／Word |

## 常用操作

- 新增單元：在 `src/content/self-study/` 新增 Markdown，`room` 填上面其中一個 slug，學習單放進 `public/downloads/self-study/worksheets/`。
