// ページング UI (白地版)
import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  query: URLSearchParams;
};

export function Pagination({ currentPage, totalPages, query }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  const hrefFor = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/search?${next.toString()}`;
  };

  return (
    <nav className="flex items-center justify-center gap-1 py-4 text-sm">
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`dots-${idx}`} className="px-2 text-slate-300">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={
              p === currentPage
                ? "rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-1.5 font-bold text-white shadow-[0_0_14px_rgba(6,182,212,0.3)]"
                : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-cyan-300 hover:text-cyan-600"
            }
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={hrefFor(currentPage + 1)}
          className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-cyan-300 hover:text-cyan-600"
        >
          NEXT →
        </Link>
      )}
    </nav>
  );
}

function buildPageList(current: number, total: number): Array<number | "…"> {
  const delta = 2;
  const range: Array<number | "…"> = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  if (total > 1) range.push(total);

  return range;
}
