// /lib/session.ts
"use client";

import { useEffect, useState } from "react";

const KEY = "bp_session";

export type SessionUser = {
  username: string; // "@abcd" 这种也行，但建议存 "abcd"，显示时再加 @
  name?: string;
};

export type Session = {
  user: SessionUser;
  createdAt: number;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  return safeParse<Session>(window.localStorage.getItem(KEY));
}

export function setSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  const session: Session = { user, createdAt: Date.now() };
  window.localStorage.setItem(KEY, JSON.stringify(session));
  // 让同一页面里的其它组件也能立刻收到变化
  window.dispatchEvent(new Event("bp-session"));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("bp-session"));
}

export function useSession() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      const s = getSession();
      setMe(s?.user ?? null);
      setReady(true);
    };

    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) read();
    };
    const onCustom = () => read();

    window.addEventListener("storage", onStorage);
    window.addEventListener("bp-session", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bp-session", onCustom);
    };
  }, []);

  return {
    ready, // 你想做 skeleton/loading 时用
    me,
    authed: !!me,
    loginMock: (username: string, name?: string) => setSession({ username, name }),
    logout: () => clearSession(),
  };
}
