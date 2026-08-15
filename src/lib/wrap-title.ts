/**
 * 讓標題只在自然斷句處（？：！。）換行，避免瀏覽器把中文標題從詞語或標點中間硬斷開。
 * 回傳的 HTML 字串要搭配 `set:html` 使用。
 */
const BREAK_AFTER = ['？', '：', '！', '。', '，'];

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

  // 標題裡完全沒有可斷句的標點（例如只在結尾有一個？），代表整句會被當成
  // 單一個 nowrap 區塊，在窄螢幕上反而會整段被硬生生撐出容器、字直接消失在
  // 畫面外——這比「偶爾斷字」還糟。這種情況乾脆放棄鎖字，交給瀏覽器用預設
  // 方式換行（退回沒有這個功能之前的行為），至少內容還看得到。
  if (segments.length <= 1) {
    return escapeHtml(title);
  }

  // 每個子句包成 nowrap 的 span：保證同一個詞/子句絕不會被硬拆成孤字斷行
  // （這比只插入 <br> 更可靠——<br> 只保證斷句處會換行，沒辦法阻止子句自己在
  // 窄螢幕上被瀏覽器從中間再斷一次）。搭配 h1 在手機寬度縮小字級，把子句在窄
  // 螢幕上真的溢出容器的機率壓到最低。
  return segments
    .map((seg) => `<span class="whitespace-nowrap">${escapeHtml(seg)}</span>`)
    .join(' ');
}
