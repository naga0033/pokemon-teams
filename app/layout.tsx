import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP, Orbitron } from "next/font/google";
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
  title: "ポケチャン トレーナーデッキ",
  description:
    "ポケモンチャンピオンズの構築をトレーナーカード形式でコレクション。シングル/ダブル切り替えとポケモン名での絞り込みに対応。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-sans antialiased`}>
        {/* ヘッダー */}
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 shadow-[0_0_18px_rgba(139,92,246,0.4)] transition group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)]"
              />
              <span className="text-base font-extrabold tracking-[0.04em] text-slate-900 md:text-lg">
                ポケモンチャンピオンズ
                <span className="ml-1 text-cyan-600">構築コレクション</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link
                href="/"
                className="font-semibold text-slate-600 transition hover:text-cyan-600"
              >
                ホーム
              </Link>
              <Link
                href="/search"
                className="font-semibold text-slate-600 transition hover:text-cyan-600"
              >
                構築検索
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>

        {/* フッター */}
        <footer className="mt-20 border-t border-slate-200/70 bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-6 text-xs text-slate-500">
            <p>© ポケモンチャンピオンズ 構築コレクション</p>
            <p className="mt-1">
              ポケモンおよびポケモンのキャラクター名は任天堂・クリーチャーズ・ゲームフリークの登録商標です。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
