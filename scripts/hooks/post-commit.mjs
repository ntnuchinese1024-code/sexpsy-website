#!/usr/bin/env node
/* sexpsy-auto-cover-hook */
// 自動封面圖 + 標點正規化 post-commit hook。
//
// 每次 commit（例如 Obsidian Git 自動 commit）結束後執行兩件事：
// 1. 檢查這次 commit 有沒有新增／修改 src/content/articles/*.md 且沒有
//    設定 cover 的文章，有的話就呼叫 scripts/generate-article-images.mjs
//    本機生成一張。
// 2. 檢查這次 commit 變動的文章／自學單元，title、summary 欄位裡有沒有
//    緊鄰中文字的半形標點（例如 Obsidian 打字習慣性用了半形逗號），
//    有的話自動轉成全形——半形標點緊鄰中文字時，封面圖跟卡片上的排版
//    會看起來很擠、留白不平均。
// 這兩件事如果真的改了檔案，會一起補一個 commit。
//
// 避免無限遞迴：補檔 commit 會帶 SEXPSY_SKIP_COVER_HOOK=1 環境變數，
// 本 hook 一開始就檢查這個旗標，有的話直接結束。
//
// 這個 hook 檔案本身不會被 git 追蹤到 .git/hooks/ 裡（那個目錄不受版控），
// 要用 scripts/install-hooks.mjs 安裝到共用的 hooks 目錄（worktree 之間共用
// 同一份 hooks，只要裝過一次，任何一個 worktree 或主目錄的 commit 都會觸發）。

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  if (process.env.SEXPSY_SKIP_COVER_HOOK === '1') {
    return;
  }

  const repoRoot = git(['rev-parse', '--show-toplevel']);
  const scriptPath = join(repoRoot, 'scripts', 'generate-article-images.mjs');
  const normalizePunctuationPath = join(repoRoot, 'src', 'lib', 'normalize-punctuation.mjs');

  // 這個 worktree／分支還沒有封面生成腳本（例如尚未 merge 進 main），略過。
  if (!existsSync(scriptPath)) {
    return;
  }

  let changedFiles;
  try {
    changedFiles = git(['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'])
      .split('\n')
      .filter(Boolean);
  } catch {
    return;
  }

  const articleFiles = changedFiles.filter(
    (f) => f.startsWith('src/content/articles/') && f.endsWith('.md')
  );
  const selfStudyFiles = changedFiles.filter(
    (f) => f.startsWith('src/content/self-study/') && f.endsWith('.md')
  );
  const contentFiles = [...articleFiles, ...selfStudyFiles];

  if (contentFiles.length === 0) {
    return;
  }

  // 動態載入，避免在還沒安裝相依套件的分支／worktree 直接噴例外。
  const { default: matter } = await import('gray-matter');
  const { normalizePunctuation } = existsSync(normalizePunctuationPath)
    ? await import(normalizePunctuationPath)
    : { normalizePunctuation: null };

  const slugsNeedingCover = [];
  const punctuationFixedFiles = [];

  for (const relPath of contentFiles) {
    const fullPath = join(repoRoot, relPath);
    if (!existsSync(fullPath)) continue; // 這次 commit 是刪除檔案
    const raw = readFileSync(fullPath, 'utf-8');
    const parsed = matter(raw);
    const { data, content } = parsed;

    if (articleFiles.includes(relPath) && !data.cover) {
      const slug = relPath.split('/').pop().replace(/\.md$/, '');
      slugsNeedingCover.push(slug);
    }

    if (normalizePunctuation) {
      let changed = false;
      for (const field of ['title', 'summary']) {
        if (typeof data[field] === 'string') {
          const fixed = normalizePunctuation(data[field]);
          if (fixed !== data[field]) {
            data[field] = fixed;
            changed = true;
          }
        }
      }
      if (changed) {
        writeFileSync(fullPath, matter.stringify(content, data), 'utf-8');
        punctuationFixedFiles.push(relPath);
      }
    }
  }

  if (punctuationFixedFiles.length > 0) {
    console.log(
      `[post-commit] 自動把 ${punctuationFixedFiles.length} 篇文章標題／摘要裡緊鄰中文字的半形標點轉成全形：${punctuationFixedFiles.join(', ')}`
    );
  }

  if (slugsNeedingCover.length > 0) {
    console.log(
      `[post-commit] 偵測到 ${slugsNeedingCover.length} 篇文章沒有 cover，自動生成中：${slugsNeedingCover.join(', ')}`
    );
    for (const slug of slugsNeedingCover) {
      try {
        execFileSync('node', [scriptPath, slug], { cwd: repoRoot, stdio: 'inherit' });
      } catch (error) {
        console.error(`[post-commit] ${slug} 封面生成失敗，略過：${error.message}`);
      }
    }
  }

  const status = git(['status', '--porcelain']);
  if (!status.trim()) {
    return;
  }

  git(['add', 'src/content/articles', 'src/content/self-study', 'public/images']);

  try {
    execFileSync('git', ['commit', '-m', 'chore: 自動生成缺少的封面圖／修正半形標點'], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, SEXPSY_SKIP_COVER_HOOK: '1' },
    });
    console.log('[post-commit] 已自動補上一個 commit');
  } catch (error) {
    console.error(`[post-commit] 自動 commit 失敗：${error.message}`);
  }
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf-8' }).trim();
}

main().catch((error) => {
  // post-commit 失敗不該讓使用者的 commit 本身看起來失敗，記錄錯誤就好。
  console.error('[post-commit] 自動封面 hook 發生未預期錯誤：', error.message);
});
