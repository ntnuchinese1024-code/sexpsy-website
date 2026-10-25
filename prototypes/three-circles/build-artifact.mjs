// 用網站上的同一份 CSS、標記和程式，組出可以單獨開啟的原型頁（three-circles-island.html），
// 讓試用連結和 sexpsy.tw 上的版本保持一致。
// 用法：node prototypes/three-circles/build-artifact.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const css = read('src/styles/three-circles.css');
const markup = read('src/components/three-circles/ThreeCirclesApp.html');
const js = read('src/scripts/three-circles.js');

const page = `<title>三圈復元群島</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap">
<style>
:root { color-scheme: light; }
body { background: #F9F6F0; color: #3C2A21; }
${css}
</style>
${markup}
<script>
${js}
</script>
`;

writeFileSync(join(here, 'three-circles-island.html'), page);
console.log('已產生 prototypes/three-circles/three-circles-island.html');
