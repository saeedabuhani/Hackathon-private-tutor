"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";
import TabBar from "./TabBar";
import PreferencesControls from "./PreferencesControls";

export default function TopNav() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const xp = useStore((s) => s.xp);
  const reset = useStore((s) => s.reset);

  async function logout() {
    await supabase.auth.signOut();
    reset();
    router.replace("/login");
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
      <TabBar />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <PreferencesControls />
        <span className="text-amber-400 font-semibold">{t.xpPoints(xp)}</span>
        <span className="hidden sm:inline text-slate-400">{user?.email}</span>
        <button onClick={logout} className="text-slate-400 hover:text-slate-100">
          {t.logout}
        </button>
      </div>
    </header>
  );
}
