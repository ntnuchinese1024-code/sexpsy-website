#!/usr/bin/env node
// 安裝自動封面圖的 post-commit hook。
//
// `.git/hooks/` 不受版控，所以實際的 hook 邏輯寫在 scripts/hooks/post-commit.mjs
// （會被 commit 進 repo），這支腳本負責把它複製到 git 共用的 hooks 目錄。
//
// Git worktree 之間共用同一份 hooks（git rev-parse --git-common-dir 對所有
// worktree 回傳同一個路徑），所以只要在任一個 worktree 執行過一次
// `node scripts/install-hooks.mjs`（或透過 npm install 觸發的 "prepare"），
// 之後不管在主目錄還是哪個 worktree 底下 commit，都會觸發同一個 hook。
//
// 如果目標路徑已經有一個不是本專案安裝的 post-commit hook，會印警告並跳過，
// 不會覆蓋使用者既有的 hook。

import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = '/* sexpsy-auto-cover-hook */';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf-8' }).trim();
}

function main() {
  let commonDir;
  try {
    commonDir = git(['rev-parse', '--git-common-dir']);
  } catch {
    console.log('[install-hooks] 目前不在 git repo 內，略過安裝');
    return;
  }

  const repoRoot = git(['rev-parse', '--show-toplevel']);
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const source = join(scriptDir, 'hooks', 'post-commit.mjs');

  if (!existsSync(source)) {
    console.log('[install-hooks] 找不到 scripts/hooks/post-commit.mjs，略過安裝');
    return;
  }

  const hooksDir = commonDir.startsWith('/') ? join(commonDir, 'hooks') : join(repoRoot, commonDir, 'hooks');
  const target = join(hooksDir, 'post-commit');

  if (existsSync(target)) {
    const existing = readFileSync(target, 'utf-8');
    if (!existing.includes(MARKER)) {
      console.warn(
        `[install-hooks] ${target} 已存在且不是本專案安裝的 hook，跳過覆蓋。\n` +
          `如果要改用自動封面 hook，請先手動備份/合併既有內容，再重新執行 node scripts/install-hooks.mjs`
      );
      return;
    }
  }

  copyFileSync(source, target);
  chmodSync(target, 0o755);
  console.log(`[install-hooks] 已安裝自動封面 post-commit hook 到 ${target}`);
}

main();
