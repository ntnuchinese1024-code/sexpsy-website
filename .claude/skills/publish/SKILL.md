---
name: publish
description: 把 sexpsy.tw 的改動上架：建置檢查、只 commit 相關檔案、經沛辰同意後推上 main、等 GitHub Pages 部署完成並確認線上網址。使用者說「上架」「推上線」「部署」時使用。
---

# 上架

推上 `main` 就會公開上線，**沒有沛辰在這次對話裡明確同意，不要 push**。

1. **看改了什麼**：`git status --short`、`git diff --stat`。分清楚哪些是這次要上的、哪些不是（例如 `public/llms-full.txt` 是建置自動產生的，除非沛辰要求，否則不 commit）。
2. **建置**：`npm run build`，必須 0 errors。有簡報改動的話，確認已經跑過 `python3 scripts/build-deck-font.py`。
3. **上架前檢查**：
   - 內容沒有真實姓名、學校、服務單位
   - 個案情境已改寫並註明
   - 新文章有封面
   - 站內連結的 slug 都存在
4. **commit**：只 `git add` 相關檔案；訊息用中文，前綴 `feat:`／`fix:`／`content:`，結尾加上 Co-Authored-By。post-commit hook 印出「自動 commit 失敗」通常只是沒有東西要補。
5. **徵求同意**：列出這次要上線的內容，問沛辰可不可以推。
6. **推上去**：`git fetch origin`，確認沒有落後，再 `git push origin main`。
7. **等部署**：`gh run list --limit 1` 找到 run id，`gh run watch <id> --exit-status`。
8. **確認線上**：對每個改到的網址 `curl -s -o /dev/null -w "%{http_code}" "https://sexpsy.tw/<path>/?v=$(date +%s)"`，要回 200；有改標題的話，抓 `<title>` 確認。
9. 回報 commit、部署結果，以及沒能驗證的地方（例如回饋信、列印）。
