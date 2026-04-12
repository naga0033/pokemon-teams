import { notFound, redirect } from "next/navigation";
import { TeamEditor } from "@/components/admin/TeamEditor";
import { isAdminSession } from "@/lib/admin-auth";
import { loadSavedTeamById } from "@/lib/saved-teams";

export const dynamic = "force-dynamic";

export default async function AdminTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) {
    redirect("/admin/access");
  }

  const { id } = await params;
  const team = await loadSavedTeamById(id);
  if (!team) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[11px] font-bold tracking-[0.3em] text-cyan-600">TEAM EDITOR</p>
        <h1 className="mt-1 font-display text-2xl font-black text-slate-900">構築を修正</h1>
      </div>
      <TeamEditor initialTeam={team} />
    </div>
  );
}
