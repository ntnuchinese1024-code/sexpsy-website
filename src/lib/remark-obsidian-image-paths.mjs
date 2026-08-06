import { visit } from 'unist-util-visit';
import { normalizeImagePath } from './normalize-image-path.mjs';

/**
 * 修正常見的圖片路徑寫法（見 normalize-image-path.mjs），讓文章內文裡的
 * 圖片都能正確對應到 public/ 底下的實際檔案。
 */
export function remarkObsidianImagePaths() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (!node.url) return;
      node.url = normalizeImagePath(node.url);
    });
  };
}
