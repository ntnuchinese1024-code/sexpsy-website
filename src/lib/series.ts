export interface Series {
  name: string;
  slug: string;
  tagline: string;
  /** 卡片邊框色 */
  border: string;
  /** Badge／標籤底色與文字色 */
  badge: string;
  /** 小圓點色（用於列表、頁尾等輕量標示） */
  dot: string;
  /** 色票 hex，供 SVG 插畫等無法用 Tailwind class 的場合使用 */
  hex: string;
}

export const SERIES: Series[] = [
  {
    name: '馬鈴薯嗑論文',
    slug: 'potato-thesis',
    tagline: '把厚重的學術論文，嗑成聽得懂的日常語言。',
    border: 'border-sage/50',
    badge: 'bg-sage text-cream',
    dot: 'bg-sage',
    hex: '#8A9A86',
  },
  {
    name: '沙發夜聊室',
    slug: 'couch-talk',
    tagline: '關係、依附，與那些說不出口的親密日常。',
    border: 'border-indigo/50',
    badge: 'bg-indigo text-cream',
    dot: 'bg-indigo',
    hex: '#5B6C7D',
  },
  {
    name: '情慾實驗室',
    slug: 'desire-lab',
    tagline: '誠實面對身體、慾望與性的每一種樣子。',
    border: 'border-wine/50',
    badge: 'bg-wine text-cream',
    dot: 'bg-wine',
    hex: '#A35D6A',
  },
  {
    name: '心理急救包',
    slug: 'psych-firstaid',
    tagline: '情緒炸裂的時候，先給自己一個急救箱。',
    border: 'border-caramel/50',
    badge: 'bg-caramel text-chestnut',
    dot: 'bg-caramel',
    hex: '#D49B6A',
  },
  {
    name: '耍廢自癒角',
    slug: 'lazy-healing',
    tagline: '耍廢不是逃避，是一種溫柔的自我照顧。',
    border: 'border-flax/50',
    badge: 'bg-flax text-chestnut',
    dot: 'bg-flax',
    hex: '#E6C594',
  },
];

const FALLBACK: Series = {
  name: '未分類',
  slug: 'uncategorized',
  tagline: '',
  border: 'border-chestnut/20',
  badge: 'bg-chestnut/10 text-chestnut',
  dot: 'bg-chestnut/40',
  hex: '#3C2A21',
};

export function getSeriesByName(name: string): Series {
  return SERIES.find((series) => series.name === name) ?? FALLBACK;
}
