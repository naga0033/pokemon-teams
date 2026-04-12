import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="mb-6 flex items-center gap-3 text-sm">
        <Link href="/admin" className="font-bold text-slate-600 transition hover:text-cyan-600">管理</Link>
        <Link href="/admin/ingest" className="font-bold text-slate-600 transition hover:text-cyan-600">取り込み</Link>
        <Link href="/admin/teams" className="font-bold text-slate-600 transition hover:text-cyan-600">構築修正</Link>
      </nav>
      {children}
    </div>
  );
}
