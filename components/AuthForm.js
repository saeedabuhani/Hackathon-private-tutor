"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/translations";
import PreferencesControls from "@/components/layout/PreferencesControls";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo(t.checkEmail);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/feed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm flex justify-end">
        <PreferencesControls />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">{isRegister ? t.register : t.login}</h1>
        {isRegister && (
          <input
            className={inputClass}
            placeholder={t.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className={inputClass}
          type="email"
          placeholder={t.email}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={inputClass}
          type="password"
          placeholder={t.password}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 py-2 font-medium"
        >
          {loading ? "..." : isRegister ? t.registerSubmit : t.login}
        </button>
        <p className="text-sm text-slate-400">
          {isRegister ? t.haveAccount : t.noAccount}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="text-indigo-400 hover:underline"
          >
            {isRegister ? t.login : t.registerSubmit}
          </Link>
        </p>
      </form>
    </main>
  );
}
