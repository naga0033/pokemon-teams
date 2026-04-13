// 構築の掲載方法ガイドページ
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "構築の掲載方法 | ポケモンチャンピオンズ 構築コレクション",
  description:
    "ポケモンチャンピオンズの構築をサイトに掲載する方法をご案内します。スクリーンショットの撮り方やハッシュタグの使い方を解説。",
};

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-20">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-[11px] tracking-wider text-slate-400">
        <Link href="/" className="hover:text-cyan-600">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-slate-700">構築の掲載方法</span>
      </div>

      {/* ヒーロー */}
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-violet-50/30 p-8 shadow-sm md:p-10">
        <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
          構築の掲載方法について
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          当サイトでは、X (旧Twitter) に投稿された構築を運営が取り込み、
          ポケモン名・技・持ち物・努力値などを自動解析して掲載しています。
          掲載をご希望の方は以下をご確認ください。
        </p>
      </header>

      {/* ── STEP 1: 投稿の仕方 ── */}
      <section className="space-y-4">
        <StepHeader number={1} title="X に構築を投稿する" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            ポケモンチャンピオンズのチーム確認画面で
            <strong>「能力」タブ</strong>と<strong>「ステータス」タブ</strong>の
            スクリーンショットを撮影し、X に投稿してください。
          </p>

          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              ✅ この画面のスクリーンショットが必要です
            </h3>

            {/* 画像1: シングル/ダブル確認画面 */}
            <div className="overflow-hidden rounded-xl border-2 border-emerald-200 bg-emerald-50">
              <div className="bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                写真① バトル画面 (任意)
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/guide/overview-screen.jpg"
                alt="バトル画面のスクリーンショット例 - シングル/ダブルの判定に使用"
                className="w-full"
              />
              <div className="px-3 py-2 text-xs text-slate-600">
                シングル / ダブルの判定に使います。ツイート本文に書いてあれば<strong>この写真は不要</strong>です。
              </div>
            </div>

            {/* 画像2と3: 能力 + ステータス */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border-2 border-cyan-200 bg-cyan-50">
                <div className="bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white">
                  写真② 能力タブ (必須)
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/guide/ability-screen.jpg"
                  alt="能力タブのスクリーンショット例"
                  className="w-full"
                />
                <div className="px-3 py-2 text-xs text-slate-600">
                  ポケモン名・特性・持ち物・技4つが読み取れます
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border-2 border-violet-200 bg-violet-50">
                <div className="bg-violet-500 px-3 py-1.5 text-xs font-bold text-white">
                  写真③ ステータスタブ (必須)
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/guide/stats-screen.jpg"
                  alt="ステータスタブのスクリーンショット例"
                  className="w-full"
                />
                <div className="px-3 py-2 text-xs text-slate-600">
                  実数値と努力値が読み取れます
                </div>
              </div>
            </div>
          </div>

          {/* ニックネームの注意 */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <span>⚠️</span>
              ポケモンの名前について
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-amber-700">
              ポケモンにニックネームをつけていると、正しく情報を読み取れないことがあります。
              <br />
              スクリーンショットを撮る際は、できるだけ<strong>正式名称 (デフォルトの名前)</strong> の
              状態でお願いいたします。
            </p>
          </div>

          {/* ハッシュタグ */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-900">推奨ハッシュタグ</h3>
            <p className="mt-1 text-xs text-slate-600">
              以下のハッシュタグをつけて投稿していただけると、運営が見つけやすくなります。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-sm font-bold text-cyan-700">
                #ポケコレシングル
              </span>
              <span className="rounded-full bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-700">
                #ポケコレダブル
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEP 2: 掲載の流れ ── */}
      <section className="space-y-4">
        <StepHeader number={2} title="掲載までの流れ" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ol className="space-y-5">
            <FlowItem
              number="①"
              title="X に構築スクリーンショットを投稿"
              desc="能力画面 + ステータス画面のスクショと、シングル/ダブルのどちらかを明記してツイートしてください。"
            />
            <FlowItem
              number="②"
              title="運営がツイートを発見 or DMでご連絡"
              desc="ハッシュタグや検索で構築ツイートを見つけるか、掲載希望のDMをいただきます。"
            />
            <FlowItem
              number="③"
              title="画像を自動解析"
              desc="スクリーンショットからポケモン名・技・持ち物・努力値などを自動で読み取ります。"
            />
            <FlowItem
              number="④"
              title="サイトに掲載"
              desc="投稿者名と元ツイートへのリンクを添えて公開します。"
            />
          </ol>
        </div>
      </section>

      {/* ── STEP 3: 掲載を希望する方 ── */}
      <section className="space-y-4">
        <StepHeader number={3} title="掲載を希望される方へ" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            構築の掲載を希望される方は、以下のいずれかの方法でお知らせください。
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-bold text-slate-900">方法 1: ハッシュタグ投稿</h4>
              <p className="mt-1 text-xs text-slate-600">
                <span className="font-bold text-cyan-700">#ポケコレシングル</span> または{" "}
                <span className="font-bold text-pink-700">#ポケコレダブル</span>{" "}
                をつけて投稿してください。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-bold text-slate-900">方法 2: 運営に DM</h4>
              <p className="mt-1 text-xs text-slate-600">
                X のアカウント{" "}
                <a
                  href="https://x.com/poketool2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-cyan-600 hover:underline"
                >
                  @poketool2
                </a>{" "}
                にDMで構築のツイートURLをお送りください。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 掲載を希望しない方 ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">
          掲載を希望されない方へ
        </h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            当サイトに掲載された構築の削除をご希望の場合は、いつでも対応いたします。
            <br />
            X の{" "}
            <a
              href="https://x.com/poketool2"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-cyan-600 hover:underline"
            >
              @poketool2
            </a>{" "}
            まで DM でご連絡ください。速やかに削除いたします。
          </p>
        </div>
      </section>

      {/* ── 注意事項 ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">注意事項</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-500">●</span>
              投稿者名と元ツイートへのリンクは必ず掲載します。
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-500">●</span>
              構築データの二次利用・転載はいたしません。
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-500">●</span>
              画像の自動解析のため、一部情報が誤って表示される場合があります。
              お気づきの際はご連絡いただけると助かります。
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">●</span>
              <span>
                当サイトの情報の誤りにより対戦の勝敗に影響が生じた場合でも、
                当サイトは一切の責任を負いかねます。
                <strong>ダメージ計算などにご利用の際は、念のため元のツイートもご確認ください。</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-500">●</span>
              当サイトは任天堂・株式会社ポケモン及び関係各社とは一切関係のない非公式ファンサイトです。
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
        >
          構築コレクションを見る →
        </Link>
      </div>
    </div>
  );
}

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-black text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-black text-white shadow-sm">
        {number}
      </span>
      {title}
    </h2>
  );
}

function FlowItem({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
        {number}
      </span>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-600">{desc}</p>
      </div>
    </li>
  );
}
