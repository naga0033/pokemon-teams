// PokeAPI から種族値を取得する軽量ヘルパ（性格逆算で使用）
// pokemon-champions-stats 側の同名ファイルからコピーしてきたもの

export type BaseStats = {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
};

// 特殊フォーム用のスラッグ上書き
const FETCH_SLUG_OVERRIDES: Record<string, string> = {
  aegislash: "aegislash-shield",
  basculegion: "basculegion-male",
  meowstic: "meowstic-male",
  mimikyu: "mimikyu-disguised",
  palafin: "palafin-hero",
  floette: "floette-eternal",
  "tauros-paldea-combat": "tauros-paldea-combat-breed",
  "tauros-paldea-blaze": "tauros-paldea-blaze-breed",
  "tauros-paldea-aqua": "tauros-paldea-aqua-breed",
};

export async function fetchBaseStats(slug: string): Promise<BaseStats | null> {
  const resolved = FETCH_SLUG_OVERRIDES[slug] ?? slug;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${resolved}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const getStat = (name: string) =>
      (data.stats as Array<{ base_stat: number; stat: { name: string } }>)
        .find((s) => s.stat.name === name)?.base_stat ?? 0;

    return {
      hp: getStat("hp"),
      atk: getStat("attack"),
      def: getStat("defense"),
      spAtk: getStat("special-attack"),
      spDef: getStat("special-defense"),
      speed: getStat("speed"),
    };
  } catch {
    return null;
  }
}
