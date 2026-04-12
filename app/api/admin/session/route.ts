import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminSecret, isValidAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { key?: string };
  try {
    body = (await req.json()) as { key?: string };
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_ACCESS_KEY が設定されていません" }, { status: 500 });
  }

  if (!isValidAdminToken(body.key)) {
    return NextResponse.json({ error: "管理キーが違います" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
