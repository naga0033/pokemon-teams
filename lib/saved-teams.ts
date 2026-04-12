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
  };
}

export async function loadSavedTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("registered_at", { ascending: false });

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
  const { error } = await supabase.from("teams").insert({
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
  });
  if (error) throw new Error(error.message);
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.author !== undefined) row.author = updates.author;
  if (updates.format !== undefined) row.format = updates.format;
  if (updates.teamCode !== undefined) row.team_code = updates.teamCode;
  if (updates.sourceUrl !== undefined) row.source_url = updates.sourceUrl;
  if (updates.pokemons !== undefined) row.pokemons = updates.pokemons;

  const { error } = await supabase.from("teams").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
