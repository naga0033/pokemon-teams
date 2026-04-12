import { normalizeJaText } from "./japanese-match";
import { EN_TO_JA } from "./pokemon-names";
import type { Format } from "./types";

/**
 * ポケモンチャンピオンズ 使用率ランキング（内定ポケモン）
 * リリース直後は使用率データがないため、対戦で人気が高いと予想されるポケモン順に配置
 * Supabase からクラウド版を取得し、取れなければハードコード版にフォールバック
 */
export interface UsageEntry {
  name: string;   // PokeAPI slug
  ja: string;     // 日本語名
  id: number;     // PokeAPI ID (スプライト用)
  change?: number | "new";  // 前回からの順位変動: 正=UP / 負=DOWN / 0=変動なし / "new"=初登場
}

/**
 * ポケモンチャンピオンズ シーズンM-1 使用率ランキング（シングル）
 * ゲーム内ランクバトルの公式使用率データ（2026/04/09時点）
 */
export const USAGE_RANKING: UsageEntry[] = [
  { name: "garchomp",              ja: "ガブリアス",              id: 445   },  // 1
  { name: "charizard",             ja: "リザードン",              id: 6     },  // 2
  { name: "primarina",             ja: "アシレーヌ",              id: 730   },  // 3
  { name: "archaludon",            ja: "ブリジュラス",            id: 1018  },  // 4
  { name: "hippowdon",             ja: "カバルドン",              id: 450   },  // 5
  { name: "mimikyu",               ja: "ミミッキュ",              id: 778   },  // 6
  { name: "corviknight",           ja: "アーマーガア",            id: 823   },  // 7
  { name: "gengar",                ja: "ゲンガー",                id: 94    },  // 8
  { name: "meowscarada",           ja: "マスカーニャ",            id: 908   },  // 9
  { name: "hydreigon",             ja: "サザンドラ",              id: 635   },  // 10
  { name: "kingambit",             ja: "ドドゲザン",              id: 983   },  // 11
  { name: "aegislash",             ja: "ギルガルド",              id: 681   },  // 12
  { name: "delphox",               ja: "マフォクシー",            id: 655   },  // 13
  { name: "gyarados",              ja: "ギャラドス",              id: 130   },  // 14
  { name: "glimmora",              ja: "キラフロル",              id: 970   },  // 15
  { name: "lopunny",               ja: "ミミロップ",              id: 428   },  // 16
  { name: "dragonite",             ja: "カイリュー",              id: 149   },  // 17
  { name: "rotom-wash",            ja: "ウォッシュロトム",        id: 10009 },  // 18
  { name: "greninja",              ja: "ゲッコウガ",              id: 658   },  // 19
  { name: "scizor",                ja: "ハッサム",                id: 212   },  // 20
  { name: "basculegion",           ja: "イダイトウ",              id: 902   },  // 21
  { name: "meganium",              ja: "メガニウム",              id: 154   },  // 22
  { name: "tyranitar",             ja: "バンギラス",              id: 248   },  // 23
  { name: "dragapult",             ja: "ドラパルト",              id: 887   },  // 24
  { name: "sneasler",              ja: "オオニューラ",            id: 903   },  // 25
  { name: "snorlax",               ja: "カビゴン",                id: 143   },  // 26
  { name: "rotom-heat",            ja: "ヒートロトム",            id: 10008 },  // 27
  { name: "azumarill",             ja: "マリルリ",                id: 184   },  // 28
  { name: "volcarona",             ja: "ウルガモス",              id: 637   },  // 29
  { name: "lucario",               ja: "ルカリオ",                id: 448   },  // 30
  { name: "kangaskhan",            ja: "ガルーラ",                id: 115   },  // 31
  { name: "venusaur",              ja: "フシギバナ",              id: 3     },  // 32
  { name: "mamoswine",             ja: "マンムー",                id: 473   },  // 33
  { name: "toxapex",               ja: "ドヒドイデ",              id: 748   },  // 34
  { name: "starmie",               ja: "スターミー",              id: 121   },  // 35
  { name: "sylveon",               ja: "ニンフィア",              id: 700   },  // 36
  { name: "excadrill",             ja: "ドリュウズ",              id: 530   },  // 37
  { name: "skarmory",              ja: "エアームド",              id: 227   },  // 38
  { name: "pelipper",              ja: "ペリッパー",              id: 279   },  // 39
  { name: "umbreon",               ja: "ブラッキー",              id: 197   },  // 40
  { name: "espathra",              ja: "クエスパトラ",            id: 956   },  // 41
  { name: "blastoise",             ja: "カメックス",              id: 9     },  // 42
  { name: "floette",               ja: "フラエッテ",              id: 670   },  // 43
  { name: "clefable",              ja: "ピクシー",                id: 36    },  // 44
  { name: "froslass",              ja: "ユキメノコ",              id: 478   },  // 45
  { name: "ninetales-alola",       ja: "アローラキュウコン",      id: 10104 },  // 46
  { name: "palafin",               ja: "イルカマン",              id: 964   },  // 47
  { name: "ceruledge",             ja: "ソウブレイズ",            id: 937   },  // 48
  { name: "samurott-hisui",        ja: "ヒスイダイケンキ",        id: 10236 },  // 49
  { name: "diggersby",             ja: "ホルード",                id: 660   },  // 50
  { name: "feraligatr",            ja: "オーダイル",              id: 160   },  // 51
  { name: "serperior",             ja: "ジャローダ",              id: 497   },  // 52
  { name: "whimsicott",            ja: "エルフーン",              id: 547   },  // 53
  { name: "skeledirge",            ja: "ラウドボーン",            id: 911   },  // 54
  { name: "chesnaught",            ja: "ブリガロン",              id: 652   },  // 55
  { name: "gardevoir",             ja: "サーナイト",              id: 282   },  // 56
  { name: "kleavor",               ja: "バサギリ",                id: 900   },  // 57
  { name: "gallade",               ja: "エルレイド",              id: 475   },  // 58
  { name: "crabominable",          ja: "ケケンカニ",              id: 740   },  // 59
  { name: "arcanine-hisui",        ja: "ヒスイウインディ",        id: 10229 },  // 60
  { name: "alakazam",              ja: "フーディン",              id: 65    },  // 61
  { name: "slowbro",               ja: "ヤドラン",                id: 80    },  // 62
  { name: "vivillon",              ja: "ビビヨン",                id: 666   },  // 63
  { name: "araquanid",             ja: "オニシズクモ",            id: 752   },  // 64
  { name: "goodra",                ja: "ヌメルゴン",              id: 706   },  // 65
  { name: "quaquaval",             ja: "ウェーニバル",            id: 914   },  // 66
  { name: "ditto",                 ja: "メタモン",                id: 132   },  // 67
  { name: "hawlucha",              ja: "ルチャブル",              id: 701   },  // 68
  { name: "arcanine",              ja: "ウインディ",              id: 59    },  // 69
  { name: "bellibolt",             ja: "ハラバリー",              id: 939   },  // 70
  { name: "scovillain",            ja: "スコヴィラン",            id: 952   },  // 71
  { name: "milotic",               ja: "ミロカロス",              id: 350   },  // 72
  { name: "chandelure",            ja: "シャンデラ",              id: 609   },  // 73
  { name: "armarouge",             ja: "グレンアルマ",            id: 936   },  // 74
  { name: "hatterene",             ja: "ブリムオン",              id: 858   },  // 75
  { name: "torterra",              ja: "ドダイトス",              id: 389   },  // 76
  { name: "rotom-mow",             ja: "カットロトム",            id: 10012 },  // 77
  { name: "emboar",                ja: "エンブオー",              id: 500   },  // 78
  { name: "incineroar",            ja: "ガオガエン",              id: 727   },  // 79
  { name: "heracross",             ja: "ヘラクロス",              id: 214   },  // 80
  { name: "tinkaton",              ja: "デカヌチャン",            id: 959   },  // 81
  { name: "dondozo",               ja: "ヘイラッシャ",            id: 977   },  // 82
  { name: "weavile",               ja: "マニューラ",              id: 461   },  // 83
  { name: "conkeldurr",            ja: "ローブシン",              id: 534   },  // 84
  { name: "forretress",            ja: "フォレトス",              id: 205   },  // 85
  { name: "donphan",               ja: "ドンファン",              id: 232   },  // 86
  { name: "rotom",                 ja: "ロトム",                  id: 479   },  // 87
  { name: "abomasnow",             ja: "ユキノオー",              id: 460   },  // 88
  { name: "machamp",               ja: "カイリキー",              id: 68    },  // 89
  { name: "toxicroak",             ja: "ドクロッグ",              id: 454   },  // 90
  { name: "slowking-galar",        ja: "ガラルヤドキング",        id: 10172 },  // 91
  { name: "conkeldurr",            ja: "ローブシン",              id: 534   },  // 92 (重複注意)
  { name: "steelix",               ja: "ハガネール",              id: 208   },  // 93
  { name: "banette",               ja: "ジュペッタ",              id: 354   },  // 94
  { name: "avalugg",               ja: "クレベース",              id: 713   },  // 95
  { name: "sableye",               ja: "ヤミラミ",                id: 302   },  // 96
  { name: "sharpedo",              ja: "サメハダー",              id: 319   },  // 97
  { name: "chimecho",              ja: "チリーン",                id: 358   },  // 98
  { name: "orthworm",              ja: "ミミズズ",                id: 968   },  // 99
  { name: "zoroark",               ja: "ゾロアーク",              id: 571   },  // 100
  { name: "tauros-paldea-aqua",    ja: "パルデアケンタロス(水)",   id: 10251 },  // 101
  { name: "victreebel",            ja: "ウツボット",              id: 71    },  // 102
  { name: "garganacl",             ja: "キョジオーン",            id: 934   },  // 103
  { name: "tauros-paldea-blaze",   ja: "パルデアケンタロス(炎)",   id: 10250 },  // 104
  { name: "politoed",              ja: "ニョロトノ",              id: 186   },  // 105
  { name: "absol",                 ja: "アブソル",                id: 359   },  // 106
  { name: "tinkaton",              ja: "デカヌチャン",            id: 959   },  // 107 (重複注意)
  { name: "manectric",             ja: "ライボルト",              id: 310   },  // 108
  { name: "hydrapple",             ja: "カミツオロチ",            id: 1019  },  // 109
  { name: "gliscor",               ja: "グライオン",              id: 472   },  // 110
  { name: "aggron",                ja: "ボスゴドラ",              id: 306   },  // 111
  { name: "typhlosion-hisui",      ja: "ヒスイバクフーン",        id: 10234 },  // 112
  { name: "medicham",              ja: "チャーレム",              id: 308   },  // 113
  { name: "talonflame",            ja: "ファイアロー",            id: 663   },  // 114
  { name: "aurorus",               ja: "アマルルガ",              id: 699   },  // 115
  { name: "pinsir",                ja: "カイロス",                id: 127   },  // 116
  { name: "typhlosion",            ja: "バクフーン",              id: 157   },  // 117
  { name: "beedrill",              ja: "スピアー",                id: 15    },  // 118
  { name: "maushold",              ja: "イッカネズミ",            id: 925   },  // 119
  { name: "ampharos",              ja: "デンリュウ",              id: 181   },  // 120
  { name: "polteageist",           ja: "ポットデス",              id: 855   },  // 121
  { name: "espeon",                ja: "エーフィ",                id: 196   },  // 122
  { name: "slurpuff",              ja: "ペロリーム",              id: 685   },  // 123
  { name: "avalugg-hisui",         ja: "ヒスイクレベース",        id: 10243 },  // 124
  { name: "runerigus",             ja: "デスバーン",              id: 867   },  // 125
  { name: "leafeon",               ja: "リーフィア",              id: 470   },  // 126
  { name: "stunfisk",              ja: "マッギョ",                id: 618   },  // 127
  { name: "cofagrigus",            ja: "デスカーン",              id: 563   },  // 128
  { name: "tsareena",              ja: "アマージョ",              id: 763   },  // 129
  { name: "glaceon",               ja: "グレイシア",              id: 471   },  // 130
  { name: "gourgeist",             ja: "パンプジン",              id: 711   },  // 131
  { name: "weavile",               ja: "マニューラ",              id: 461   },  // 132 (重複注意)
  { name: "golurk",                ja: "ゴルーグ",                id: 623   },  // 133
  { name: "glalie",                ja: "オニゴーリ",              id: 362   },  // 134
  { name: "slowking",              ja: "ヤドキング",              id: 199   },  // 135
  { name: "salazzle",              ja: "エンニュート",            id: 758   },  // 136
  { name: "ninetales",             ja: "キュウコン",              id: 38    },  // 137
  { name: "vaporeon",              ja: "シャワーズ",              id: 134   },  // 138
  { name: "jolteon",               ja: "サンダース",              id: 135   },  // 139
  { name: "rhyperior",             ja: "ドサイドン",              id: 464   },  // 140
  { name: "raichu",                ja: "ライチュウ",              id: 26    },  // 141
  { name: "heliolisk",             ja: "エレザード",              id: 695   },  // 142
  { name: "reuniclus",             ja: "ランクルス",              id: 579   },  // 143
  { name: "pangoro",               ja: "ゴロンダ",                id: 675   },  // 144
  { name: "mudsdale",              ja: "バンバドロ",              id: 750   },  // 145
  { name: "slowbro",               ja: "ヤドラン",                id: 80    },  // 146 (重複注意)
  { name: "luxray",                ja: "レントラー",              id: 405   },  // 147
  { name: "klefki",                ja: "クレッフィ",              id: 707   },  // 148
  { name: "liepard",               ja: "レパルダス",              id: 510   },  // 149
  { name: "kommo-o",               ja: "ジャラランガ",            id: 784   },  // 150
];

/**
 * ポケモンチャンピオンズ 使用率ランキング（ダブル）
 * 2026/04/10 (金) 18時時点のゲーム内ランクバトルダブルの公式使用率データ
 * 変動は前回スナップショットからの順位変動（正=UP / 負=DOWN / 0=変動なし / "new"=初登場）
 */
export const USAGE_RANKING_DOUBLES: UsageEntry[] = [
  { name: "incineroar",            ja: "ガオガエン",              id: 727,   change: 0     },   // 1
  { name: "sneasler",              ja: "オオニューラ",            id: 903,   change: 0     },   // 2
  { name: "garchomp",              ja: "ガブリアス",              id: 445,   change: 0     },   // 3
  { name: "kingambit",             ja: "ドドゲザン",              id: 983,   change: 1     },   // 4
  { name: "sinistcha",             ja: "ヤバソチャ",              id: 1013,  change: -1    },   // 5
  { name: "whimsicott",            ja: "エルフーン",              id: 547,   change: 0     },   // 6
  { name: "charizard",             ja: "リザードン",              id: 6,     change: 0     },   // 7
  { name: "basculegion",           ja: "イダイトウ♂",            id: 902,   change: 0     },   // 8
  { name: "tyranitar",             ja: "バンギラス",              id: 248,   change: 0     },   // 9
  { name: "pelipper",              ja: "ペリッパー",              id: 279,   change: 0     },   // 10
  { name: "floette",               ja: "フラエッテ",              id: 670,   change: 1     },   // 11
  { name: "rotom-wash",            ja: "ウォッシュロトム",        id: 10009, change: 1     },   // 12
  { name: "archaludon",            ja: "ブリジュラス",            id: 1018,  change: -2    },   // 13
  { name: "dragonite",             ja: "カイリュー",              id: 149,   change: 1     },   // 14
  { name: "farigiraf",             ja: "リキキリン",              id: 981,   change: -4    },   // 15
  { name: "gengar",                ja: "ゲンガー",                id: 94,    change: -4    },   // 16
  { name: "froslass",              ja: "ユキメノコ",              id: 478,   change: -3    },   // 17
  { name: "gardevoir",             ja: "サーナイト",              id: 282,   change: 0     },   // 18
  { name: "venusaur",              ja: "フシギバナ",              id: 3,     change: -2    },   // 19
  { name: "milotic",               ja: "ミロカロス",              id: 350,   change: -4    },   // 20
  { name: "maushold",              ja: "イッカネズミ",            id: 925,   change: 3     },   // 21
  { name: "aerodactyl",            ja: "プテラ",                  id: 142,   change: 4     },   // 22
  { name: "excadrill",             ja: "ドリュウズ",              id: 530,   change: -2    },   // 23
  { name: "talonflame",            ja: "ファイアロー",            id: 663,   change: 5     },   // 24
  { name: "corviknight",           ja: "アーマーガア",            id: 823,   change: 3     },   // 25
  { name: "primarina",             ja: "アシレーヌ",              id: 730,   change: 8     },   // 26
  { name: "sylveon",               ja: "ニンフィア",              id: 700,   change: 4     },   // 27
  { name: "delphox",               ja: "マフォクシー",            id: 655,   change: 2     },   // 28
  { name: "kommo-o",               ja: "ジャラランガ",            id: 784,   change: -6    },   // 29
  { name: "gyarados",              ja: "ギャラドス",              id: 130,   change: -5    },   // 30
  { name: "glimmora",              ja: "キラフロル",              id: 970,   change: -4    },   // 31
  { name: "aegislash",             ja: "ギルガルド",              id: 681,   change: 0     },   // 32
  { name: "politoed",              ja: "ニョロトノ",              id: 186,   change: 5     },   // 33
  { name: "meganium",              ja: "メガニウム",              id: 154,   change: 5     },   // 34
  { name: "torkoal",               ja: "コータス",                id: 324,   change: 2     },   // 35
  { name: "arcanine-hisui",        ja: "ヒスイウィンディ",        id: 10230, change: -3    },   // 36
  { name: "palafin",               ja: "イルカマン",              id: 964,   change: -2    },   // 37
  { name: "dragapult",             ja: "ドラパルト",              id: 887,   change: 7     },   // 38
  { name: "ninetales-alola",       ja: "アローラキュウコン",      id: 10104, change: -11   },   // 39
  { name: "typhlosion-hisui",      ja: "ヒスイバクフーン",        id: 10234, change: 7     },   // 40
  { name: "volcarona",             ja: "ウルガモス",              id: 637,   change: -5    },   // 41
  { name: "starmie",               ja: "スターミー",              id: 121,   change: 1     },   // 42
  { name: "kangaskhan",            ja: "ガルーラ",                id: 115,   change: 0     },   // 43
  { name: "hydreigon",             ja: "サザンドラ",              id: 635,   change: 0     },   // 44
  { name: "blastoise",             ja: "カメックス",              id: 9,     change: 1     },   // 45
  { name: "clefable",              ja: "ピクシー",                id: 36,    change: 1     },   // 46
  { name: "rotom-heat",            ja: "ヒートロトム",            id: 10008, change: 1     },   // 47
  { name: "mamoswine",             ja: "マンムー",                id: 473,   change: -8    },   // 48
  { name: "meowscarada",           ja: "マスカーニャ",            id: 908,   change: 0     },   // 49
  { name: "scizor",                ja: "ハッサム",                id: 212,   change: "new" },   // 50
];

function getActiveRanking(format: Format): UsageEntry[] {
  return format === "double" ? USAGE_RANKING_DOUBLES : USAGE_RANKING;
}

export function getUsageSuggestNames(
  format: Format,
  selected: string[] = [],
  limit = 16,
): string[] {
  const selectedSet = new Set(selected.map((name) => normalizeJaText(name)));

  return getActiveRanking(format)
    .map((entry) => entry.ja)
    .filter((ja, index, array) => array.indexOf(ja) === index)
    .filter((ja) => !selectedSet.has(normalizeJaText(ja)))
    .slice(0, limit);
}

export function getRankedPokemonCandidates(
  format: Format,
  query: string,
  limit = 20,
): string[] {
  const ranking = getActiveRanking(format);
  const rankingNames = new Set(ranking.map((entry) => entry.name));
  const normalizedQuery = normalizeJaText(query);

  const fullRankingList = [
    ...ranking.map((entry) => ({ name: entry.name, ja: entry.ja })),
    ...Object.entries(EN_TO_JA)
      .filter(([en]) => !rankingNames.has(en))
      .sort(([, jaA], [, jaB]) => jaA.localeCompare(jaB, "ja"))
      .map(([name, ja]) => ({ name, ja })),
  ];

  const uniqueList = fullRankingList.filter(
    (entry, index, array) => array.findIndex((item) => item.ja === entry.ja) === index,
  );

  if (!normalizedQuery) {
    return uniqueList.slice(0, limit).map((entry) => entry.ja);
  }

  const prefix = uniqueList.filter((entry) => normalizeJaText(entry.ja).startsWith(normalizedQuery));
  const contains = uniqueList.filter((entry) => {
    const normalized = normalizeJaText(entry.ja);
    return !normalized.startsWith(normalizedQuery) && normalized.includes(normalizedQuery);
  });

  return [...prefix, ...contains].slice(0, limit).map((entry) => entry.ja);
}
