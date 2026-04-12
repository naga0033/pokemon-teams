import { NextResponse } from "next/server";
import { getEnSlug, resolvePokemonJaName } from "@/lib/pokemon-names";
import { loadSavedTeams, saveSavedTeams } from "@/lib/saved-teams";
import type { Format, PokemonSlot, Team } from "@/lib/types";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

function isAdmin(req: Request) {
  return isValidAdminToken(req.headers.get("cookie")?.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`))?.[1] ?? null);
}

function normalizePokemon(input: Record<string, unknown>, index: number): PokemonSlot {
  const rawName = typeof input.name === "string" ? input.name.trim() : "";
  const resolvedName = rawName ? resolvePokemonJaName(rawName) ?? rawName : "(不明)";
  const slug = getEnSlug(resolvedName) ?? "unknown";
  const rawMoves = Array.isArray(input.moves) ? input.moves : [];

  const normalizeStatBlock = (value: unknown) => {
    if (!value || typeof value !== "object") return undefined;
    const block = value as Record<string, unknown>;
    const keys = ["hp", "attack", "defense", "spAtk", "spDef", "speed"] as const;
    return Object.fromEntries(
      keys.map((key) => [key, typeof block[key] === "number" ? block[key] : Number(block[key] ?? 0) || 0]),
    ) as PokemonSlot["stats"];
  };

  return {
    name: resolvedName,
    slug,
    ability: typeof input.ability === "string" && input.ability.trim() ? input.ability.trim() : undefined,
    item: typeof input.item === "string" && input.item.trim() ? input.item.trim() : undefined,
    teraType: typeof input.teraType === "string" && input.teraType.trim() ? input.teraType.trim() : undefined,
    nature: typeof input.nature === "string" && input.nature.trim() ? input.nature.trim() : undefined,
    gender:
      input.gender === "male" || input.gender === "female" || input.gender === "unknown"
        ? input.gender
        : undefined,
    moves: rawMoves
      .filter((move): move is string => typeof move === "string")
      .map((move) => move.trim())
      .filter(Boolean)
      .slice(0, 4),
    stats: normalizeStatBlock(input.stats),
    evs: normalizeStatBlock(input.evs),
  };
}

type PatchBody = {
  title?: string;
  author?: string;
  format?: Format;
  sourceUrl?: string;
  teamCode?: string;
  pokemons?: Array<Record<string, unknown>>;
};

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  const teams = await loadSavedTeams();
  const targetIndex = teams.findIndex((team) => team.id === id);
  if (targetIndex < 0) {
    return NextResponse.json({ error: "構築が見つかりません" }, { status: 404 });
  }

  const current = teams[targetIndex];
  const nextTeam: Team = {
    ...current,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title,
    author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : current.author,
    format: body.format === "double" ? "double" : "single",
    sourceUrl:
      typeof body.sourceUrl === "string" && body.sourceUrl.trim() ? body.sourceUrl.trim() : undefined,
    teamCode:
      typeof body.teamCode === "string" && body.teamCode.trim() ? body.teamCode.trim() : undefined,
    pokemons: Array.isArray(body.pokemons)
      ? body.pokemons.map((pokemon, index) => normalizePokemon(pokemon, index))
      : current.pokemons,
  };

  teams[targetIndex] = nextTeam;
  await saveSavedTeams(teams);

  return NextResponse.json({ ok: true, team: nextTeam });
}
