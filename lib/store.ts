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

export type Player = {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg: number;
  ft: number;
  tov: number;
  gp: number;
  adp: number;
  rank: number;
  trend: "up" | "down" | "same";
  injury?: string;
};

export type DraftPick = {
  id: string;
  odraftId: string;
  round: number;
  pick: number;
  playerId: string;
  teamId: string;
  timestamp: number;
};

export type DraftTeam = {
  id: string;
  draftId: string;
  name: string;
  isUser: boolean;
  picks: string[]; // player IDs
};

export type Draft = {
  id: string;
  name: string;
  userId: string;
  leagueId?: string;
  type: "snake" | "linear" | "auction";
  teams: number;
  rounds: number;
  userPosition: number;
  status: "setup" | "active" | "completed";
  currentRound: number;
  currentPick: number;
  createdAt: number;
  completedAt?: number;
};

export type MyTeam = {
  id: string;
  leagueId: string;
  userId: string;
  name: string;
  players: string[]; // player IDs
  createdAt: number;
};

export type WatchlistItem = {
  playerId: string;
  userId: string;
  addedAt: number;
  notes?: string;
};

const KEYS = {
  users: "bp_users",
  session: "bp_session",
  leagues: "bp_leagues",
  insights: "bp_insights",
  comments: "bp_comments",
  drafts: "bp_drafts",
  draftPicks: "bp_draft_picks",
  draftTeams: "bp_draft_teams",
  myTeams: "bp_my_teams",
  watchlist: "bp_watchlist",
  playerRankings: "bp_player_rankings",
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

/* ------------------ Players Data ------------------ */

const DEFAULT_PLAYERS: Player[] = [
  { id: "p1", name: "Nikola Jokic", team: "DEN", position: "C", age: 29, ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4, bpg: 0.9, fg: 58.3, ft: 81.7, tov: 3.0, gp: 79, adp: 1.2, rank: 1, trend: "same" },
  { id: "p2", name: "Luka Doncic", team: "DAL", position: "PG", age: 25, ppg: 33.9, rpg: 9.2, apg: 9.8, spg: 1.4, bpg: 0.5, fg: 48.7, ft: 78.6, tov: 4.0, gp: 70, adp: 2.1, rank: 2, trend: "same" },
  { id: "p3", name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", age: 25, ppg: 30.1, rpg: 5.5, apg: 6.2, spg: 2.0, bpg: 0.9, fg: 53.5, ft: 87.4, tov: 2.2, gp: 75, adp: 3.0, rank: 3, trend: "up" },
  { id: "p4", name: "Giannis Antetokounmpo", team: "MIL", position: "PF", age: 29, ppg: 30.4, rpg: 11.5, apg: 6.5, spg: 1.2, bpg: 1.1, fg: 61.1, ft: 65.7, tov: 3.4, gp: 73, adp: 3.8, rank: 4, trend: "same" },
  { id: "p5", name: "Victor Wembanyama", team: "SAS", position: "C", age: 20, ppg: 21.4, rpg: 10.6, apg: 3.9, spg: 1.2, bpg: 3.6, fg: 46.5, ft: 79.6, tov: 3.7, gp: 71, adp: 5.2, rank: 5, trend: "up" },
  { id: "p6", name: "Anthony Davis", team: "LAL", position: "PF", age: 31, ppg: 24.7, rpg: 12.6, apg: 3.5, spg: 1.2, bpg: 2.3, fg: 55.6, ft: 81.6, tov: 2.1, gp: 76, adp: 6.5, rank: 6, trend: "same", injury: "DTD" },
  { id: "p7", name: "Jayson Tatum", team: "BOS", position: "SF", age: 26, ppg: 26.9, rpg: 8.1, apg: 4.9, spg: 1.0, bpg: 0.6, fg: 47.1, ft: 83.3, tov: 2.5, gp: 74, adp: 7.1, rank: 7, trend: "down" },
  { id: "p8", name: "Tyrese Haliburton", team: "IND", position: "PG", age: 24, ppg: 20.1, rpg: 3.9, apg: 10.9, spg: 1.2, bpg: 0.7, fg: 47.7, ft: 85.5, tov: 2.4, gp: 69, adp: 7.8, rank: 8, trend: "down", injury: "Out" },
  { id: "p9", name: "Anthony Edwards", team: "MIN", position: "SG", age: 22, ppg: 25.9, rpg: 5.4, apg: 5.1, spg: 1.3, bpg: 0.5, fg: 46.1, ft: 83.6, tov: 2.8, gp: 79, adp: 9.2, rank: 9, trend: "up" },
  { id: "p10", name: "Kevin Durant", team: "PHX", position: "SF", age: 35, ppg: 27.1, rpg: 6.6, apg: 5.0, spg: 0.9, bpg: 1.2, fg: 52.3, ft: 85.6, tov: 3.3, gp: 75, adp: 10.0, rank: 10, trend: "same" },
  { id: "p11", name: "Donovan Mitchell", team: "CLE", position: "SG", age: 27, ppg: 26.6, rpg: 5.1, apg: 6.1, spg: 1.8, bpg: 0.4, fg: 46.2, ft: 86.4, tov: 2.8, gp: 55, adp: 11.5, rank: 11, trend: "up" },
  { id: "p12", name: "Chet Holmgren", team: "OKC", position: "C", age: 22, ppg: 16.5, rpg: 7.9, apg: 2.4, spg: 0.8, bpg: 2.3, fg: 53.0, ft: 79.0, tov: 1.7, gp: 82, adp: 12.3, rank: 12, trend: "up" },
  { id: "p13", name: "Jaylen Brown", team: "BOS", position: "SG", age: 27, ppg: 23.0, rpg: 5.5, apg: 3.6, spg: 1.2, bpg: 0.5, fg: 49.9, ft: 70.3, tov: 2.5, gp: 70, adp: 13.1, rank: 13, trend: "same" },
  { id: "p14", name: "Domantas Sabonis", team: "SAC", position: "C", age: 28, ppg: 19.4, rpg: 13.7, apg: 8.2, spg: 0.9, bpg: 0.5, fg: 59.6, ft: 73.2, tov: 3.4, gp: 82, adp: 14.5, rank: 14, trend: "same" },
  { id: "p15", name: "Trae Young", team: "ATL", position: "PG", age: 25, ppg: 25.7, rpg: 2.8, apg: 10.8, spg: 1.1, bpg: 0.2, fg: 43.0, ft: 85.3, tov: 4.4, gp: 54, adp: 15.2, rank: 15, trend: "down" },
  { id: "p16", name: "LaMelo Ball", team: "CHA", position: "PG", age: 23, ppg: 23.9, rpg: 5.1, apg: 8.0, spg: 1.3, bpg: 0.3, fg: 43.3, ft: 87.0, tov: 3.6, gp: 22, adp: 16.0, rank: 16, trend: "down", injury: "Out" },
  { id: "p17", name: "De'Aaron Fox", team: "SAC", position: "PG", age: 26, ppg: 26.6, rpg: 4.6, apg: 5.6, spg: 2.0, bpg: 0.4, fg: 46.5, ft: 73.8, tov: 2.6, gp: 74, adp: 17.3, rank: 17, trend: "up" },
  { id: "p18", name: "Kyrie Irving", team: "DAL", position: "PG", age: 32, ppg: 25.6, rpg: 5.0, apg: 5.2, spg: 1.3, bpg: 0.5, fg: 49.7, ft: 90.5, tov: 2.4, gp: 58, adp: 18.1, rank: 18, trend: "same" },
  { id: "p19", name: "Devin Booker", team: "PHX", position: "SG", age: 27, ppg: 27.1, rpg: 4.5, apg: 6.9, spg: 1.0, bpg: 0.4, fg: 49.2, ft: 86.8, tov: 2.9, gp: 68, adp: 19.5, rank: 19, trend: "same" },
  { id: "p20", name: "Ja Morant", team: "MEM", position: "PG", age: 25, ppg: 25.1, rpg: 5.6, apg: 8.1, spg: 0.8, bpg: 0.5, fg: 47.1, ft: 72.5, tov: 3.0, gp: 9, adp: 20.0, rank: 20, trend: "down", injury: "Out" },
  { id: "p21", name: "Bam Adebayo", team: "MIA", position: "C", age: 26, ppg: 19.3, rpg: 10.4, apg: 3.9, spg: 1.1, bpg: 0.9, fg: 52.0, ft: 72.0, tov: 2.7, gp: 71, adp: 21.2, rank: 21, trend: "same" },
  { id: "p22", name: "Pascal Siakam", team: "IND", position: "PF", age: 30, ppg: 21.3, rpg: 7.8, apg: 4.5, spg: 0.6, bpg: 0.6, fg: 54.0, ft: 78.0, tov: 2.4, gp: 75, adp: 22.5, rank: 22, trend: "up" },
  { id: "p23", name: "Scottie Barnes", team: "TOR", position: "SF", age: 22, ppg: 19.9, rpg: 8.2, apg: 6.1, spg: 1.3, bpg: 1.5, fg: 47.5, ft: 77.0, tov: 3.0, gp: 60, adp: 23.1, rank: 23, trend: "up" },
  { id: "p24", name: "Karl-Anthony Towns", team: "MIN", position: "C", age: 28, ppg: 21.8, rpg: 8.3, apg: 3.0, spg: 0.7, bpg: 0.7, fg: 50.4, ft: 87.3, tov: 2.9, gp: 62, adp: 24.0, rank: 24, trend: "same" },
  { id: "p25", name: "Jalen Brunson", team: "NYK", position: "PG", age: 27, ppg: 28.7, rpg: 3.6, apg: 6.7, spg: 0.9, bpg: 0.2, fg: 47.9, ft: 84.7, tov: 2.4, gp: 77, adp: 25.5, rank: 25, trend: "up" },
  { id: "p26", name: "Paul George", team: "PHI", position: "SF", age: 34, ppg: 22.6, rpg: 5.2, apg: 3.5, spg: 1.5, bpg: 0.4, fg: 47.1, ft: 90.7, tov: 2.6, gp: 74, adp: 26.2, rank: 26, trend: "down" },
  { id: "p27", name: "Lauri Markkanen", team: "UTA", position: "PF", age: 27, ppg: 23.2, rpg: 8.2, apg: 2.0, spg: 0.6, bpg: 0.6, fg: 48.0, ft: 89.9, tov: 1.9, gp: 55, adp: 27.0, rank: 27, trend: "same" },
  { id: "p28", name: "Jaren Jackson Jr.", team: "MEM", position: "PF", age: 24, ppg: 22.5, rpg: 5.5, apg: 2.3, spg: 1.0, bpg: 1.6, fg: 45.4, ft: 81.0, tov: 2.4, gp: 66, adp: 28.3, rank: 28, trend: "same" },
  { id: "p29", name: "Franz Wagner", team: "ORL", position: "SF", age: 22, ppg: 19.7, rpg: 5.3, apg: 3.7, spg: 1.1, bpg: 0.5, fg: 48.0, ft: 85.0, tov: 2.0, gp: 72, adp: 29.1, rank: 29, trend: "up" },
  { id: "p30", name: "LeBron James", team: "LAL", position: "SF", age: 39, ppg: 25.7, rpg: 7.3, apg: 8.3, spg: 1.3, bpg: 0.5, fg: 54.0, ft: 75.0, tov: 3.5, gp: 71, adp: 30.0, rank: 30, trend: "down" },
];

export function getPlayers(): Player[] {
  if (!canUseStorage()) return DEFAULT_PLAYERS;
  const custom = safeParse<Player[]>(localStorage.getItem(KEYS.playerRankings), []);
  if (custom.length > 0) return custom;
  return DEFAULT_PLAYERS;
}

export function getPlayerById(id: string): Player | undefined {
  return getPlayers().find(p => p.id === id);
}

export function updatePlayerRanking(playerId: string, newRank: number) {
  if (!canUseStorage()) return { ok: false as const };
  const players = getPlayers();
  const idx = players.findIndex(p => p.id === playerId);
  if (idx === -1) return { ok: false as const };
  players[idx].rank = newRank;
  players.sort((a, b) => a.rank - b.rank);
  localStorage.setItem(KEYS.playerRankings, JSON.stringify(players));
  return { ok: true as const };
}

/* ------------------ Watchlist ------------------ */

export function getWatchlist(): WatchlistItem[] {
  if (!canUseStorage()) return [];
  const user = getSessionUser();
  if (!user) return [];
  const all = safeParse<WatchlistItem[]>(localStorage.getItem(KEYS.watchlist), []);
  return all.filter(w => w.userId === user.id);
}

export function addToWatchlist(playerId: string, notes?: string) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };
  const user = getSessionUser();
  if (!user) return { ok: false as const, error: "Login required" };

  const all = safeParse<WatchlistItem[]>(localStorage.getItem(KEYS.watchlist), []);
  if (all.some(w => w.playerId === playerId && w.userId === user.id)) {
    return { ok: false as const, error: "Already in watchlist" };
  }

  all.push({ playerId, userId: user.id, addedAt: Date.now(), notes });
  localStorage.setItem(KEYS.watchlist, JSON.stringify(all));
  return { ok: true as const };
}

export function removeFromWatchlist(playerId: string) {
  if (!canUseStorage()) return { ok: false as const };
  const user = getSessionUser();
  if (!user) return { ok: false as const };

  let all = safeParse<WatchlistItem[]>(localStorage.getItem(KEYS.watchlist), []);
  all = all.filter(w => !(w.playerId === playerId && w.userId === user.id));
  localStorage.setItem(KEYS.watchlist, JSON.stringify(all));
  return { ok: true as const };
}

/* ------------------ Drafts ------------------ */

export function listDrafts(): Draft[] {
  if (!canUseStorage()) return [];
  const user = getSessionUser();
  if (!user) return [];
  const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
  return all.filter(d => d.userId === user.id);
}

export function getDraftById(id: string): Draft | null {
  const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
  return all.find(d => d.id === id) ?? null;
}

export function createDraft(input: {
  name: string;
  type: "snake" | "linear" | "auction";
  teams: number;
  rounds: number;
  userPosition: number;
  leagueId?: string;
}) {
  if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };
  const user = getSessionUser();
  if (!user) return { ok: false as const, error: "Login required" };

  const draft: Draft = {
    id: uid("draft"),
    name: input.name,
    userId: user.id,
    leagueId: input.leagueId,
    type: input.type,
    teams: input.teams,
    rounds: input.rounds,
    userPosition: input.userPosition,
    status: "active",
    currentRound: 1,
    currentPick: 1,
    createdAt: Date.now(),
  };

  const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
  all.push(draft);
  localStorage.setItem(KEYS.drafts, JSON.stringify(all));

  return { ok: true as const, draft };
}

export function updateDraft(id: string, updates: Partial<Draft>) {
  if (!canUseStorage()) return { ok: false as const };
  const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
  const idx = all.findIndex(d => d.id === id);
  if (idx === -1) return { ok: false as const };
  all[idx] = { ...all[idx], ...updates };
  localStorage.setItem(KEYS.drafts, JSON.stringify(all));
  return { ok: true as const, draft: all[idx] };
}

export function getDraftPicks(draftId: string): DraftPick[] {
  if (!canUseStorage()) return [];
  const all = safeParse<DraftPick[]>(localStorage.getItem(KEYS.draftPicks), []);
  return all.filter(p => p.odraftId === draftId);
}

export function addDraftPick(draftId: string, playerId: string, teamId: string, round: number, pick: number) {
  if (!canUseStorage()) return { ok: false as const };

  const draftPick: DraftPick = {
    id: uid("pick"),
    odraftId: draftId,
    playerId,
    teamId,
    round,
    pick,
    timestamp: Date.now(),
  };

  const all = safeParse<DraftPick[]>(localStorage.getItem(KEYS.draftPicks), []);
  all.push(draftPick);
  localStorage.setItem(KEYS.draftPicks, JSON.stringify(all));
  return { ok: true as const, pick: draftPick };
}

/* ------------------ My Teams ------------------ */

export function getMyTeams(): MyTeam[] {
  if (!canUseStorage()) return [];
  const user = getSessionUser();
  if (!user) return [];
  const all = safeParse<MyTeam[]>(localStorage.getItem(KEYS.myTeams), []);
  return all.filter(t => t.userId === user.id);
}

export function createMyTeam(leagueId: string, name: string): { ok: true; team: MyTeam } | { ok: false; error: string } {
  if (!canUseStorage()) return { ok: false, error: "Storage unavailable" };
  const user = getSessionUser();
  if (!user) return { ok: false, error: "Login required" };

  const team: MyTeam = {
    id: uid("team"),
    leagueId,
    userId: user.id,
    name,
    players: [],
    createdAt: Date.now(),
  };

  const all = safeParse<MyTeam[]>(localStorage.getItem(KEYS.myTeams), []);
  all.push(team);
  localStorage.setItem(KEYS.myTeams, JSON.stringify(all));
  return { ok: true, team };
}

export function addPlayerToTeam(teamId: string, playerId: string) {
  if (!canUseStorage()) return { ok: false as const };
  const all = safeParse<MyTeam[]>(localStorage.getItem(KEYS.myTeams), []);
  const idx = all.findIndex(t => t.id === teamId);
  if (idx === -1) return { ok: false as const };
  if (!all[idx].players.includes(playerId)) {
    all[idx].players.push(playerId);
    localStorage.setItem(KEYS.myTeams, JSON.stringify(all));
  }
  return { ok: true as const };
}

export function removePlayerFromTeam(teamId: string, playerId: string) {
  if (!canUseStorage()) return { ok: false as const };
  const all = safeParse<MyTeam[]>(localStorage.getItem(KEYS.myTeams), []);
  const idx = all.findIndex(t => t.id === teamId);
  if (idx === -1) return { ok: false as const };
  all[idx].players = all[idx].players.filter(p => p !== playerId);
  localStorage.setItem(KEYS.myTeams, JSON.stringify(all));
  return { ok: true as const };
}


