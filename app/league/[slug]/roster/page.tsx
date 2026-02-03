"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, getLeagueBySlug, getPlayers, type League } from "@/lib/store";
import { supabase, type Team } from "@/lib/supabase";

function LeagueNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const { t } = useLang();
  const mainNav = [
    { href: `/league/${slug}`, label: t("联赛主页", "League Home"), icon: "🏠" },
    { href: `/league/${slug}/standings`, label: t("排行榜", "Standings"), icon: "🏆" },
    { href: `/league/${slug}/scoreboard`, label: t("记分板", "Scoreboard"), icon: "📊" },
    { href: `/league/${slug}/schedule`, label: t("赛程表", "Schedule"), icon: "📅" },
    { href: `/league/${slug}/board`, label: t("讨论区", "Message Board"), icon: "💬" },
    { href: `/league/${slug}/members`, label: t("成员", "Members"), icon: "👥" },
    { href: `/league/${slug}/roster`, label: t("阵容", "Roster"), icon: "🧩" },
  ];
  if (isOwner) {
    mainNav.push({ href: `/league/${slug}/settings`, label: t("设置", "Settings"), icon: "⚙️" });
  }

  return (
    <nav className="league-nav">
      <div className="league-nav-inner">
        {mainNav.map((item) => (
          <Link key={item.href} href={item.href} className={`league-nav-link ${item.href.includes('/roster') ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

const MAX_ROSTER = 13;

export default function RosterPage() {
  const { t } = useLang();
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [rosteredIds, setRosteredIds] = useState<(number | string)[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
    load();
  }, [slug]);

  async function load() {
    setLoading(true);
    setError(null);
    const leagueData = await getLeagueBySlug(slug);
    if (!leagueData) {
      setLoading(false);
      return;
    }
    setLeague(leagueData);

    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .eq("league_id", leagueData.id)
      .order("draft_position", { ascending: true });

    const teamsList = teamsData || [];
    setTeams(teamsList);

    const sessionUser = getSessionUser();
    if (sessionUser) {
      const team = teamsList.find((t) => t.user_id === sessionUser.id) || null;
      setMyTeam(team);
      if (team) {
        const { data: rosterData } = await supabase
          .from("team_rosters")
          .select("*")
          .eq("team_id", team.id)
          .order("acquired_at", { ascending: false });
        setRoster(rosterData || []);
      }
    }

    // rostered ids across league
    const teamIds = teamsList.map((t) => t.id);
    if (teamIds.length) {
      const { data: rostered } = await supabase
        .from("team_rosters")
        .select("player_id")
        .in("team_id", teamIds);
      setRosteredIds((rostered || []).map((r: any) => r.player_id));
    } else {
      setRosteredIds([]);
    }

    setLoading(false);
  }

  const players = useMemo(() => getPlayers(), []);
  const availablePlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players
      .filter((p) => !rosteredIds.includes(p.id))
      .filter((p) => (term ? p.name.toLowerCase().includes(term) : true))
      .slice(0, 50);
  }, [players, rosteredIds, search]);

  const isOwner = user && league && (league.owner_id || league.commissioner_id) === user.id;

  async function addPlayer(player: any) {
    if (!myTeam) return;
    if (roster.length >= MAX_ROSTER) {
      setError(t("阵容已满", "Roster is full"));
      return;
    }
    setSavingId(player.id);
    setError(null);
    const { error: insertError } = await supabase.from("team_rosters").insert({
      team_id: myTeam.id,
      player_id: Number(player.id),
      player_name: player.name,
      player_team: player.team,
      player_position: player.position,
      acquisition_type: "waiver",
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      await load();
    }
    setSavingId(null);
  }

  async function dropPlayer(playerId: number) {
    if (!myTeam) return;
    setSavingId(playerId);
    setError(null);
    const { error: deleteError } = await supabase
      .from("team_rosters")
      .delete()
      .eq("team_id", myTeam.id)
      .eq("player_id", playerId);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      await load();
    }
    setSavingId(null);
  }

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading-container">
          <p>{t("加载中...", "Loading...")}</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="app">
        <Header />
        <div className="error-container">
          <p>{t("联赛不存在", "League not found")}</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="app">
        <Header />
        <div className="error-container">
          <p>{t("你还没有加入联赛", "You have not joined this league")}</p>
          <button onClick={() => router.push(`/league/${slug}`)}>{t("返回联赛", "Back to league")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <div className="league-header-mini">
        <div className="league-header-inner">
          <Link href={`/league/${slug}`} className="league-title">
            <span className="league-icon">🏆</span>
            <span>{league.name}</span>
          </Link>
        </div>
      </div>

      <LeagueNav slug={slug} isOwner={!!isOwner} />

      <main className="page-content">
        <div className="container">
          <div className="page-header">
            <h1>🧩 {t("我的阵容", "My Roster")}</h1>
            <p>{roster.length}/{MAX_ROSTER} {t("名球员", "players")}</p>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
              <h3 style={{ marginTop: 0 }}>{t("阵容列表", "Roster")}</h3>
              {roster.length === 0 && <p style={{ color: "#94a3b8" }}>{t("暂无球员", "No players yet")}</p>}
              <div style={{ display: "grid", gap: 8 }}>
                {roster.map((r: any) => (
                  <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.player_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{r.player_team} · {r.player_position}</div>
                    </div>
                    <button
                      onClick={() => dropPlayer(r.player_id)}
                      disabled={savingId === r.player_id}
                      style={{
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "#fee2e2",
                        color: "#991b1b",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {savingId === r.player_id ? t("处理中...", "Removing...") : t("移除", "Drop")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ marginTop: 0 }}>{t("可用球员", "Available Players")}</h3>
                <input
                  placeholder={t("搜索球员...", "Search players...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {availablePlayers.map((p) => (
                  <div key={p.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{p.team} · {p.position}</div>
                    </div>
                    <button
                      onClick={() => addPlayer(p)}
                      disabled={savingId !== null && String(savingId) === String(p.id)}
                      style={{
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "#f59e0b",
                        color: "#111",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {savingId === p.id ? t("处理中...", "Adding...") : t("添加", "Add")}
                    </button>
                  </div>
                ))}
                {availablePlayers.length === 0 && (
                  <p style={{ color: "#94a3b8" }}>{t("暂无可用球员", "No available players")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
