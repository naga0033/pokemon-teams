// 解析済みの構築データを保存する API
// MVP では data/teams.json に追記するシンプルな実装 (後で Supabase に差し替え)
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolvePokemonJaName, getEnSlug } from "@/lib/pokemon-names";

export const runtime = "nodejs";

const DATA_PATH = path.join(process.cwd(), "data", "teams.json");

type SaveBody = {
  trainerName?: string;
  teamCode?: string;
  tweetUrl?: string;
  format?: "single" | "double";
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

  // ポケモンデータを整形
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
      stats: typeof p.stats === "object" && p.stats ? p.stats : undefined,
      evs: typeof p.evs === "object" && p.evs ? p.evs : undefined,
      gender: typeof p.gender === "string" ? p.gender : undefined,
      slot: typeof p.slot === "number" ? p.slot : i + 1,
    };
  });

  // ID 生成 (英数字のみ: team- + ランダム8桁 + タイムスタンプ下6桁)
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-6);
  const id = `team-${rand}-${ts}`;

  const team = {
    id,
    title: body.trainerName
      ? `${body.trainerName} の構築`
      : "名前未設定の構築",
    author: body.trainerName ?? "不明",
    format: body.format ?? "single",
    teamCode: body.teamCode ?? undefined,
    sourceUrl: body.tweetUrl ?? undefined,
    registeredAt: new Date().toISOString().slice(0, 10),
    pokemons,
  };

  // data/teams.json に追記
  try {
    let existing: unknown[] = [];
    try {
      const raw = await fs.readFile(DATA_PATH, "utf-8");
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    } catch {
      // ファイルが壊れてたらリセット
      existing = [];
    }

    // 先頭に追加 (新しい順)
    existing.unshift(team);
    await fs.writeFile(DATA_PATH, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.error("[teams/save] Write error:", err);
    return NextResponse.json(
      { error: "保存に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id, message: "保存しました" });
}
