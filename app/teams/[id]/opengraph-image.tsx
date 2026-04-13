// 構築詳細ページの OG 画像を動的生成する
// X/Slack 等で URL をシェアしたときに 6 体のポケモンとタイトルを載せたカードを表示させる
import { ImageResponse } from "next/og";
import { DUMMY_TEAMS } from "@/lib/dummy-teams";
import { loadSavedTeams } from "@/lib/saved-teams";
import { getHomeSpriteUrl } from "@/lib/pokemon-sprite";

// OG 画像の推奨サイズ (1200x630)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ポケモン構築カード";
export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function OgImage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const savedTeams = await loadSavedTeams();
  const allTeams = [...savedTeams, ...DUMMY_TEAMS];
  const team = allTeams.find((t) => t.id === id);

  // 構築が見つからない場合はシンプルなフォールバック
  if (!team) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
            color: "white",
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          ポケコレ
        </div>
      ),
      size,
    );
  }

  const formatLabel = team.format === "double" ? "ダブル" : "シングル";
  const title = team.title || `${team.author}さんの構築`;
  const stats: string[] = [];
  if (team.season) stats.push(team.season);
  if (team.rank) stats.push(`最終${team.rank}位`);
  if (team.rating) stats.push(`レート${team.rating}`);

  // 6体分のスプライト URL (空スロットは null)
  const pokemons = Array.from({ length: 6 }, (_, i) => team.pokemons[i] ?? null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)",
          padding: 48,
          position: "relative",
        }}
      >
        {/* 上部: タイトル */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 24,
              fontWeight: 900,
              color: "#0891b2",
              letterSpacing: 4,
            }}
          >
            <span
              style={{
                background: "#0891b2",
                color: "white",
                padding: "4px 14px",
                borderRadius: 999,
                fontSize: 22,
              }}
            >
              {formatLabel}
            </span>
            <span>POKEMON CHAMPIONS TEAM</span>
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.1,
              maxWidth: 1100,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 28,
              color: "#475569",
              fontWeight: 700,
            }}
          >
            <span>@{team.author}</span>
            {stats.map((s) => (
              <span key={s} style={{ color: "#7c3aed" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* 下部: 6体のポケモンスプライトを横並び */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            gap: 8,
          }}
        >
          {pokemons.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 176,
              }}
            >
              {p?.slug ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getHomeSpriteUrl(p.slug)}
                  alt={p.name ?? ""}
                  width={176}
                  height={176}
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <div
                  style={{
                    width: 176,
                    height: 176,
                    background: "#e2e8f0",
                    borderRadius: 88,
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 4,
                  maxWidth: 176,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p?.name ?? ""}
              </div>
            </div>
          ))}
        </div>

        {/* 右下にサイト名 */}
        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 16,
            fontSize: 20,
            fontWeight: 900,
            color: "#94a3b8",
            letterSpacing: 2,
          }}
        >
          ポケコレ
        </div>
      </div>
    ),
    size,
  );
}
