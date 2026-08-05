/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /**
   * SofaCounter（沙發計數器）用的 Abacus namespace。
   * 刻意用不可猜測的隨機字串，避免公開 repo 裡的字面字串被掃描/灌水。
   * 見 .env.example。
   */
  readonly PUBLIC_SOFA_NAMESPACE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
