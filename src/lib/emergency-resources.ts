export interface ResourceEntry {
  name: string;
  contact: string;
  /** contact 對應的 tel: 連結；純文字型的聯絡方式（例如「洽當地機構」）就不給連結 */
  href?: string;
  note?: string;
}

export interface ResourceCategory {
  icon: string;
  title: string;
  entries: ResourceEntry[];
}

/**
 * 2026-08-06 由沛辰（諮商心理師）提供並確認的求助資源清單，之後號碼異動
 * 請直接回來更新這個檔案，全站的資源連結都是讀這裡。
 */
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    icon: '🚨',
    title: '緊急求助與警消',
    entries: [
      { name: '緊急救護／消防', contact: '119', href: 'tel:119' },
      { name: '報案／警察', contact: '110', href: 'tel:110' },
      {
        name: '報案（行動電話簡訊／緊急專線）',
        contact: '112',
        href: 'tel:112',
        note: '手機無訊號或無 SIM 卡時可撥打',
      },
    ],
  },
  {
    icon: '🧠',
    title: '心理衛生、自殺防治與身心陪伴',
    entries: [
      {
        name: '衛福部安心專線',
        contact: '1925',
        href: 'tel:1925',
        note: '「依舊愛我」，24 小時免費心理諮商與陪伴',
      },
      { name: '生命線協談專線', contact: '1995', href: 'tel:1995', note: '24 小時專線' },
      { name: '張老師專線', contact: '1980', href: 'tel:1980', note: '專人提供心理輔導' },
      {
        name: '台灣同志諮詢熱線',
        contact: '02-2392-1970／07-281-1823',
        note: '提供 LGBT+ 社群心理、性別與親密關係支持',
      },
    ],
  },
  {
    icon: '🛡️',
    title: '婦幼保護、家暴與性侵害防治',
    entries: [
      {
        name: '保護專線（婦幼／家暴／性侵／虐童）',
        contact: '113',
        href: 'tel:113',
        note: '24 小時免費專線',
      },
      { name: '現代婦女基金會 性侵害防治專線', contact: '02-2351-2811' },
      { name: '勵馨基金會 蒲公英諮商中心', contact: '02-2362-2400', note: '性創傷復原與心理支持' },
      { name: '男性關懷專線', contact: '0800-013-999', note: '家庭關係、情緒壓力與男性諮商' },
    ],
  },
  {
    icon: '💊',
    title: '毒品、酒癮與成癮戒治',
    entries: [
      {
        name: '毒品危害防制戒瘾専線',
        contact: '0800-770-885',
        note: '「請請你幫幫我」，24 小時免費戒毒諮商',
      },
      {
        name: '戒酒諮詢與轉介',
        contact: '洽各縣市毒品危害防制中心，或市立聯合醫院鬆德院區成癮科',
        note: '02-2726-3141',
      },
    ],
  },
  {
    icon: '🎓',
    title: '學生、校園與少年服務',
    entries: [
      { name: '教育部防制校園霸凌專線', contact: '1953', href: 'tel:1953' },
      { name: '少輔會／少年保護專線', contact: '可直撥 110 轉接當地少年警察隊或少輔會' },
    ],
  },
];
