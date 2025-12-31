// lib/store.ts
/* =========================================================
   Blueprint Fantasy — Domain Store (STEP 1)
   - User / Session（原样保留）
   - Insight / Comment（原样可用）
   - ✅ NEW: League Domain（不破坏旧逻辑）
   ========================================================= */

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
};

export type League = {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
  visibility: "public" | "private";
  createdAt: number;
};

export type Insight = {
  id: string;
  title: string;
  body: string;
  leagueSlug?: string; // legacy-compatible
  author: string;
  createdAt: number;
  heat: number;
};

export type Comment = {
  id: string;
  insightId: string;
  author: string;
  body: string;
  createdAt: number;
};

const KEYS = {
  users: "bp_users",
  session: "bp_session",
  leagues: "bp_leagues",   // ✅ NEW
  insights: "bp_insights",
  comments: "bp_comments",
};

/* ------------------ Utils ------------------ */

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function canUseStorage() {
  try {
    if (typeof window === "undefined") return false;
    const test = "__storage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ------------------ Users & Session ------------------ */

type StoredUserRow = { user: any; password: string };

function readUsers(): StoredUserRow[] {
  if (!canUseStorage()) return [];
  return safeParse(localStorage.getItem(KEYS.users), []);
}

function writeUsers(rows: StoredUserRow[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(KEYS.users, JSON.stringify(rows));
}

function ensureUser(u: any): User {
  return {
    id: String(u?.id ?? uid("u")),
    name: String(u?.name ?? "User"),
    email: String(u?.email ?? ""),
    username: String(u?.username ?? "user"),
  };
}

export function getSessionUser(): User | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(KEYS.session);
  return raw ? ensureUser(JSON.parse(raw)) : null;
}

export function signup(name: string, email: string, password: string) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };

  const rows = readUsers();
  if (rows.some(r => r.user.email === email)) {
    return { ok: false as const, error: "Email already exists" };
  }

  const user: User = {
    id: uid("u"),
    name,
    email,
    username: email.split("@")[0],
  };

  rows.push({ user, password });
  writeUsers(rows);
  localStorage.setItem(KEYS.session, JSON.stringify(user));
  return { ok: true as const, user };
}

export function login(email: string, password: string) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };

  const rows = readUsers();
  const row = rows.find(r => r.user.email === email);
  if (!row || row.password !== password) {
    return { ok: false as const, error: "Invalid credentials" };
  }

  localStorage.setItem(KEYS.session, JSON.stringify(row.user));
  return { ok: true as const, user: row.user };
}

export function logout() {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEYS.session);
}

/* ------------------ Leagues (NEW) ------------------ */

export function listLeagues(): League[] {
  if (!canUseStorage()) return [];
  return safeParse<League[]>(localStorage.getItem(KEYS.leagues), []);
}

export function getLeagueBySlug(slug: string): League | null {
  return listLeagues().find(l => l.slug === slug) ?? null;
}

export function createLeague(input: {
  name: string;
  visibility: "public" | "private";
}) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };

  const user = getSessionUser();
  if (!user) return { ok: false as const, error: "Login required" };

  const league: League = {
    id: uid("lg"),
    name: input.name.trim(),
    slug: slugify(input.name),
    ownerId: user.id,
    visibility: input.visibility,
    createdAt: Date.now(),
  };

  const all = listLeagues();
  all.push(league);
  localStorage.setItem(KEYS.leagues, JSON.stringify(all));

  return { ok: true as const, league };
}

/* ------------------ Insights ------------------ */
export function getInsightById(id: string): Insight | null {
  if (!canUseStorage()) return null;
  const all = listInsights();
  return all.find(i => i.id === id) ?? null;
}


export function listInsights(): Insight[] {
  if (!canUseStorage()) return [];
  return safeParse<Insight[]>(localStorage.getItem(KEYS.insights), []);
}

export function createInsight(input: {
  title: string;
  body: string;
  leagueSlug?: string;
}) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };

  const user = getSessionUser();
  if (!user) return { ok: false as const, error: "Login required" };

  const insight: Insight = {
    id: uid("ins"),
    title: input.title.trim(),
    body: input.body.trim(),
    leagueSlug: input.leagueSlug,
    author: user.name,
    createdAt: Date.now(),
    heat: Math.floor(80 + Math.random() * 200),
  };

  const all = listInsights();
  all.unshift(insight);
  localStorage.setItem(KEYS.insights, JSON.stringify(all));

  return { ok: true as const, insight };
}

/* ------------------ Comments ------------------ */

export function listComments(insightId: string): Comment[] {
  if (!canUseStorage()) return [];
  const all = safeParse<Comment[]>(localStorage.getItem(KEYS.comments), []);
  return all.filter(c => c.insightId === insightId);
}

export function addComment(insightId: string, body: string) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };

  const user = getSessionUser();
  if (!user) return { ok: false as const, error: "Login required" };

  const all = safeParse<Comment[]>(localStorage.getItem(KEYS.comments), []);
  const comment: Comment = {
    id: uid("c"),
    insightId,
    author: user.name,
    body: body.trim(),
    createdAt: Date.now(),
  };

  all.push(comment);
  localStorage.setItem(KEYS.comments, JSON.stringify(all));

  return { ok: true as const, comment };
}
