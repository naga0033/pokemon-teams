"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAccessForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          const res = await fetch("/api/admin/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error ?? "ログインに失敗しました");
          router.push("/admin");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "ログインに失敗しました");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div>
        <p className="text-sm font-bold text-slate-900">管理キー</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-400"
          placeholder="管理用キーを入力"
        />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !key.trim()}
        className="btn-neon rounded-full px-5 py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "確認中…" : "管理モードに入る"}
      </button>
    </form>
  );
}
