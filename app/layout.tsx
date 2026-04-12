import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Noto_Sans_JP, Orbitron } from "next/font/google";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";
import "./globals.css";

const bodyFont = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-body",
});

const displayFont = Orbitron({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ポケモンチャンピオンズ 構築コレクション",
  description:
    "ポケモンチャンピオンズの構築をトレーナーカード形式でコレクション。シングル/ダブル切り替えとポケモン名での絞り込みに対応。",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAdmin = isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? null);

  return (
    <html lang="ja">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-sans antialiased`}>
        {/* ヘッダー */}
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="group flex items-center gap-4">
              <Image
                src="/pokemon-champions-logo.webp"
                alt="Pokemon Champions"
                width={308}
                height={160}
                className="h-11 w-auto object-contain transition group-hover:scale-[1.02]"
                priority
              />
              <span className="text-base font-extrabold tracking-[0.04em] text-slate-900 md:text-lg">
                ポケモンチャンピオンズ
                <span className="ml-1 text-cyan-600">構築コレクション</span>
              </span>
            </Link>
            {isAdmin && (
              <nav className="flex items-center gap-3 text-sm">
                <Link href="/admin" className="font-bold text-slate-600 transition hover:text-cyan-600">
                  管理
                </Link>
                <Link href="/admin/ingest" className="font-bold text-slate-600 transition hover:text-cyan-600">
                  取り込み
                </Link>
                <Link href="/admin/teams" className="font-bold text-slate-600 transition hover:text-cyan-600">
                  構築修正
                </Link>
              </nav>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>

        {/* フッター */}
        <footer className="mt-20 px-5 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-4xl space-y-2">
            <p>ポケモンデータ: PokeAPI | 画像認識: Claude API (Anthropic)</p>
            <p>このサイトはポケモン対戦向けの非公式ファンツールです。</p>
            <p>
              不具合報告・ご要望は{" "}
              <a
                href="https://x.com/poketool2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 underline underline-offset-2 hover:text-sky-700"
              >
                X @poketool2
              </a>{" "}
              までお願いします。
            </p>
            <p className="leading-relaxed">
              当サイトは任天堂、株式会社ポケモン及び関係各社とは一切関係ありません。<br />
              ポケットモンスター・ポケモン・Pokémonは任天堂・クリーチャーズ・ゲームフリークの登録商標です。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
