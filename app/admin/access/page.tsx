import { redirect } from "next/navigation";
import { AdminAccessForm } from "@/components/admin/AdminAccessForm";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  if (await isAdminSession()) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="font-display text-[11px] font-bold tracking-[0.3em] text-cyan-600">ADMIN ACCESS</p>
        <h1 className="mt-1 font-display text-2xl font-black text-slate-900">管理モードに入る</h1>
      </div>
      <AdminAccessForm />
    </div>
  );
}
