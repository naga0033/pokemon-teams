// 既に取り込み済みの構築ツイートURL一覧を返す API
// Claude in Chrome などで新規候補を収集するときに「重複スキップ」用リストとして使う
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
// 追加取り込みの反映をすぐ返したいので毎回DBを読む
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("teams")
    .select("source_url")
    .not("source_url", "is", null);

  if (error) {
    console.error("[collected-urls]", error.message);
    return NextResponse.json({ error: "DB読み取り失敗" }, { status: 500 });
  }

  // x.com / twitter.com の表記揺れを吸収して統一した形で返す
  const urls = Array.from(
    new Set(
      (data ?? [])
        .map((row) => (row as { source_url?: string | null }).source_url ?? "")
        .filter(Boolean)
        .map(normalizeTweetUrl),
    ),
  );

  return NextResponse.json({ count: urls.length, urls });
}

// x.com と twitter.com を同一視してツイートIDベースで正規化する
function normalizeTweetUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    // twitter.com → x.com に寄せる
    if (u.hostname === "twitter.com" || u.hostname === "www.twitter.com") {
      u.hostname = "x.com";
    }
    if (u.hostname === "www.x.com") u.hostname = "x.com";
    // クエリパラメータは無視
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return raw.trim();
  }
}
