"use client";

type StatKey = "attack" | "defense" | "spAtk" | "spDef" | "speed";

const NATURE_MODIFIERS: Record<string, [StatKey | null, StatKey | null]> = {
  さみしがり: ["attack", "defense"],
  いじっぱり: ["attack", "spAtk"],
  やんちゃ: ["attack", "spDef"],
  ゆうかん: ["attack", "speed"],
  ずぶとい: ["defense", "attack"],
  わんぱく: ["defense", "spAtk"],
  のうてんき: ["defense", "spDef"],
  のんき: ["defense", "speed"],
  ひかえめ: ["spAtk", "attack"],
  おっとり: ["spAtk", "defense"],
  うっかりや: ["spAtk", "spDef"],
  れいせい: ["spAtk", "speed"],
  おだやか: ["spDef", "attack"],
  おとなしい: ["spDef", "defense"],
  しんちょう: ["spDef", "spAtk"],
  なまいき: ["spDef", "speed"],
  おくびょう: ["speed", "attack"],
  せっかち: ["speed", "defense"],
  ようき: ["speed", "spAtk"],
  むじゃき: ["speed", "spDef"],
  てれや: [null, null],
  がんばりや: [null, null],
  すなお: [null, null],
  きまぐれ: [null, null],
  まじめ: [null, null],
};

export function getNatureModifier(nature: string | null | undefined, stat: StatKey): "up" | "down" | null {
  if (!nature) return null;
  const mod = NATURE_MODIFIERS[nature];
  if (!mod) return null;
  if (mod[0] === stat) return "up";
  if (mod[1] === stat) return "down";
  return null;
}

export function NatureIndicatorLabel({ nature, stat }: { nature: string | null | undefined; stat: StatKey }) {
  const mod = getNatureModifier(nature, stat);
  if (mod === "up") return <span className="ml-0.5 text-[10px] font-bold text-rose-500">↑</span>;
  if (mod === "down") return <span className="ml-0.5 text-[10px] font-bold text-sky-500">↓</span>;
  return null;
}
