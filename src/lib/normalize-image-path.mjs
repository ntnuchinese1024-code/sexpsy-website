/**
 * 把「Obsidian 貼圖／手動輸入」常見的兩種不完整路徑寫法，正規化成 Astro
 * public/ 資料夾實際對應的網址：
 *
 * 1. images/foo.png            → /images/foo.png（Obsidian 慣用的 vault 相對路徑，缺開頭 /）
 * 2. public/images/foo.png     → /images/foo.png（照磁碟資料夾結構手動輸入，多了 public/ 前綴）
 *
 * 外部連結（http/https/協定相對）與 data: URI、已經是 / 開頭的根路徑都原樣不動。
 */
export function normalizeImagePath(value) {
  if (!value) return value;

  const isRootRelative = value.startsWith('/');
  const isExternal = /^(https?:)?\/\//.test(value) || value.startsWith('data:');
  if (isRootRelative || isExternal) return value;

  const withoutPublicPrefix = value.replace(/^public\//, '');
  return `/${withoutPublicPrefix}`;
}
