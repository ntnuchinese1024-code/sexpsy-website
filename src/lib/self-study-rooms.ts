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
  /**
   * 房間專屬的免責提醒（比 /self-study 的總則更具體，會提到這個房間主題
   * 特別相關的求助資源）。顯示在房間總覽頁與底下每篇單元頁的免責區塊。
   */
  disclaimer: string;
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
    disclaimer:
      '這個房間會帶你觀察渴望與衝動本身，練習過程中可能會引發真實的渴望感受或情緒起伏。這裡提供的是自我覺察練習，不是戒除方案，也不能取代成癮專業評估與治療。如果渴望或衝動已經影響到安全（例如出現傷害自己或他人的念頭），請立即聯繫毒品危害防制戒瘾専線 0800-770-885 或生命線 1995，不要獨自面對。',
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
    disclaimer:
      '這個房間會邀請你回顧關係裡的靠近、依附與受傷經驗，過程中可能會觸碰到舊有的關係創傷或依附焦慮。這裡提供的是自我覺察練習，不是伴侶諮商或關係修復方案。如果浮現的情緒讓你感到難以承受，歡迎聯繫生命線 1995 或張老師專線 1980。',
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
    disclaimer:
      '這個房間會邀請你重新靠近身體的感受與情緒起伏，過程中可能會觸碰到身體意象、身心失衡或強烈情緒。這裡提供的是自我覺察練習，不能取代醫療或心理專業評估。如果出現持續的身心不適，或有安全上的疑慮，請優先聯繫衛福部安心專線 1925 或生命線 1995。',
  },
];

/** 自學專區總則（第一層、比較概括的提醒），顯示在 /self-study 大廳底部 */
export const SELF_STUDY_BASE_DISCLAIMER =
  '自學專區的所有內容，都是陪你自我覺察、自我照顧用的輔助工具，不是心理諮商、不是醫療診斷，也不能取代專業評估與治療。每個房間會依照主題再補充更具體的提醒；如果你需要更即時的協助，這裡整理了一份完整的求助資源列表。';

export function getRoomBySlug(slug: string): StudyRoom | undefined {
  return STUDY_ROOMS.find((room) => room.slug === slug);
}
