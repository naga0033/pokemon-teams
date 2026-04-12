// ポケモン構築紹介サイトのコアデータモデル

export type Format = "single" | "double";

export type StatValues = {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
};

export type PokemonSlot = {
  /** チーム内の並び順 */
  slot?: number;
  /** 日本語名 (例: "カバルドン") - 正規化キーとして利用 */
  name: string;
  /** 英語 slug (例: "hippowdon") - 画像パス解決用 */
  slug: string;
  /** 特性 */
  ability?: string;
  /** 持ち物 */
  item?: string;
  /** テラスタイプ */
  teraType?: string;
  /** 技 4 つ */
  moves: string[];
  /** 性別 (任意) */
  gender?: "male" | "female" | "unknown";
  /** 性格 (任意) */
  nature?: string;
  /** 実数値 (任意) */
  stats?: StatValues;
  /** 努力値 (任意) */
  evs?: StatValues;
};

export type Team = {
  /** URL に使える ID */
  id: string;
  /** 構築記事のタイトル */
  title: string;
  /** 投稿者名 / ハンドル */
  author: string;
  /** X ハンドル (@付き) */
  authorXHandle?: string;
  /** シングル / ダブル */
  format: Format;
  /** シーズン表記 (任意, 例: "S40") */
  season?: string;
  /** 最終順位 (任意) */
  rank?: number;
  /** 最終レート (任意) */
  rating?: number;
  /** 元記事 / X 投稿の URL */
  sourceUrl?: string;
  /** チームコード */
  teamCode?: string;
  /** 6 体のポケモン */
  pokemons: PokemonSlot[];
  /** 登録日 (ISO 文字列) */
  registeredAt: string;
};

export type SearchParams = {
  format?: Format;
  /** 絞り込みたいポケモン名 (日本語、複数指定で AND) */
  pokemons?: string[];
  page?: number;
};
