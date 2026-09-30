"use client";

import { useCallback, useEffect, useState } from "react";

// Favorites are a small per-browser list (localStorage): "s:<sessionId>" for a conversation,
// "m:<materialId>" for a material. Nothing is sent to the server.
const KEY = "tutorFavorites";
const EVENT = "tutor-favorites-changed";

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export const sessionKey = (id) => `s:${id}`;
export const materialKey = (id) => `m:${id}`;

export default function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const sync = () => setFavorites(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((key) => {
    const current = read();
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage blocked: the star just won't stick
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { favorites, toggle, isFavorite: (key) => favorites.includes(key) };
}
