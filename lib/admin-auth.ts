import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "pokemon_teams_admin";

export function getAdminSecret() {
  return process.env.ADMIN_ACCESS_KEY?.trim() ?? "";
}

export function isValidAdminToken(token?: string | null) {
  const secret = getAdminSecret();
  return Boolean(secret) && token === secret;
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
