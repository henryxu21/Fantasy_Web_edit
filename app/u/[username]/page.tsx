"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, listLeagues, listInsights, League, Insight } from "@/lib/store";

export default function UserProfilePage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "leagues">("posts");
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [userInsights, setUserInsights] = useState<Insight[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const loadData = () => {
    const user = getSessionUser();
    setCurrentUser(user);
    
    const isOwn = user && user.username === username;
    setIsOwnProfile(!!isOwn);
    
    const allInsights = listInsights();
    const filtered = allInsights.filter(i => {
      const authorName = i.author.replace("@", "").toLowerCase();
      return authorName === username.toLowerCase();
    });
    setUserInsights(filtered.sort((a, b) => b.createdAt - a.createdAt));
    
    if (user && isOwn) {
      const allLeagues = listLeagues();
      const userOwnedLeagues = allLeagues.filter(l => l.ownerId === user.id);
      setUserLeagues(userOwnedLeagues);
    }
  };

  useEffect(() => {
    loadData();
  }, [username]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const parseInsight = (insight: Insight) => {
    let coverImage: string | undefined;
    let tags: string[] | undefined;
    
    try {
      const parsed = JSON.parse(insight.body);
      if (parsed.metadata) {
        coverImage = parsed.metadata.coverImage;
        tags = parsed.metadata.tags;
      }
    } catch { }
    
    return { ...insight, coverImage, tags };
  };

  const handleDeleteLeague = (leagueId: string) => {
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const filtered = allLeagues.filter((l: League) => l.id !== leagueId);
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    setShowDeleteModal(null);
    loadData(); // 刷新数据
  };

  const handleDeleteAllDuplicates = () => {
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    // 按名称分组，每个名称只保留一个
    const seen = new Set<string>();
    const filtered = allLeagues.filter((l: League) => {
      if (seen.has(l.name)) {
        return false;
      }
      seen.add(l.name);
      return true;
    });
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    setShowDeleteModal(null);
    loadData();
    alert(t("已清理重复联赛", "Duplicate leagues cleaned"));
  };

  return (
    <div className="app">
      <Header />

      <main className="page-content">
        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, #f59e0b, #d97706)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: "#000"
          }}>
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>@{username}</h1>
            <p style={{ color: "var(--text-muted)" }}>
              {isOwnProfile ? t("这是你的个人主页", "This is your profile") : t("用户主页", "User Profile")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
          <button 
            className={`toggle-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            {t("帖子", "Posts")} ({userInsights.length})
          </button>
          <button 
            className={`toggle-btn ${activeTab === "leagues" ? "active" : ""}`}
            onClick={() => setActiveTab("leagues")}
          >
            {t("联赛", "Leagues")} ({userLeagues.length})
          </button>
          
          {/* 清理重复联赛按钮 */}
          {isOwnProfile && activeTab === "leagues" && userLeagues.length > 1 && (
            <button 
              className="btn btn-ghost" 
              style={{ marginLeft: "auto", fontSize: 13 }}
              onClick={handleDeleteAllDuplicates}
            >
              {t("清理重复", "Clean Duplicates")}
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === "posts" ? (
          <div>
            {userInsights.length === 0 ? (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                  {isOwnProfile ? t("你还没有发布任何帖子", "You haven't posted anything yet") : t("该用户还没有发布帖子", "This user hasn't posted anything yet")}
                </p>
                {isOwnProfile && (
                  <Link href="/insights/new" className="btn btn-primary">{t("发布第一篇帖子", "Create Your First Post")}</Link>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {userInsights.map(insight => {
                  const parsed = parseInsight(insight);
                  return (
                    <Link 
                      key={insight.id} 
                      href={`/insights/${insight.id}`} 
                      style={{ 
                        background: "var(--bg-card)", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: 12, 
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "transform 0.2s, box-shadow 0.2s"
                      }}
                    >
                      <div style={{
                        height: 140,
                        background: parsed.coverImage 
                          ? `url(${parsed.coverImage}) center/cover`
                          : "linear-gradient(135deg, #1e293b, #334155)"
                      }}>
                        <div style={{ padding: 8, display: "flex", justifyContent: "flex-end" }}>
                          <span style={{ 
                            background: "rgba(0,0,0,0.6)", 
                            padding: "4px 8px", 
                            borderRadius: 12, 
                            fontSize: 12 
                          }}>
                            🔥 {insight.heat}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 8, lineHeight: 1.4 }}>{insight.title}</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
                          <span>{formatDate(insight.createdAt)}</span>
                          {parsed.tags && parsed.tags[0] && (
                            <span style={{ color: "var(--accent)" }}>#{parsed.tags[0]}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {userLeagues.length === 0 ? (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                  {isOwnProfile ? t("你还没有创建任何联赛", "You haven't created any leagues") : t("该用户还没有联赛", "This user has no leagues")}
                </p>
                {isOwnProfile && (
                  <Link href="/league/new" className="btn btn-primary">{t("创建联赛", "Create League")}</Link>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {userLeagues.map(league => (
                  <div 
                    key={league.id} 
                    style={{ 
                      background: "var(--bg-card)", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: 12, 
                      padding: 20,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <Link 
                      href={`/league/${league.slug}`}
                      style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                    >
                      <h3 style={{ marginBottom: 4 }}>{league.name}</h3>
                      <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
                        <span>{league.visibility === "public" ? t("公开", "Public") : t("私人", "Private")}</span>
                        <span>{formatDate(league.createdAt)}</span>
                      </div>
                    </Link>
                    {isOwnProfile && (
                      <button 
                        onClick={() => setShowDeleteModal(league.id)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          cursor: "pointer",
                          fontSize: 18,
                          opacity: 0.6,
                          padding: 8
                        }}
                        title={t("删除", "Delete")}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
            onClick={() => setShowDeleteModal(null)}
          >
            <div 
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                padding: 24,
                maxWidth: 400,
                width: "90%"
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>
                {t("确定要删除这个联赛吗？此操作无法撤销。", "Are you sure you want to delete this league? This action cannot be undone.")}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteModal(null)}>
                  {t("取消", "Cancel")}
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteLeague(showDeleteModal)}>
                  {t("删除", "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
