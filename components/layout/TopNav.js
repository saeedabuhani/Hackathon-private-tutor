"use client";

import "./nav.css";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";
import Brand from "./Brand";
import TabBar from "./TabBar";
import PreferencesControls from "./PreferencesControls";
import HeaderSearch from "./HeaderSearch";
import XpCounter from "./XpCounter";

export default function TopNav() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const reset = useStore((s) => s.reset);

  async function logout() {
    await supabase.auth.signOut();
    reset();
    router.replace("/login");
  }

  return (
    <header className="topnav sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
      <Brand />
      <TabBar />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <HeaderSearch />
        <PreferencesControls />
        <XpCounter />
        <span className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 py-1 ps-1 pe-1 text-slate-300 2xl:pe-3">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-blue-500/80 text-xs font-bold text-white">
            {(user?.email || "?").trim().charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-[11rem] truncate 2xl:inline">{user?.email}</span>
        </span>
        <button onClick={logout} className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-100">
          {t.logout}
        </button>
      </div>
    </header>
  );
}
