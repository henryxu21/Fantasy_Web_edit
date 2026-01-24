// lib/store.ts
/* =========================================================
   Blueprint Fantasy — Merged Store
   - Users, Insights, Leagues, Comments → Supabase
   - Drafts, Watchlist, MyTeams, Players → localStorage
   ========================================================= */

   import { supabase } from "./supabase";
   import { ALL_PLAYERS } from "./players-data";
   
   // ==================== Types ====================
   
   export type User = {
     id: string;
     name: string;
     email: string;
     username: string;
     avatar_url?: string;
   };
   
   export type League = {
     id: string;
     slug: string;
     name: string;
     owner_id: string;
     visibility: "public" | "private";
     created_at: string;
   };
   
   export type Insight = {
     id: string;
     title: string;
     body: string;
     league_slug?: string;
     cover_url?: string;    // 新增
     tags?: string[];       // 新增
     author_id: string;
     author?: User;
     heat: number;
     created_at: string;
   };
   
   export type Comment = {
     id: string;
     insight_id: string;
     author_id: string;
     author?: User;
     body: string;
     created_at: string;
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
     picks: string[];
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
     players: string[];
     createdAt: number;
   };
   
   export type WatchlistItem = {
     playerId: string;
     userId: string;
     addedAt: number;
     notes?: string;
   };
   
   // ==================== LocalStorage Keys ====================
   
   const KEYS = {
     users: "bp_users",
     session: "bp_session",
     drafts: "bp_drafts",
     draftPicks: "bp_draft_picks",
     draftTeams: "bp_draft_teams",
     myTeams: "bp_my_teams",
     watchlist: "bp_watchlist",
     playerRankings: "bp_player_rankings",
   };
   
   // ==================== Utils ====================
   
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
   
   // ==================== Session (localStorage) ====================
   
   const SESSION_KEY = "bp_session";
   
   export function getSessionUser(): User | null {
     if (typeof window === "undefined") return null;
     const raw = localStorage.getItem(SESSION_KEY);
     if (!raw) return null;
     try {
       return JSON.parse(raw) as User;
     } catch {
       return null;
     }
   }
   
   function setSessionUser(user: User) {
     if (typeof window === "undefined") return;
     localStorage.setItem(SESSION_KEY, JSON.stringify(user));
   }
   
   export function logout() {
     if (typeof window === "undefined") return;
     localStorage.removeItem(SESSION_KEY);
   }
   
   // ==================== Auth (Supabase + localStorage for password) ====================
   
   export async function signup(name: string, email: string, password: string) {
     const { data: existingUser } = await supabase
       .from("users")
       .select("id")
       .eq("email", email)
       .single();
   
     if (existingUser) {
       return { ok: false as const, error: "Email already exists" };
     }
   
     const username = email.split("@")[0];
     const { data: newUser, error } = await supabase
       .from("users")
       .insert({ name, email, username })
       .select()
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
   
     // Store password in localStorage (simplified, use Supabase Auth in production)
     const users = JSON.parse(localStorage.getItem("bp_users") || "[]");
     users.push({ id: newUser.id, email, password });
     localStorage.setItem("bp_users", JSON.stringify(users));
   
     setSessionUser(newUser);
     return { ok: true as const, user: newUser };
   }
   
   export async function login(email: string, password: string) {
     const users = JSON.parse(localStorage.getItem("bp_users") || "[]");
     const storedUser = users.find((u: any) => u.email === email);
   
     if (!storedUser || storedUser.password !== password) {
       return { ok: false as const, error: "Invalid credentials" };
     }
   
     const { data: user, error } = await supabase
       .from("users")
       .select("*")
       .eq("email", email)
       .single();
   
     if (error || !user) {
       return { ok: false as const, error: "User not found" };
     }
   
     setSessionUser(user);
     return { ok: true as const, user };
   }
   
   // ==================== Users (Supabase) ====================
   
   export async function getUserById(id: string): Promise<User | null> {
     const { data, error } = await supabase
       .from("users")
       .select("*")
       .eq("id", id)
       .single();
     if (error) return null;
     return data;
   }
   
   export async function getUserByUsername(username: string): Promise<User | null> {
     const { data, error } = await supabase
       .from("users")
       .select("*")
       .eq("username", username)
       .single();
     if (error) return null;
     return data;
   }
   
   // ==================== Image Upload (Supabase Storage) ====================
   
   export async function uploadImage(
     file: File,
     folder: string = "images"
   ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
     const user = getSessionUser();
     if (!user) return { ok: false, error: "Login required" };
   
     // 生成唯一文件名
     const ext = file.name.split(".").pop() || "jpg";
     const fileName = `${folder}/${user.id}_${Date.now()}.${ext}`;
   
     // 上传到 Supabase Storage
     const { data, error } = await supabase.storage
       .from("images")
       .upload(fileName, file, {
         cacheControl: "3600",
         upsert: false,
       });
   
     if (error) {
       console.error("Upload error:", error);
       return { ok: false, error: error.message };
     }
   
     // 获取公开 URL
     const { data: urlData } = supabase.storage
       .from("images")
       .getPublicUrl(data.path);
   
     return { ok: true, url: urlData.publicUrl };
   }
   
   // ==================== Insights (Supabase) ====================
   
   export async function listInsights(): Promise<Insight[]> {
     const { data, error } = await supabase
       .from("insights")
       .select(`*, author:users(id, name, username, avatar_url)`)
       .order("created_at", { ascending: false });
     if (error) {
       console.error("Error fetching insights:", error);
       return [];
     }
     return data || [];
   }
   
   export async function getInsightById(id: string): Promise<Insight | null> {
     const { data, error } = await supabase
       .from("insights")
       .select(`*, author:users(id, name, username, avatar_url)`)
       .eq("id", id)
       .single();
     if (error) return null;
     return data;
   }
   
   export async function createInsight(input: {
     title: string;
     body: string;
     league_slug?: string;
     cover_url?: string;    // 新增
     tags?: string[];       // 新增
   }) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const { data, error } = await supabase
       .from("insights")
       .insert({
         title: input.title.trim(),
         body: input.body.trim(),
         league_slug: input.league_slug,
         cover_url: input.cover_url,     // 新增
         tags: input.tags,               // 新增
         author_id: user.id,
         heat: Math.floor(80 + Math.random() * 200),
       })
       .select(`*, author:users(id, name, username, avatar_url)`)
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const, insight: data };
   }
   
   // ==================== Comments (Supabase) ====================
   
   export async function listComments(insightId: string): Promise<Comment[]> {
     const { data, error } = await supabase
       .from("comments")
       .select(`*, author:users(id, name, username, avatar_url)`)
       .eq("insight_id", insightId)
       .order("created_at", { ascending: true });
     if (error) return [];
     return data || [];
   }
   
   export async function addComment(insightId: string, body: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const { data, error } = await supabase
       .from("comments")
       .insert({
         insight_id: insightId,
         author_id: user.id,
         body: body.trim(),
       })
       .select(`*, author:users(id, name, username, avatar_url)`)
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const, comment: data };
   }
   
   // ==================== Leagues (Supabase) ====================
   
   export async function listLeagues(): Promise<League[]> {
     const { data, error } = await supabase
       .from("leagues")
       .select("*")
       .order("created_at", { ascending: false });
     if (error) return [];
     return data || [];
   }
   
   export async function getLeagueBySlug(slug: string): Promise<League | null> {
     const { data, error } = await supabase
       .from("leagues")
       .select("*")
       .eq("slug", slug)
       .single();
     if (error) return null;
     return data;
   }
   
   export async function createLeague(input: {
     name: string;
     visibility: "public" | "private";
   }) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const slug = input.name
       .trim()
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, "-")
       .replace(/^-+|-+$/g, "")
       .slice(0, 40);
   
     const { data, error } = await supabase
       .from("leagues")
       .insert({
         name: input.name.trim(),
         slug,
         owner_id: user.id,
         visibility: input.visibility,
       })
       .select()
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const, league: data };
   }
   
   // ==================== Stats (Supabase) ====================
   
   export async function getStats() {
     const [insightsRes, leaguesRes, usersRes] = await Promise.all([
       supabase.from("insights").select("id", { count: "exact", head: true }),
       supabase.from("leagues").select("id", { count: "exact", head: true }),
       supabase.from("users").select("id", { count: "exact", head: true }),
     ]);
   
     return {
       insightsCount: insightsRes.count || 0,
       leaguesCount: leaguesRes.count || 0,
       usersCount: usersRes.count || 0,
     };
   }
   
   // ==================== Players (localStorage) ====================
   
   const DEFAULT_PLAYERS: Player[] = ALL_PLAYERS as Player[];
   
   export function getPlayers(): Player[] {
     if (!canUseStorage()) return DEFAULT_PLAYERS;
     const custom = safeParse<Player[]>(localStorage.getItem(KEYS.playerRankings), []);
     if (custom.length > 0) return custom;
     return DEFAULT_PLAYERS;
   }
   
   export function getPlayerById(id: string): Player | undefined {
     return getPlayers().find((p) => p.id === id);
   }
   
   export function updatePlayerRanking(playerId: string, newRank: number) {
     if (!canUseStorage()) return { ok: false as const };
     const players = getPlayers();
     const idx = players.findIndex((p) => p.id === playerId);
     if (idx === -1) return { ok: false as const };
     players[idx].rank = newRank;
     players.sort((a, b) => a.rank - b.rank);
     localStorage.setItem(KEYS.playerRankings, JSON.stringify(players));
     return { ok: true as const };
   }
   
   // ==================== Watchlist (localStorage) ====================
   
   export function getWatchlist(): WatchlistItem[] {
     if (!canUseStorage()) return [];
     const user = getSessionUser();
     if (!user) return [];
     const all = safeParse<WatchlistItem[]>(localStorage.getItem(KEYS.watchlist), []);
     return all.filter((w) => w.userId === user.id);
   }
   
   export function addToWatchlist(playerId: string, notes?: string) {
     if (!canUseStorage()) return { ok: false as const, error: "Storage unavailable" };
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const all = safeParse<WatchlistItem[]>(localStorage.getItem(KEYS.watchlist), []);
     if (all.some((w) => w.playerId === playerId && w.userId === user.id)) {
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
     all = all.filter((w) => !(w.playerId === playerId && w.userId === user.id));
     localStorage.setItem(KEYS.watchlist, JSON.stringify(all));
     return { ok: true as const };
   }
   
   // ==================== Drafts (localStorage) ====================
   
   export function listDrafts(): Draft[] {
     if (!canUseStorage()) return [];
     const user = getSessionUser();
     if (!user) return [];
     const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
     return all.filter((d) => d.userId === user.id);
   }
   
   export function getDraftById(id: string): Draft | null {
     if (!canUseStorage()) return null;
     const all = safeParse<Draft[]>(localStorage.getItem(KEYS.drafts), []);
     return all.find((d) => d.id === id) ?? null;
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
     const idx = all.findIndex((d) => d.id === id);
     if (idx === -1) return { ok: false as const };
     all[idx] = { ...all[idx], ...updates };
     localStorage.setItem(KEYS.drafts, JSON.stringify(all));
     return { ok: true as const, draft: all[idx] };
   }
   
   export function getDraftPicks(draftId: string): DraftPick[] {
     if (!canUseStorage()) return [];
     const all = safeParse<DraftPick[]>(localStorage.getItem(KEYS.draftPicks), []);
     return all.filter((p) => p.odraftId === draftId);
   }
   
   export function addDraftPick(
     draftId: string,
     playerId: string,
     teamId: string,
     round: number,
     pick: number
   ) {
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
   
   // ==================== My Teams (localStorage) ====================
   
   export function getMyTeams(): MyTeam[] {
     if (!canUseStorage()) return [];
     const user = getSessionUser();
     if (!user) return [];
     const all = safeParse<MyTeam[]>(localStorage.getItem(KEYS.myTeams), []);
     return all.filter((t) => t.userId === user.id);
   }
   
   export function createMyTeam(
     leagueId: string,
     name: string
   ): { ok: true; team: MyTeam } | { ok: false; error: string } {
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
     const idx = all.findIndex((t) => t.id === teamId);
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
     const idx = all.findIndex((t) => t.id === teamId);
     if (idx === -1) return { ok: false as const };
     all[idx].players = all[idx].players.filter((p) => p !== playerId);
     localStorage.setItem(KEYS.myTeams, JSON.stringify(all));
     return { ok: true as const };
   }