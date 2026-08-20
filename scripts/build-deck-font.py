#!/usr/bin/env python3
"""把凝書體切成「文末簡報實際用到的字」子集，輸出成網頁用的 woff2。

整份 OTF 是 3.6MB，直接當網頁字型會拖垮文章頁的載入；中文字型只要做子集，
體積通常會掉到百分之一以下。每次新增／修改 src/content/decks/*.json 之後
重跑一次這支腳本，把新出現的字補進子集裡：

    python3 scripts/build-deck-font.py

需要 fonttools 與 brotli：pip3 install fonttools brotli
"""
import json
import pathlib
import subprocess
import sys

# 沛辰的品牌標題字，存在 iCloud 雲端桌面
SOURCE_FONT = pathlib.Path.home() / (
    'Library/Mobile Documents/com~apple~CloudDocs/Desktop/凝書體字體.otf'
)
DECKS_DIR = pathlib.Path('src/content/decks')
OUTPUT = pathlib.Path('public/fonts/ningshuti-deck.woff2')

# 標點與英數一律收進來，避免標題裡夾一個半形字就掉回備援字型、造成字重不一致
BASELINE = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    '　，。、；：？！「」『』（）〈〉《》【】—…・～·'
    ' .,;:?!\'"()[]{}<>/\\-–—_@#&%+=*'
)


def collect_text(node, sink):
    """把 JSON 裡所有字串值攤平收集起來（不管巢狀多深）"""
    if isinstance(node, str):
        sink.append(node)
    elif isinstance(node, dict):
        for value in node.values():
            collect_text(value, sink)
    elif isinstance(node, list):
        for value in node:
            collect_text(value, sink)


def main():
    if not SOURCE_FONT.exists():
        sys.exit(f'找不到字型原始檔：{SOURCE_FONT}')

    deck_files = sorted(DECKS_DIR.glob('*.json'))
    if not deck_files:
        sys.exit(f'{DECKS_DIR} 裡沒有任何簡報資料檔')

    chunks = [BASELINE]
    for path in deck_files:
        collect_text(json.loads(path.read_text(encoding='utf-8')), chunks)

    charset = sorted(set(''.join(chunks)) - {'\n', '\r', '\t'})
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            sys.executable, '-m', 'fontTools.subset', str(SOURCE_FONT),
            f'--text={"".join(charset)}',
            '--flavor=woff2',
            f'--output-file={OUTPUT}',
            '--layout-features=*',
            '--no-hinting',
            '--desubroutinize',
        ],
        check=True,
    )

    print(f'{len(deck_files)} 份簡報 · {len(charset)} 個字元 · '
          f'{SOURCE_FONT.stat().st_size / 1024 / 1024:.1f}MB → '
          f'{OUTPUT.stat().st_size / 1024:.0f}KB')


if __name__ == '__main__':
    main()
