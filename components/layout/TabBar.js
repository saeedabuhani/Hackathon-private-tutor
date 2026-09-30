"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, MotionConfig, motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";

const tabs = [
  { href: "/feed", icon: "📱", key: "studyFeed" },
  { href: "/tutor", icon: "🧠", key: "tutor" },
  { href: "/explore", icon: "🎬", key: "explore" },
  { href: "/ai-studies", icon: "🤖", key: "aiStudies" },
  { href: "/career", icon: "🚀", key: "career" },
];

// The active tab is one glass pill that slides between tabs (a shared layout animation), with a
// soft light under it. Reduced motion: it just appears in place.
export default function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="main-tabs">
        <nav className="tabbar">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className={`tab ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="tab-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  >
                    <span className="tab-pill-light" />
                  </motion.span>
                )}
                <span className="tab-label">
                  <span className="tab-icon" aria-hidden="true">
                    {tab.icon}
                  </span>
                  {t[tab.key]}
                </span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
    </MotionConfig>
  );
}
