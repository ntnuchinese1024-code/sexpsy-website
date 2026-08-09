/**
 * 讓標題只在自然斷句處（？：！。）換行，避免瀏覽器把中文標題從詞語或標點中間硬斷開。
 * 回傳的 HTML 字串要搭配 `set:html` 使用。
 */
const BREAK_AFTER = ['？', '：', '！', '。'];

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function wrapTitleHtml(title: string): string {
  const segments: string[] = [];
  let current = '';

  for (const char of title) {
    current += char;
    if (BREAK_AFTER.includes(char)) {
      segments.push(current);
      current = '';
    }
  }
  if (current) segments.push(current);

  return segments.map((seg) => `<span class="whitespace-nowrap">${escapeHtml(seg)}</span>`).join('');
}
