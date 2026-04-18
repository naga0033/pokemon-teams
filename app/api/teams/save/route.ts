import { NextResponse } from "next/server";
import { resolvePokemonJaName, getEnSlug } from "@/lib/pokemon-names";
import { insertTeam } from "@/lib/saved-teams";
import type { Team, PokemonSlot } from "@/lib/types";

export const runtime = "nodejs";

type SaveBody = {
  teamTitle?: string;
  trainerName?: string;
  teamCode?: string;
  tweetUrl?: string;
  format?: "single" | "double";
  rating?: number | null;
  rank?: number | null;
  pokemons?: Array<Record<string, unknown>>;
};

export async function POST(req: Request) {
  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  if (!Array.isArray(body.pokemons) || body.pokemons.length === 0) {
    return NextResponse.json({ error: "ポケモンデータがありません" }, { status: 400 });
  }

  const pokemons = body.pokemons.map((p, i) => {
    const name = typeof p.name === "string" ? p.name : null;
    const resolved = name ? resolvePokemonJaName(name) : null;
    return {
      name: resolved ?? name ?? "(不明)",
      slug: resolved ? (getEnSlug(resolved) ?? "unknown") : "unknown",
      ability: typeof p.ability === "string" ? p.ability : undefined,
      item: typeof p.item === "string" ? p.item : undefined,
      teraType: typeof p.teraType === "string" ? p.teraType : undefined,
      nature: typeof p.nature === "string" ? p.nature : undefined,
      moves: Array.isArray(p.moves) ? p.moves.filter((m): m is string => typeof m === "string") : [],
      stats: typeof p.stats === "object" && p.stats ? p.stats as PokemonSlot["stats"] : undefined,
      evs: typeof p.evs === "object" && p.evs ? p.evs as PokemonSlot["stats"] : undefined,
      gender: p.gender === "male" || p.gender === "female" || p.gender === "unknown" ? p.gender as "male" | "female" | "unknown" : undefined,
      slot: typeof p.slot === "number" ? p.slot : i + 1,
    };
  });

  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-6);
  const id = `team-${rand}-${ts}`;

  const team: Team = {
    id,
    title:
      typeof body.teamTitle === "string" && body.teamTitle.trim()
        ? body.teamTitle.trim()
        : body.trainerName
          ? `${body.trainerName}さん の構築`
          : "名前未設定の構築",
    author: body.trainerName ?? "不明",
    format: body.format ?? "single",
    teamCode: body.teamCode ?? undefined,
    sourceUrl: body.tweetUrl ?? undefined,
    rating: typeof body.rating === "number" && Number.isFinite(body.rating) ? body.rating : undefined,
    rank: typeof body.rank === "number" && Number.isFinite(body.rank) && body.rank > 0 ? body.rank : undefined,
    registeredAt: new Date().toISOString().slice(0, 10),
    pokemons,
  };

  try {
    await insertTeam(team);
  } catch (err) {
    console.error("[teams/save]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "保存に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id, message: "保存しました" });
}
