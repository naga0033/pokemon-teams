/**
 * 持ち物リスト（採用率順）
 * Smogon gen9ubers 2026-02 の使用率データに基づくソート
 * ダメージ計算に影響するアイテムを中心に
 */
export interface ItemEntry {
  slug: string;
  ja: string;
  /** ダメージ計算上の効果分類 */
  effect?: "choice-band" | "choice-specs" | "life-orb" | "expert-belt" |
           "type-boost" | "assault-vest" | "eviolite" | "rocky-helmet" |
           "mega-stone" | "muscle-band" | "wise-glasses" |
           "punching-glove" | "loaded-dice" | "none";
  /** type-boost の場合の対象タイプ */
  boostType?: string;
  /** なげつけるの威力 */
  flingPower?: number;
}

export const ITEMS: ItemEntry[] = [
  { slug: "", ja: "もちものを選択（なし）", effect: "none" },

  // ── ポケモンチャンピオンズ バトル用どうぐ ──
  { slug: "choice-scarf",     ja: "こだわりスカーフ",    effect: "none" },
  { slug: "focus-sash",       ja: "きあいのタスキ",      effect: "none" },
  { slug: "leftovers",        ja: "たべのこし",          effect: "none" },
  { slug: "expert-belt",      ja: "たつじんのおび",      effect: "expert-belt" },
  { slug: "scope-lens",       ja: "ピントレンズ",        effect: "none" },
  { slug: "shell-bell",       ja: "かいがらのすず",      effect: "none" },
  { slug: "bright-powder",    ja: "ひかりのこな",        effect: "none" },
  { slug: "focus-band",       ja: "きあいのハチマキ",    effect: "none" },
  { slug: "quick-claw",       ja: "せんせいのツメ",      effect: "none" },
  { slug: "white-herb",       ja: "しろいハーブ",        effect: "none" },
  { slug: "mental-herb",      ja: "メンタルハーブ",      effect: "none" },
  { slug: "kings-rock",       ja: "おうじゃのしるし",    effect: "none" },
  { slug: "light-ball",       ja: "でんきだま",          effect: "none" },

  // ── タイプ強化アイテム（1.2倍） ──
  { slug: "silk-scarf",       ja: "シルクのスカーフ",    effect: "type-boost", boostType: "normal" },
  { slug: "charcoal",         ja: "もくたん",            effect: "type-boost", boostType: "fire" },
  { slug: "mystic-water",     ja: "しんぴのしずく",      effect: "type-boost", boostType: "water" },
  { slug: "magnet",           ja: "じしゃく",            effect: "type-boost", boostType: "electric" },
  { slug: "miracle-seed",     ja: "きせきのタネ",        effect: "type-boost", boostType: "grass" },
  { slug: "never-melt-ice",   ja: "とけないこおり",      effect: "type-boost", boostType: "ice" },
  { slug: "black-belt",       ja: "くろおび",            effect: "type-boost", boostType: "fighting" },
  { slug: "poison-barb",      ja: "どくバリ",            effect: "type-boost", boostType: "poison" },
  { slug: "soft-sand",        ja: "やわらかいすな",      effect: "type-boost", boostType: "ground" },
  { slug: "sharp-beak",       ja: "するどいくちばし",    effect: "type-boost", boostType: "flying" },
  { slug: "twisted-spoon",    ja: "まがったスプーン",    effect: "type-boost", boostType: "psychic" },
  { slug: "silver-powder",    ja: "ぎんのこな",          effect: "type-boost", boostType: "bug" },
  { slug: "hard-stone",       ja: "かたいいし",          effect: "type-boost", boostType: "rock" },
  { slug: "spell-tag",        ja: "のろいのおふだ",      effect: "type-boost", boostType: "ghost" },
  { slug: "dragon-fang",      ja: "りゅうのキバ",        effect: "type-boost", boostType: "dragon" },
  { slug: "black-glasses",    ja: "くろいメガネ",        effect: "type-boost", boostType: "dark" },
  { slug: "metal-coat",       ja: "メタルコート",        effect: "type-boost", boostType: "steel" },
  { slug: "fairy-feather",    ja: "ようせいのハネ",      effect: "type-boost", boostType: "fairy" },

  // ── きのみ ──
  { slug: "lum-berry",        ja: "ラムのみ",            effect: "none" },
  { slug: "sitrus-berry",     ja: "オボンのみ",          effect: "none" },
  { slug: "oran-berry",       ja: "オレンのみ",          effect: "none" },
  { slug: "cheri-berry",      ja: "クラボのみ",          effect: "none" },
  { slug: "chesto-berry",     ja: "カゴのみ",            effect: "none" },
  { slug: "pecha-berry",      ja: "モモンのみ",          effect: "none" },
  { slug: "rawst-berry",      ja: "チーゴのみ",          effect: "none" },
  { slug: "aspear-berry",     ja: "ナナシのみ",          effect: "none" },
  { slug: "leppa-berry",      ja: "ヒメリのみ",          effect: "none" },
  { slug: "persim-berry",     ja: "キーのみ",            effect: "none" },
  // タイプ半減きのみ
  { slug: "occa-berry",       ja: "オッカのみ",          effect: "none" },
  { slug: "passho-berry",     ja: "イトケのみ",          effect: "none" },
  { slug: "wacan-berry",      ja: "ソクノのみ",          effect: "none" },
  { slug: "rindo-berry",      ja: "リンドのみ",          effect: "none" },
  { slug: "yache-berry",      ja: "ヤチェのみ",          effect: "none" },
  { slug: "chople-berry",     ja: "ヨプのみ",            effect: "none" },
  { slug: "kebia-berry",      ja: "ビアーのみ",          effect: "none" },
  { slug: "shuca-berry",      ja: "シュカのみ",          effect: "none" },
  { slug: "coba-berry",       ja: "バコウのみ",          effect: "none" },
  { slug: "payapa-berry",     ja: "ウタンのみ",          effect: "none" },
  { slug: "tanga-berry",      ja: "タンガのみ",          effect: "none" },
  { slug: "charti-berry",     ja: "ヨロギのみ",          effect: "none" },
  { slug: "kasib-berry",      ja: "カシブのみ",          effect: "none" },
  { slug: "haban-berry",      ja: "ハバンのみ",          effect: "none" },
  { slug: "colbur-berry",     ja: "ナモのみ",            effect: "none" },
  { slug: "babiri-berry",     ja: "リリバのみ",          effect: "none" },
  { slug: "roseli-berry",     ja: "ロゼルのみ",          effect: "none" },
  { slug: "hondew-berry",     ja: "ホズのみ",            effect: "none" },

  // ── メガストーン ──
  { slug: "charizardite-x",   ja: "リザードナイトX",     effect: "mega-stone", flingPower: 80 },
  { slug: "charizardite-y",   ja: "リザードナイトY",     effect: "mega-stone", flingPower: 80 },
  { slug: "kangaskhanite",    ja: "ガルーラナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "gengarite",        ja: "ゲンガナイト",         effect: "mega-stone", flingPower: 80 },
  { slug: "lucarionite",      ja: "ルカリオナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "salamencite",      ja: "ボーマンダナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "metagrossite",     ja: "メタグロスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "garchompite",      ja: "ガブリアスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "gardevoirite",     ja: "サーナイトナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "blazikenite",      ja: "バシャーモナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "lopunnite",        ja: "ミミロップナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "mawilite",         ja: "クチートナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "scizorite",        ja: "ハッサムナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "alakazite",        ja: "フーディナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "gyaradosite",      ja: "ギャラドスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "venusaurite",      ja: "フシギバナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "blastoisinite",    ja: "カメックスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "beedrillite",      ja: "スピアーナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "pidgeotite",       ja: "ピジョットナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "slowbronite",      ja: "ヤドランナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "aerodactylite",    ja: "プテラナイト",         effect: "mega-stone", flingPower: 80 },
  { slug: "mewtwonite-x",     ja: "ミュウツーナイトX",    effect: "mega-stone", flingPower: 80 },
  { slug: "mewtwonite-y",     ja: "ミュウツーナイトY",    effect: "mega-stone", flingPower: 80 },
  { slug: "ampharosite",      ja: "デンリュウナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "steelixite",       ja: "ハガネールナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "heracronite",      ja: "ヘラクロスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "houndoominite",    ja: "ヘルガナイト",         effect: "mega-stone", flingPower: 80 },
  { slug: "tyranitarite",     ja: "バンギラスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "sceptilite",       ja: "ジュカインナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "swampertite",      ja: "ラグラージナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "sablenite",        ja: "ヤミラミナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "aggronite",        ja: "ボスゴドラナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "medichamite",      ja: "チャーレムナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "manectite",        ja: "ライボルトナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "sharpedonite",     ja: "サメハダーナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "cameruptite",      ja: "バクーダナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "altarianite",      ja: "チルタリスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "banettite",        ja: "ジュペッタナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "absolite",         ja: "アブソルナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "glalitite",        ja: "オニゴーリナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "latiasite",        ja: "ラティアスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "latiosite",        ja: "ラティオスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "abomasite",        ja: "ユキノオーナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "galladite",        ja: "エルレイドナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "audinite",         ja: "タブンネナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "diancite",         ja: "ディアンシーナイト",   effect: "mega-stone", flingPower: 80 },
  { slug: "pinsirite",        ja: "カイロスナイト",       effect: "mega-stone", flingPower: 80 },
  // Z-A 新メガストーン
  { slug: "meganiumite",      ja: "メガニウムナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "feraligatrite",    ja: "オーダイルナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "raichunite-x",     ja: "ライチュウナイトX",    effect: "mega-stone", flingPower: 80 },
  { slug: "raichunite-y",     ja: "ライチュウナイトY",    effect: "mega-stone", flingPower: 80 },
  { slug: "clefablite",       ja: "ピクシーナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "victreebelite",    ja: "ウツボットナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "starmiite",        ja: "スターミーナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "dragonitite",      ja: "カイリュナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "emboarite",        ja: "エンブオーナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "excadrillite",     ja: "ドリュウズナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "chandelurite",     ja: "シャンデラナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "greninjaite",      ja: "ゲッコウガナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "skarmoryite",      ja: "エアームドナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "chesnaughtite",    ja: "ブリガロンナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "delphoxite",       ja: "マフォクシーナイト",   effect: "mega-stone", flingPower: 80 },
  { slug: "dragalgite",       ja: "ドラミドロナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "malamarite",       ja: "カラマネロナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "froslassite",      ja: "ユキメノコナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "heatranite",       ja: "ヒードランナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "drampite",         ja: "ジジーロンナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "darkraite",        ja: "ダークライナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "baxcaliburite",    ja: "セグレイブナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "floettite",        ja: "フラエッテナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "hawluchite",       ja: "ルチャブルナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "glimmoritite",     ja: "キラフロルナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "scovillainite",    ja: "スコヴィラナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "crabominite",      ja: "ケケンカニナイト",     effect: "mega-stone", flingPower: 80 },
  // mega-data.ts からの漏れを補完 (2026-04 一括追加)
  { slug: "absolite-z",       ja: "アブソルナイトZ",      effect: "mega-stone", flingPower: 80 },
  { slug: "barbaraclite",     ja: "ガメノデスナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "chimechite",       ja: "チリーンナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "eelektrossite",    ja: "シビルドンナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "falinksite",       ja: "タイレーツナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "garchompite-z",    ja: "ガブリアスナイトZ",    effect: "mega-stone", flingPower: 80 },
  { slug: "golisopodite",     ja: "グソクムシャナイト",   effect: "mega-stone", flingPower: 80 },
  { slug: "golurkite",        ja: "ゴルーグナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "lucarionite-z",    ja: "ルカリオナイトZ",      effect: "mega-stone", flingPower: 80 },
  { slug: "magearnite",       ja: "マギアナナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "meowsticite",      ja: "ニャオニクスナイト",   effect: "mega-stone", flingPower: 80 },
  { slug: "pyroarite",        ja: "カエンジシナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "scolipedite",      ja: "ペンドラーナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "scraftite",        ja: "ズルズキンナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "staraptornite",    ja: "ムクホークナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "tatsugirite",      ja: "シャリタツナイト",     effect: "mega-stone", flingPower: 80 },
  { slug: "zeraoranite",      ja: "ゼラオラナイト",       effect: "mega-stone", flingPower: 80 },
  { slug: "zygardite",        ja: "ジガルデナイト",       effect: "mega-stone", flingPower: 80 },
];

export const ITEM_MAP: Record<string, ItemEntry> = Object.fromEntries(
  ITEMS.map((i) => [i.slug, i])
);

export function getFlingPower(itemSlug: string): number | null {
  if (!itemSlug) return null;
  return ITEM_MAP[itemSlug]?.flingPower ?? null;
}
