# sexpsy.tw 專案索引

每一個比單篇文章大的工作（工具、系列、系統、素材庫），都在這裡有一個資料夾。網站實際使用的檔案仍然放在 Astro 規定的位置（`src/`、`public/`），專案資料夾負責記錄：它是什麼、檔案在哪裡、原始素材在哪裡、怎麼更新。

## 專案一覽

| 專案 | 狀態 | 說明 |
|---|---|---|
| [three-circles-island](three-circles-island/README.md) | 已上線 | 三圈復元群島：互動工具、兩篇文章、設計版簡報 |
| [article-decks](article-decks/README.md) | 進行中 | 文末簡報系統：網站版簡報、凝書體子集、PDF 下載 |
| [self-study](self-study/README.md) | 進行中 | 自學室：四個房間的單元與學習單 |
| [ig-carousels](ig-carousels/README.md) | 進行中 | IG 圖卡：每篇文章的輪播圖與限動素材 |

## 開新專案

1. 複製 `_template/` 成 `projects/<英文-slug>/`。
2. 填好 `README.md`：目的、線上連結、網站檔案、原始素材、常用操作。
3. 在上面的「專案一覽」加一行。

在 Claude Code 裡可以直接說「用 new-project 開一個新專案：〈名稱〉」，會照這個流程做。

## 原則

- 專案資料夾不放會被網站讀取的檔案；網站檔案留在原位，這裡只寫路徑。
- 大型原始素材（影片、錄音、pptx）留在桌面原本的資料夾，這裡記路徑就好，不要複製進 repo。
- 會公開的內容一律遵守 `CLAUDE.md` 的「身分與隱私」。
