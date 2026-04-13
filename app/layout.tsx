import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { Noto_Sans_JP, Orbitron } from "next/font/google";
import { isAdminSession } from "@/lib/admin-auth";
import "./globals.css";

const GA_ID = "G-Y2608K2MZP";

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
  const isAdmin = await isAdminSession();

  return (
    <html lang="ja">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
        </Script>
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-screen font-sans antialiased`}>
        {/* ヘッダー */}
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
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
            {/* 共通ナビ */}
            <nav className="flex items-center gap-3">
              <Link
                href="/guide"
                className="text-xs font-bold text-slate-600 transition hover:text-cyan-600"
              >
                掲載方法
              </Link>
            </nav>
            {/* 管理者のみ: ヘッダー右側にショートカット */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/ingest"
                  className="rounded-full bg-cyan-500 px-4 py-1.5 text-[11px] font-bold text-white shadow hover:bg-cyan-600"
                >
                  ＋ 取り込む
                </Link>
                <Link
                  href="/admin/teams"
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  一覧編集
                </Link>
              </div>
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
