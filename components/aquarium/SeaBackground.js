"use client";

import { usePathname } from "next/navigation";
import AquariumCanvas from "./AquariumCanvas";

// The sea behind every page after login: each area of the app is a different water.
//   /feed -> coral reef   /tutor -> submarine lab   /explore -> open sea   /ai-studies -> deep sea
function variantFor(pathname) {
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/ai-studies")) return "ai-studies";
  return "tutor";
}

export default function SeaBackground() {
  const variant = variantFor(usePathname());
  return (
    <div className="sea-bg" aria-hidden="true">
      <AquariumCanvas key={variant} variant={variant} />
    </div>
  );
}
