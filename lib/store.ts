// lib/store.ts
/* =========================================================
   Blueprint Fantasy — Merged Store
   - Users, Insights, Leagues, Comments → Supabase
   - Drafts, Watchlist, MyTeams, Players → localStorage
   ========================================================= */

   import { supabase } from "./supabase";
   export { supabase };
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
     name: string;
     created_at: string;
     // Optional fields depending on schema/version
     slug?: string;
     visibility?: "public" | "private";
     owner_id?: string;
     commissioner_id?: string;
     season?: string;
     status?: "draft_pending" | "drafting" | "active" | "completed";
     max_teams?: number;
     draft_type?: "snake" | "linear";
     scoring_type?: string;
   };
   
   export type Insight = {
     id: string;
     title: string;
     body: string;
     league_slug?: string;
     cover_url?: string;
     images?: string[];      // 多图支持
     tags?: string[];
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
   
   export async function logout() {
     if (typeof window === "undefined") return;
     await supabase.auth.signOut();
     localStorage.removeItem(SESSION_KEY);
   }
   
   // ==================== Auth (Supabase Auth) ====================
   
   export async function signup(name: string, email: string, password: string) {
     const username = email.split("@")[0];
   
     const { data: authData, error: authError } = await supabase.auth.signUp({
       email,
       password,
       options: {
         data: { name, username },
       },
     });
   
     if (authError) {
       return { ok: false as const, error: authError.message };
     }
   
     const authUser = authData.user;
     if (!authUser || !authData.session) {
       return {
         ok: false as const,
         error:
           "Signup requires email confirmation. Please check your inbox, then log in.",
       };
     }
   
     const { data: newUser, error: userError } = await supabase
       .from("users")
       .insert({
         id: authUser.id,
         name,
         email,
         username,
       })
       .select()
       .single();
   
     if (userError) {
       // If the email already exists in users, recover by linking to the auth user.
       const { data: existingByEmail } = await supabase
         .from("users")
         .select("*")
         .eq("email", email)
         .single();
   
       if (existingByEmail) {
         if (existingByEmail.id !== authUser.id) {
           const { error: relinkError } = await supabase
             .from("users")
             .update({
               id: authUser.id,
               name,
               username,
             })
             .eq("email", email);
   
           if (relinkError) {
             return { ok: false as const, error: "User exists but could not link to Auth user." };
           }
   
           const { data: relinkedUser } = await supabase
             .from("users")
             .select("*")
             .eq("id", authUser.id)
             .single();
   
           if (relinkedUser) {
             setSessionUser(relinkedUser);
             return { ok: true as const, user: relinkedUser };
           }
         } else {
           setSessionUser(existingByEmail);
           return { ok: true as const, user: existingByEmail };
         }
       }
   
       return { ok: false as const, error: userError.message };
     }
   
     setSessionUser(newUser);
     return { ok: true as const, user: newUser };
   }
   
   export async function login(email: string, password: string) {
     const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
   
     if (authError) {
       return { ok: false as const, error: "Invalid credentials" };
     }
   
     const authUser = authData.user;
     if (!authUser) {
       return { ok: false as const, error: "User not found" };
     }
   
     const { data: user, error: userError } = await supabase
       .from("users")
       .select("*")
       .eq("id", authUser.id)
       .single();
   
     if (userError || !user) {
       // If profile missing, try to recover by email
       const { data: existingByEmail } = await supabase
         .from("users")
         .select("*")
         .eq("email", email)
         .single();
   
       if (existingByEmail) {
         if (existingByEmail.id !== authUser.id) {
           const username = email.split("@")[0];
           const { error: relinkError } = await supabase
             .from("users")
             .update({
               id: authUser.id,
               name: authUser.user_metadata?.name || existingByEmail.name || username,
               username: authUser.user_metadata?.username || existingByEmail.username || username,
             })
             .eq("email", email);
   
           if (relinkError) {
             return { ok: false as const, error: "User profile could not be linked." };
           }
         }
   
         const { data: relinkedUser } = await supabase
           .from("users")
           .select("*")
           .eq("id", authUser.id)
           .single();
   
         if (relinkedUser) {
           setSessionUser(relinkedUser);
           return { ok: true as const, user: relinkedUser };
         }
       }
   
       const username = email.split("@")[0];
       const { data: createdUser, error: createError } = await supabase
         .from("users")
         .insert({
           id: authUser.id,
           name: authUser.user_metadata?.name || username,
           email,
           username: authUser.user_metadata?.username || username,
         })
         .select()
         .single();
   
       if (createError || !createdUser) {
         return { ok: false as const, error: "User profile not found" };
       }
   
       setSessionUser(createdUser);
       return { ok: true as const, user: createdUser };
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
     cover_url?: string;
     images?: string[];      // 多图支持
     tags?: string[];
   }) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const { data, error } = await supabase
       .from("insights")
       .insert({
         title: input.title.trim(),
         body: input.body.trim(),
         league_slug: input.league_slug,
         cover_url: input.cover_url,
         images: input.images,      // 多图支持
         tags: input.tags,
         author_id: user.id,
         heat: 0,  // 初始点赞数为 0
       })
       .select(`*, author:users(id, name, username, avatar_url)`)
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const, insight: data };
   }
   
   // 删除帖子（只有作者可以删除）
   export async function deleteInsight(insightId: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     // 先检查是否是作者
     const { data: insight } = await supabase
       .from("insights")
       .select("author_id")
       .eq("id", insightId)
       .single();
   
     if (!insight || insight.author_id !== user.id) {
       return { ok: false as const, error: "Permission denied" };
     }
   
     // 删除帖子（相关评论会因为外键约束自动删除，或者手动删除）
     const { error: deleteCommentsError } = await supabase
       .from("comments")
       .delete()
       .eq("insight_id", insightId);
   
     const { error } = await supabase
       .from("insights")
       .delete()
       .eq("id", insightId);
   
     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const };
   }
   
   // 点赞帖子
   export async function likeInsight(insightId: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     // 检查是否已点赞
     const likedKey = `bp_liked_${user.id}`;
     const liked = JSON.parse(localStorage.getItem(likedKey) || "[]");
     
     if (liked.includes(insightId)) {
       return { ok: false as const, error: "Already liked" };
     }
   
     // 更新数据库 heat + 1
     const { data, error } = await supabase.rpc('increment_heat', { insight_id: insightId });
     
     // 如果没有 rpc 函数，用普通更新
     if (error) {
       // 先获取当前 heat
       const { data: insight } = await supabase
         .from("insights")
         .select("heat")
         .eq("id", insightId)
         .single();
       
       if (insight) {
         const { error: updateError } = await supabase
           .from("insights")
           .update({ heat: (insight.heat || 0) + 1 })
           .eq("id", insightId);
         
         if (updateError) {
           return { ok: false as const, error: updateError.message };
         }
       }
     }
   
     // 保存到本地
     liked.push(insightId);
     localStorage.setItem(likedKey, JSON.stringify(liked));
     
     return { ok: true as const };
   }
   
   // 取消点赞
   export async function unlikeInsight(insightId: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const likedKey = `bp_liked_${user.id}`;
     const liked = JSON.parse(localStorage.getItem(likedKey) || "[]");
     
     if (!liked.includes(insightId)) {
       return { ok: false as const, error: "Not liked" };
     }
   
     // 更新数据库 heat - 1
     const { data: insight } = await supabase
       .from("insights")
       .select("heat")
       .eq("id", insightId)
       .single();
     
     if (insight) {
       const { error: updateError } = await supabase
         .from("insights")
         .update({ heat: Math.max(0, (insight.heat || 0) - 1) })
         .eq("id", insightId);
       
       if (updateError) {
         return { ok: false as const, error: updateError.message };
       }
     }
   
     // 从本地移除
     const newLiked = liked.filter((id: string) => id !== insightId);
     localStorage.setItem(likedKey, JSON.stringify(newLiked));
     
     return { ok: true as const };
   }
   
   // 检查是否已点赞
   export function isInsightLiked(insightId: string): boolean {
     const user = getSessionUser();
     if (!user) return false;
     
     const likedKey = `bp_liked_${user.id}`;
     const liked = JSON.parse(localStorage.getItem(likedKey) || "[]");
     return liked.includes(insightId);
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
   
   // 删除评论
   // - 如果是评论作者删除：从数据库删除，所有人都看不到
   // - 如果是其他用户删除：只在本地隐藏，存到 localStorage
   export async function deleteComment(commentId: string, commentAuthorId: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     // 如果是评论作者，真正删除
     if (user.id === commentAuthorId) {
       const { error } = await supabase
         .from("comments")
         .delete()
         .eq("id", commentId);
   
       if (error) {
         return { ok: false as const, error: error.message };
       }
       return { ok: true as const, type: "deleted" as const };
     }
   
     // 如果不是作者，只在本地隐藏
     const hiddenKey = "bp_hidden_comments";
     const hidden = JSON.parse(localStorage.getItem(hiddenKey) || "[]");
     if (!hidden.includes(commentId)) {
       hidden.push(commentId);
       localStorage.setItem(hiddenKey, JSON.stringify(hidden));
     }
     return { ok: true as const, type: "hidden" as const };
   }
   
   // 获取本地隐藏的评论 ID 列表
   export function getHiddenComments(): string[] {
     if (typeof window === "undefined") return [];
     return JSON.parse(localStorage.getItem("bp_hidden_comments") || "[]");
   }
   
   // ==================== Leagues (Supabase) ====================
   
   function normalizeLeague(raw: any): League {
     return {
       ...raw,
       slug: raw?.slug || raw?.id,
       owner_id: raw?.owner_id || raw?.commissioner_id,
       visibility: raw?.visibility || "public",
       max_teams: raw?.max_teams ?? 10,
     } as League;
   }

   export async function listLeagues(): Promise<League[]> {
     const { data, error } = await supabase
       .from("leagues")
       .select("*")
       .order("created_at", { ascending: false });
     if (error) return [];
     return (data || []).map(normalizeLeague);
   }
   
   export async function getLeagueBySlug(slug: string): Promise<League | null> {
     // Prefer id match (current routing uses id)
     const byId = await supabase
       .from("leagues")
       .select("*")
       .eq("id", slug)
       .single();
     if (byId.data && !byId.error) return normalizeLeague(byId.data);

     const { data, error } = await supabase
       .from("leagues")
       .select("*")
       .eq("slug", slug)
       .single();
     if (error || !data) return null;
     return normalizeLeague(data);
   }
   
   export async function createLeague(input: {
     name: string;
     visibility: "public" | "private";
   }) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };
   
     const { data, error } = await supabase
       .from("leagues")
       .insert({
         name: input.name.trim(),
         commissioner_id: user.id,
         max_teams: 10,
         draft_type: "snake",
         status: "draft_pending",
       })
       .select()
       .single();
   
     if (error) {
       return { ok: false as const, error: error.message };
     }

     return { ok: true as const, league: normalizeLeague(data) };
   }

   // 联赛成员类型
   export type LeagueMember = {
     id: string;
     league_id: string;
     user_id: string;
     role: "owner" | "member";
     joined_at: string;
     team_name?: string;
     draft_position?: number;
     user?: Pick<User, "id" | "name" | "username" | "avatar_url">;
   };

   // 获取联赛成员列表
   export async function getLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
     const { data: league } = await supabase
       .from("leagues")
       .select("commissioner_id, owner_id")
       .eq("id", leagueId)
       .single();
     const ownerId = (league as any)?.owner_id || (league as any)?.commissioner_id;

     const { data: teams, error } = await supabase
       .from("teams")
       .select("*")
       .eq("league_id", leagueId)
       .order("draft_position", { ascending: true });
     
     if (error || !teams) return [];

     const userIds = teams.map((t: any) => t.user_id);
     const { data: users } = userIds.length
       ? await supabase
           .from("users")
           .select("id, name, username, avatar_url")
           .in("id", userIds)
       : { data: [] as User[] };
     
     return teams.map((team: any) => ({
       id: team.id,
       league_id: team.league_id,
       user_id: team.user_id,
       role: team.user_id === ownerId ? "owner" : "member",
       joined_at: team.created_at,
       team_name: team.team_name,
       draft_position: team.draft_position,
       user: users?.find((u) => u.id === team.user_id) || undefined,
     }));
   }

   // 获取联赛成员数量
   export async function getLeagueMemberCount(leagueId: string): Promise<number> {
     const { count, error } = await supabase
       .from("teams")
       .select("*", { count: "exact", head: true })
       .eq("league_id", leagueId);
     if (error) return 0;
     return count || 0;
   }

   // 检查用户是否已加入联赛
   export async function isLeagueMember(leagueId: string): Promise<boolean> {
     const user = getSessionUser();
     if (!user) return false;

     const { data, error } = await supabase
       .from("teams")
       .select("id")
       .eq("league_id", leagueId)
       .eq("user_id", user.id)
       .single();

     return !!data && !error;
   }

   // 加入联赛（创建队伍）
   export async function joinLeague(leagueId: string, teamName?: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };

     const isMember = await isLeagueMember(leagueId);
     if (isMember) {
       return { ok: false as const, error: "Already a member" };
     }

     const { data: league } = await supabase
       .from("leagues")
       .select("max_teams")
       .eq("id", leagueId)
       .single();
     const maxTeams = (league as any)?.max_teams || 10;

     const { count } = await supabase
       .from("teams")
       .select("*", { count: "exact", head: true })
       .eq("league_id", leagueId);

     if ((count || 0) >= maxTeams) {
       return { ok: false as const, error: "League is full" };
     }

     const defaultName =
       teamName?.trim() ||
       (user.username ? `${user.username}` : user.name ? `${user.name}` : "My Team");

     const { data, error } = await supabase
       .from("teams")
       .insert({
         league_id: leagueId,
         user_id: user.id,
         team_name: defaultName,
         draft_position: (count || 0) + 1,
       })
       .select()
       .single();

     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const, member: data };
   }

   // 退出联赛
   export async function leaveLeague(leagueId: string) {
     const user = getSessionUser();
     if (!user) return { ok: false as const, error: "Login required" };

     const { error } = await supabase
       .from("teams")
       .delete()
       .eq("league_id", leagueId)
       .eq("user_id", user.id);

     if (error) {
       return { ok: false as const, error: error.message };
     }
     return { ok: true as const };
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
