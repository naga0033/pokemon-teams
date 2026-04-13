import { supabase } from "./supabase";
import type { Team } from "./types";

type TeamRow = {
  id: string;
  title: string;
  author: string;
  author_x_handle: string | null;
  format: string;
  season: string | null;
  rank: number | null;
  rating: number | null;
  source_url: string | null;
  team_code: string | null;
  pokemons: unknown;
  registered_at: string;
  view_count?: number | null;
};

function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    authorXHandle: row.author_x_handle ?? undefined,
    format: row.format as "single" | "double",
    season: row.season ?? undefined,
    rank: row.rank ?? undefined,
    rating: row.rating ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    teamCode: row.team_code ?? undefined,
    pokemons: Array.isArray(row.pokemons) ? row.pokemons as Team["pokemons"] : [],
    registeredAt: row.registered_at,
    viewCount: row.view_count ?? 0,
  };
}

export async function loadSavedTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[loadSavedTeams]", error.message);
    return [];
  }
  return (data as TeamRow[]).map(rowToTeam);
}

export async function loadSavedTeamById(id: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToTeam(data as TeamRow);
}

export async function insertTeam(team: Team): Promise<void> {
  const baseRow = {
    id: team.id,
    title: team.title,
    author: team.author,
    author_x_handle: team.authorXHandle ?? null,
    format: team.format,
    season: team.season ?? null,
    rank: team.rank ?? null,
    rating: team.rating ?? null,
    source_url: team.sourceUrl ?? null,
    team_code: team.teamCode ?? null,
    pokemons: team.pokemons,
    registered_at: team.registeredAt,
  };

  const { error } = await supabase.from("teams").insert({
    ...baseRow,
    view_count: team.viewCount ?? 0,
  });

  if (!error) return;
  if (!error.message.includes("view_count")) {
    throw new Error(error.message);
  }

  // 旧スキーマ互換: view_count カラム未追加なら、その列なしで保存する
  const { error: fallbackError } = await supabase.from("teams").insert(baseRow);
  if (fallbackError) throw new Error(fallbackError.message);
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.author !== undefined) row.author = updates.author;
  if (updates.format !== undefined) row.format = updates.format;
  if (updates.teamCode !== undefined) row.team_code = updates.teamCode;
  if (updates.sourceUrl !== undefined) row.source_url = updates.sourceUrl;
  if (updates.pokemons !== undefined) row.pokemons = updates.pokemons;
  const { error } = await supabase.from("teams").update({
    ...row,
    ...(updates.viewCount !== undefined ? { view_count: updates.viewCount } : {}),
  }).eq("id", id);

  if (!error) return;
  if (!error.message.includes("view_count")) {
    throw new Error(error.message);
  }

  const { view_count, ...fallbackRow } = {
    ...row,
    ...(updates.viewCount !== undefined ? { view_count: updates.viewCount } : {}),
  };
  void view_count;

  const { error: fallbackError } = await supabase.from("teams").update(fallbackRow).eq("id", id);
  if (fallbackError) throw new Error(fallbackError.message);
}

export async function incrementTeamViewCount(id: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("view_count")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[incrementTeamViewCount/select]", error?.message ?? "team not found");
    return null;
  }

  const current = typeof data.view_count === "number" ? data.view_count : 0;
  const next = current + 1;
  const { error: updateError } = await supabase
    .from("teams")
    .update({ view_count: next })
    .eq("id", id);

  if (updateError) {
    console.error("[incrementTeamViewCount/update]", updateError.message);
    return null;
  }

  return next;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
