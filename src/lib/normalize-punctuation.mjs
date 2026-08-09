/**
 * 把「夾在中文字之間」的半形標點自動轉成全形，例如 Obsidian 打字時不小心
 * 用了半形逗號「路上,覺察」→「路上，覺察」。只轉緊鄰中文字（前一個或後
 * 一個字是中文）的標點，英數內容裡的標點（例如 "3.5"、"0-10"）不會被動到。
 *
 * 這個判斷規則同時也符合站上原本的排版習慣：中文句子裡包住英文的括號，
 * 一樣會用全形（（ACT） 而不是 (ACT)），所以連續有中文鄰接就轉。
 */
const CJK_REGEX = /[一-鿿㐀-䶿豈-﫿]/;

const HALF_TO_FULL = {
  ',': '，',
  '.': '。',
  '?': '？',
  '!': '！',
  ';': '；',
  ':': '：',
  '(': '（',
  ')': '）',
};

export function normalizePunctuation(text) {
  if (!text) return text;
  const chars = [...text];
  return chars
    .map((char, i) => {
      const full = HALF_TO_FULL[char];
      if (!full) return char;
      const prev = chars[i - 1];
      const next = chars[i + 1];
      const nearCjk = (prev && CJK_REGEX.test(prev)) || (next && CJK_REGEX.test(next));
      return nearCjk ? full : char;
    })
    .join('');
}
