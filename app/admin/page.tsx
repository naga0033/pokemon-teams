import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin-auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/access");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[11px] font-bold tracking-[0.3em] text-cyan-600">ADMIN MODE</p>
          <h1 className="mt-1 font-display text-2xl font-black text-slate-900">管理メニュー</h1>
        </div>
        <LogoutButton />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/ingest" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
          <p className="text-lg font-black text-slate-900">ツイート取り込み</p>
          <p className="mt-1 text-sm text-slate-500">ツイートURLから構築を取り込みます。</p>
        </Link>
        <Link href="/admin/teams" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
          <p className="text-lg font-black text-slate-900">構築修正</p>
          <p className="mt-1 text-sm text-slate-500">保存済みの構築をあとから修正できます。</p>
        </Link>
      </div>
    </div>
  );
}
