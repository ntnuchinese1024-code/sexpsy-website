/**
 * 簡報文字裡的 `[[強調]]` 標記 → 系列強調色的 <span>。
 *
 * NotebookLM 原始簡報會把句子裡的關鍵詞換成另一個顏色（例如引言頁的
 * "medical reductionism"），重建時要保留這個視覺重點。因為文字來自 JSON
 * 內容檔而不是 Markdown，這裡先把 HTML 特殊字元逐一跳脫，再放行我們自己
 * 產生的 <span>，避免內容檔裡的角括號變成可執行的標籤。
 */
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export function renderEmphasis(value: string): string {
  return escapeHtml(value).replace(
    /\[\[(.+?)\]\]/g,
    (_match, inner: string) => `<span class="deck-em">${inner}</span>`
  );
}
