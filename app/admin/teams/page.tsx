import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin-auth";
import { loadSavedTeams } from "@/lib/saved-teams";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/access");
  }

  const teams = await loadSavedTeams();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] font-bold tracking-[0.3em] text-cyan-600">TEAM EDITOR</p>
        <h1 className="mt-1 font-display text-2xl font-black text-slate-900">保存済み構築を修正</h1>
      </div>
      <div className="space-y-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/admin/teams/${team.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-cyan-300"
          >
            <div>
              <p className="font-bold text-slate-900">{team.title}</p>
              <p className="mt-1 text-sm text-slate-500">{team.author} · {team.format === "single" ? "シングル" : "ダブル"}</p>
            </div>
            <span className="text-sm font-bold text-cyan-600">修正する →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
