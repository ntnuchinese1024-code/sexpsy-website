---
name: new-project
description: 在 sexpsy.tw 的 projects/ 底下開一個新專案資料夾並登記到索引。使用者說「開一個新專案」「把〈某工作〉變成 project」「整理成專案」時使用。
---

# 開新專案

1. 問清楚（或從對話推斷）：專案名稱、目的、目前狀態，以及相關的網站檔案和桌面原始素材在哪裡。
2. 決定 slug：英文小寫、用 `-` 連接。
3. 複製 `projects/_template/README.md` 到 `projects/<slug>/README.md`，填好每一節；路徑要實際存在（用 `ls` 確認），不知道的寫「待補」，不要猜。
4. 規格、原型、簡報原始檔這類「網站不會讀」的檔案，放進 `projects/<slug>/`；網站檔案留在 `src/`、`public/` 原位，只在 README 記路徑。大型素材（影片、錄音、pptx）留在桌面，只記路徑。
5. 在 `projects/README.md` 的「專案一覽」加一行。
6. 這些都不影響網站畫面，commit 即可；要不要 push，照 `publish` 的規則先問沛辰。
