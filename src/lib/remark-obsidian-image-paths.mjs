import { visit } from 'unist-util-visit';

/**
 * Obsidian 的「Absolute path in vault」連結格式只會給 vault 內的相對路徑
 * （例如 images/foo.png），不會加開頭的 /。
 * 這個 remark plugin 在 build 時把「非外部連結、非已經是根路徑」的圖片路徑
 * 自動補上開頭 /，讓 Astro 頁面（例如 /articles/xxx）能正確解析到 /images/foo.png。
 */
export function remarkObsidianImagePaths() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (!node.url) return;
      const isRootRelative = node.url.startsWith('/');
      const isExternal = /^(https?:)?\/\//.test(node.url) || node.url.startsWith('data:');
      if (!isRootRelative && !isExternal) {
        node.url = `/${node.url}`;
      }
    });
  };
}
