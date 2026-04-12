// PokeAPI のスプライト画像 URL を解決するヘルパ
import { POKEMON_IDS } from "./pokemon-ids";

const OFFICIAL_ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const HOME_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home";

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * 英語 slug からポケモンの図鑑 ID を引く
 * 未知の slug の場合は null
 */
export function getPokemonId(slug: string): number | null {
  return POKEMON_IDS[slug] ?? null;
}

/**
 * 英語 slug から official-artwork URL を返す
 * 未知の slug の場合はプレースホルダ画像を返す
 */
export function getOfficialArtworkUrl(slug: string): string {
  const id = getPokemonId(slug);
  if (id == null) {
    // 不明ポケモンは 0.png (ポケモン玉) にフォールバック
    return `${OFFICIAL_ARTWORK_BASE}/0.png`;
  }
  return `${OFFICIAL_ARTWORK_BASE}/${id}.png`;
}

/**
 * 英語 slug から Pokemon HOME 風のスプライト URL を返す
 * カード一覧ではこちらの方が軽くて映える
 */
// home スプライトが存在しないフォームは official-artwork にフォールバック
const HOME_MISSING = new Set([10061]);

export function getHomeSpriteUrl(slug: string): string {
  const id = getPokemonId(slug);
  if (id == null) {
    return `${HOME_BASE}/0.png`;
  }
  if (HOME_MISSING.has(id)) {
    return `${OFFICIAL_ARTWORK_BASE}/${id}.png`;
  }
  return `${HOME_BASE}/${id}.png`;
}

/**
 * 一覧表示向けの軽量スプライト URL を返す
 */
export function getListSpriteUrl(slug: string): string {
  const id = getPokemonId(slug);
  if (id == null) {
    return `${SPRITE_BASE}/0.png`;
  }
  return `${SPRITE_BASE}/${id}.png`;
}
