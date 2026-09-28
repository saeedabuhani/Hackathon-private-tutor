"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translations";

const tabs = [
  { href: "/feed", icon: "📱", key: "studyFeed" },
  { href: "/tutor", icon: "🧠", key: "tutor" },
  { href: "/explore", icon: "🎬", key: "explore" },
  { href: "/ai-studies", icon: "🤖", key: "aiStudies" },
];

export default function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              active
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab.icon} {t[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
