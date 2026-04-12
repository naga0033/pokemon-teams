// data/teams.json から保存済みチームを読み込む (Server Component 用)
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Team } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "teams.json");

/** 保存済みチームを読み込む (ファイルがなければ空配列) */
export async function loadSavedTeams(): Promise<Team[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as Team[];
  } catch {
    return [];
  }
}
