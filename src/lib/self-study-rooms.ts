export interface StudyRoom {
  slug: 'sex-and-addiction' | 'intimacy' | 'body';
  icon: string;
  name: string;
  tagline: string;
  /** 卡片邊框色 */
  border: string;
  /** Badge 底色與文字色 */
  badge: string;
  /** 小圓點色 */
  dot: string;
  hex: string;
}

export const STUDY_ROOMS: StudyRoom[] = [
  {
    slug: 'sex-and-addiction',
    icon: '🔒',
    name: '性與癮自學室',
    tagline: '關於渴望、衝動與失控感，慢慢練習不批判地理解自己。',
    border: 'border-wine/50',
    badge: 'bg-wine text-cream',
    dot: 'bg-wine',
    hex: '#A35D6A',
  },
  {
    slug: 'intimacy',
    icon: '💬',
    name: '親密關係自學室',
    tagline: '練習靠近、練習說出口，也練習好好被接住。',
    border: 'border-indigo/50',
    badge: 'bg-indigo text-cream',
    dot: 'bg-indigo',
    hex: '#5B6C7D',
  },
  {
    slug: 'body',
    icon: '🌱',
    name: '身體與情感自學室',
    tagline: '重新學習聆聽身體的訊號，安放起伏不定的情緒。',
    border: 'border-sage/50',
    badge: 'bg-sage text-cream',
    dot: 'bg-sage',
    hex: '#8A9A86',
  },
];

export function getRoomBySlug(slug: string): StudyRoom | undefined {
  return STUDY_ROOMS.find((room) => room.slug === slug);
}
