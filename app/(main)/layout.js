"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useStore from "@/store/useStore";
import TopNav from "@/components/layout/TopNav";

export default function MainLayout({ children }) {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const setXP = useStore((s) => s.setXP);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUser(data.session.user);
      setReady(true);
      // Load saved XP so the counter survives reloads
      supabase
        .from("users")
        .select("xp")
        .eq("id", data.session.user.id)
        .maybeSingle()
        .then(({ data: row }) => {
          if (row) setXP(row.xp || 0);
        });
    });
  }, [router, setUser, setXP]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
