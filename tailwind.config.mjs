import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // 背景色：燕麥奶油白
        cream: '#F9F6F0',
        // 主文字色：深栗棕
        chestnut: '#3C2A21',
        // 點綴／Logo 色：暖赤陶粉
        terracotta: '#C87D65',
        // 6 大系列輔助色
        sage: '#8A9A86', // 鼠尾草綠
        indigo: '#5B6C7D', // 煙燻靛藍
        wine: '#A35D6A', // 莫蘭迪酒紅
        caramel: '#D49B6A', // 烤焦糖橘
        flax: '#E6C594', // 奶油亞麻黃
        parchment: '#B5876D', // 莫蘭迪暖頁棕（翻頁餘溫系列）
      },
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          '"Noto Serif TC"',
          '"Songti TC"',
          'serif',
        ],
      },
    },
  },
  plugins: [typography],
};
