"use client";

import { useState } from "react";

// Windows shows flag emoji as two letters (IL, GB...), so use a small flag image and fall back
// to the emoji only if the image can't load. `country` is the ISO code: il, gb, sa.
export default function Flag({ country, emoji }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-xl">{emoji}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      alt=""
      width={28}
      height={20}
      className="h-5 w-7 rounded-[3px] object-cover shadow"
      onError={() => setFailed(true)}
    />
  );
}
