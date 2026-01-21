"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, listLeagues, listInsights, League, Insight } from "@/lib/store";

// 徽章类型定义
type Badge = {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  color: string;
};

const ALL_BADGES: Badge[] = [
  { id: "expert", name: "专家认证", nameEn: "Expert", icon: "🏆", description: "发布超过10篇高质量分析", descriptionEn: "Published 10+ quality analyses", color: "#f59e0b" },
  { id: "veteran", name: "资深玩家", nameEn: "Veteran", icon: "⭐", description: "参与超过5个联赛", descriptionEn: "Joined 5+ leagues", color: "#8b5cf6" },
  { id: "champion", name: "冠军", nameEn: "Champion", icon: "👑", description: "赢得联赛冠军", descriptionEn: "Won a league championship", color: "#eab308" },
  { id: "analyst", name: "分析师", nameEn: "Analyst", icon: "📊", description: "帖子获得100+点赞", descriptionEn: "Posts received 100+ likes", color: "#3b82f6" },
  { id: "rookie", name: "新秀", nameEn: "Rookie", icon: "🌟", description: "发布首篇帖子", descriptionEn: "Published first post", color: "#22c55e" },
  { id: "social", name: "社交达人", nameEn: "Social Star", icon: "💬", description: "评论超过50条", descriptionEn: "Posted 50+ comments", color: "#ec4899" },
];

type DraftHistory = {
  id: string;
  leagueName: string;
  season: string;
  result: string;
  rank: number;
  totalTeams: number;
  date: number;
};

export default function UserProfilePage() {
  const { t } = useLang();
  const params = useParams();
  const username = params.username as string;
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "leagues" | "drafts" | "stats">("posts");
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [userInsights, setUserInsights] = useState<Insight[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [draftHistory, setDraftHistory] = useState<DraftHistory[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    leaguesJoined: 0,
    leaguesWon: 0,
    draftsCompleted: 0,
  });

  const loadData = async () => {
    const user = getSessionUser();
    setCurrentUser(user);
    
    const isOwn = user && user.username.toLowerCase() === username.toLowerCase();
    setIsOwnProfile(!!isOwn);
    
    // 加载帖子 - 匹配 username 或 name（兼容旧数据）
    const allInsights = await listInsights();
    const filtered = allInsights.filter((i: any) => {
      const authorName = typeof i.author === 'object' ? i.author?.username : i.author;
      const authorClean = (authorName || '').replace("@", "").toLowerCase();
      const usernameClean = username.toLowerCase();
      // 匹配 username 或者 name
      if (authorClean === usernameClean) return true;
      // 也检查当前用户的 name（如果是自己的主页）
      if (isOwn && user && authorClean === user.name.toLowerCase()) return true;
      return false;
    });
    setUserInsights(filtered.sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()));
    
    // 加载联赛
    const allLeagues = await listLeagues();
    let userOwnedLeagues: League[] = [];
    if (user && isOwn) {
      userOwnedLeagues = allLeagues.filter((l: any) => l.owner_id === user.id || l.ownerId === user.id);
      setUserLeagues(userOwnedLeagues);
    }
    
    // 计算真实统计数据
    const totalLikes = filtered.reduce((sum, i) => sum + (i.heat || 0), 0);
    
    const allComments = JSON.parse(localStorage.getItem("bp_comments") || "[]");
    const userComments = allComments.filter((c: any) => {
      const commentAuthor = c.author?.replace("@", "").toLowerCase();
      return commentAuthor === username.toLowerCase();
    });
    
    const savedDrafts = JSON.parse(localStorage.getItem(`bp_drafts_${username}`) || "[]");
    setDraftHistory(savedDrafts);
    
    const championships = JSON.parse(localStorage.getItem(`bp_championships_${username}`) || "[]");
    
    setStats({
      totalPosts: filtered.length,
      totalLikes,
      totalComments: userComments.length,
      leaguesJoined: userOwnedLeagues.length,
      leaguesWon: championships.length,
      draftsCompleted: savedDrafts.length,
    });
    
    // 根据真实数据计算徽章
    const badges: Badge[] = [];
    if (filtered.length >= 1) badges.push(ALL_BADGES.find(b => b.id === "rookie")!);
    if (filtered.length >= 10) badges.push(ALL_BADGES.find(b => b.id === "expert")!);
    if (totalLikes >= 100) badges.push(ALL_BADGES.find(b => b.id === "analyst")!);
    if (userOwnedLeagues.length >= 5) badges.push(ALL_BADGES.find(b => b.id === "veteran")!);
    if (userComments.length >= 50) badges.push(ALL_BADGES.find(b => b.id === "social")!);
    if (championships.length > 0) badges.push(ALL_BADGES.find(b => b.id === "champion")!);
    setUserBadges(badges.filter(Boolean));
    
    // 粉丝数
    const followersKey = `bp_followers_${username}`;
    const savedFollowers = JSON.parse(localStorage.getItem(followersKey) || "[]");
    setFollowersCount(savedFollowers.length);
    
    // 关注数
    if (user && isOwn) {
      const followingList = JSON.parse(localStorage.getItem(`bp_following_${user.id}`) || "[]");
      setFollowingCount(followingList.length);
    }
    
    // 检查关注状态
    if (user && !isOwn) {
      const following = JSON.parse(localStorage.getItem(`bp_following_${user.id}`) || "[]");
      setIsFollowing(following.includes(username) || following.includes(`@${username}`));
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

  const handleFollow = () => {
    if (!currentUser) {
      alert(t("请先登录", "Please login first"));
      return;
    }
    
    const followingKey = `bp_following_${currentUser.id}`;
    const followersKey = `bp_followers_${username}`;
    const following = JSON.parse(localStorage.getItem(followingKey) || "[]");
    const followers = JSON.parse(localStorage.getItem(followersKey) || "[]");
    
    if (isFollowing) {
      const newFollowing = following.filter((name: string) => name !== username && name !== `@${username}`);
      const newFollowers = followers.filter((id: string) => id !== currentUser.id);
      localStorage.setItem(followingKey, JSON.stringify(newFollowing));
      localStorage.setItem(followersKey, JSON.stringify(newFollowers));
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      following.push(username);
      followers.push(currentUser.id);
      localStorage.setItem(followingKey, JSON.stringify(following));
      localStorage.setItem(followersKey, JSON.stringify(followers));
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const handleDeleteLeague = (leagueId: string) => {
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const filtered = allLeagues.filter((l: League) => l.id !== leagueId);
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    setShowDeleteModal(null);
    loadData();
  };

  const handleDeleteAllDuplicates = () => {
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const seen = new Set<string>();
    const filtered = allLeagues.filter((l: League) => {
      if (seen.has(l.name)) return false;
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
        <div className="profile-header">
          <div className="profile-main">
            <div className="avatar-section">
              <div className="avatar">{username[0]?.toUpperCase()}</div>
              {userBadges.length > 0 && (
                <div className="primary-badge" style={{ background: userBadges[0].color }}>{userBadges[0].icon}</div>
              )}
            </div>
            
            <div className="profile-info">
              <div className="name-row">
                <h1 className="username">@{username}</h1>
                {userBadges.length > 0 && (
                  <span className="verified-badge" title={t(userBadges[0].name, userBadges[0].nameEn)}>✓</span>
                )}
              </div>
              <p className="bio">{isOwnProfile ? t("这是你的个人主页", "This is your profile") : t("Fantasy 篮球玩家", "Fantasy Basketball Player")}</p>
              
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-value">{stats.totalPosts}</span>
                  <span className="stat-label">{t("帖子", "Posts")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{followersCount}</span>
                  <span className="stat-label">{t("粉丝", "Followers")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{followingCount}</span>
                  <span className="stat-label">{t("关注", "Following")}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            {isOwnProfile ? (
              <button className="btn btn-ghost">{t("编辑资料", "Edit Profile")}</button>
            ) : (
              <button className={`btn ${isFollowing ? "btn-ghost" : "btn-primary"}`} onClick={handleFollow}>
                {isFollowing ? t("已关注", "Following") : t("关注", "Follow")}
              </button>
            )}
          </div>
        </div>

        {/* Badges */}
        {userBadges.length > 0 && (
          <div className="badges-section">
            <h3 className="section-title">{t("徽章", "Badges")}</h3>
            <div className="badges-grid">
              {userBadges.map(badge => (
                <div key={badge.id} className="badge-item" style={{ borderColor: badge.color }}>
                  <span className="badge-icon">{badge.icon}</span>
                  <div className="badge-info">
                    <span className="badge-name" style={{ color: badge.color }}>{t(badge.name, badge.nameEn)}</span>
                    <span className="badge-desc">{t(badge.description, badge.descriptionEn)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")}>
            {t("帖子", "Posts")} ({userInsights.length})
          </button>
          <button className={`tab-btn ${activeTab === "leagues" ? "active" : ""}`} onClick={() => setActiveTab("leagues")}>
            {t("联赛", "Leagues")} ({userLeagues.length})
          </button>
          <button className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`} onClick={() => setActiveTab("drafts")}>
            {t("选秀历史", "Draft History")} ({draftHistory.length})
          </button>
          <button className={`tab-btn ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
            {t("战绩统计", "Stats")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "posts" && (
            <div>
              {userInsights.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>{isOwnProfile ? t("你还没有发布任何帖子", "You haven't posted anything yet") : t("该用户还没有发布帖子", "This user hasn't posted anything yet")}</p>
                  {isOwnProfile && <Link href="/insights/new" className="btn btn-primary">{t("发布第一篇帖子", "Create Your First Post")}</Link>}
                </div>
              ) : (
                <div className="posts-grid">
                  {userInsights.map(insight => {
                    const parsed = parseInsight(insight);
                    return (
                      <Link key={insight.id} href={`/insights/${insight.id}`} className="post-card">
                        <div className="post-cover" style={{ backgroundImage: parsed.coverImage ? `url(${parsed.coverImage})` : "linear-gradient(135deg, #1e293b, #334155)" }}>
                          <span className="post-heat">🔥 {insight.heat}</span>
                        </div>
                        <div className="post-info">
                          <h3 className="post-title">{insight.title}</h3>
                          <div className="post-meta">
                            <span>{formatDate(insight.createdAt)}</span>
                            {parsed.tags && parsed.tags[0] && <span className="post-tag">#{parsed.tags[0]}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "leagues" && (
            <div>
              {isOwnProfile && userLeagues.length > 1 && (
                <div style={{ marginBottom: 16, textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleDeleteAllDuplicates}>{t("清理重复", "Clean Duplicates")}</button>
                </div>
              )}
              {userLeagues.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏀</div>
                  <p>{isOwnProfile ? t("你还没有创建任何联赛", "You haven't created any leagues") : t("该用户还没有联赛", "This user has no leagues")}</p>
                  {isOwnProfile && <Link href="/league/new" className="btn btn-primary">{t("创建联赛", "Create League")}</Link>}
                </div>
              ) : (
                <div className="leagues-list">
                  {userLeagues.map(league => (
                    <div key={league.id} className="league-card">
                      <Link href={`/league/${league.slug}`} className="league-info">
                        <div className="league-icon">🏀</div>
                        <div>
                          <h3 className="league-name">{league.name}</h3>
                          <div className="league-meta">
                            <span className="league-visibility">{league.visibility === "public" ? t("公开", "Public") : t("私人", "Private")}</span>
                            <span>{formatDate(league.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                      {isOwnProfile && <button className="delete-btn" onClick={() => setShowDeleteModal(league.id)}>🗑️</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "drafts" && (
            <div>
              {draftHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>{t("还没有选秀记录", "No draft history yet")}</p>
                  <p className="empty-hint">{t("完成联赛选秀后，记录会显示在这里", "Complete a league draft to see your history here")}</p>
                  <Link href="/mock-draft" className="btn btn-primary">{t("开始模拟选秀", "Start Mock Draft")}</Link>
                </div>
              ) : (
                <div className="drafts-list">
                  {draftHistory.map(draft => (
                    <div key={draft.id} className="draft-card">
                      <div className="draft-rank" style={{ background: draft.rank === 1 ? "#eab308" : draft.rank === 2 ? "#94a3b8" : draft.rank === 3 ? "#cd7f32" : "var(--bg-secondary)" }}>#{draft.rank}</div>
                      <div className="draft-info">
                        <h3 className="draft-league">{draft.leagueName}</h3>
                        <div className="draft-meta"><span>{draft.season}</span><span>•</span><span>{draft.totalTeams} {t("队伍", "teams")}</span></div>
                      </div>
                      <div className="draft-result" style={{ color: draft.rank === 1 ? "#eab308" : "var(--text-primary)" }}>{draft.result}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="stats-grid">
              {[
                { icon: "📝", value: stats.totalPosts, label: t("发布帖子", "Posts Published") },
                { icon: "❤️", value: stats.totalLikes, label: t("获得点赞", "Likes Received") },
                { icon: "💬", value: stats.totalComments, label: t("发表评论", "Comments Made") },
                { icon: "🏀", value: stats.leaguesJoined, label: t("参与联赛", "Leagues Joined") },
                { icon: "🏆", value: stats.leaguesWon, label: t("联赛冠军", "Championships") },
                { icon: "📋", value: stats.draftsCompleted, label: t("完成选秀", "Drafts Completed") },
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <span className="stat-number">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>{t("确定要删除这个联赛吗？", "Are you sure you want to delete this league?")}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteModal(null)}>{t("取消", "Cancel")}</button>
                <button className="btn btn-danger" onClick={() => handleDeleteLeague(showDeleteModal)}>{t("删除", "Delete")}</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .profile-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
        .profile-main { display: flex; gap: 24px; align-items: flex-start; }
        .avatar-section { position: relative; }
        .avatar { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; color: #000; }
        .primary-badge { position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid var(--bg-primary); }
        .name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .username { font-size: 28px; font-weight: 700; }
        .verified-badge { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #000; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
        .bio { color: var(--text-muted); margin-bottom: 16px; }
        .stats-row { display: flex; gap: 24px; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-value { font-size: 20px; font-weight: 700; }
        .stat-label { font-size: 13px; color: var(--text-muted); }
        .badges-section { margin-bottom: 32px; }
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
        .badges-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .badge-item { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 2px solid; border-radius: 12px; padding: 12px 16px; }
        .badge-icon { font-size: 24px; }
        .badge-info { display: flex; flex-direction: column; }
        .badge-name { font-weight: 600; font-size: 14px; }
        .badge-desc { font-size: 12px; color: var(--text-muted); }
        .tabs-container { display: flex; gap: 4px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px; overflow-x: auto; }
        .tab-btn { padding: 12px 20px; background: none; border: none; color: var(--text-muted); font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; transition: all 0.2s; }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .empty-state { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-state p { color: var(--text-muted); margin-bottom: 8px; }
        .empty-hint { font-size: 14px; margin-bottom: 20px !important; }
        .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .post-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s; }
        .post-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.2); }
        .post-cover { height: 160px; background-size: cover; background-position: center; position: relative; }
        .post-heat { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 12px; font-size: 13px; }
        .post-info { padding: 16px; }
        .post-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; line-height: 1.4; }
        .post-meta { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }
        .post-tag { color: var(--accent); }
        .leagues-list { display: flex; flex-direction: column; gap: 12px; }
        .league-card { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; }
        .league-info { display: flex; align-items: center; gap: 16px; text-decoration: none; color: inherit; flex: 1; }
        .league-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .league-name { font-weight: 600; margin-bottom: 4px; }
        .league-meta { display: flex; gap: 12px; font-size: 13px; color: var(--text-muted); }
        .league-visibility { color: var(--accent); }
        .delete-btn { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.5; padding: 8px; transition: opacity 0.2s; }
        .delete-btn:hover { opacity: 1; }
        .drafts-list { display: flex; flex-direction: column; gap: 12px; }
        .draft-card { display: flex; align-items: center; gap: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 20px; }
        .draft-rank { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #000; }
        .draft-info { flex: 1; }
        .draft-league { font-weight: 600; margin-bottom: 4px; }
        .draft-meta { display: flex; gap: 8px; font-size: 13px; color: var(--text-muted); }
        .draft-result { font-weight: 600; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .stat-card { display: flex; align-items: center; gap: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-number { font-size: 24px; font-weight: 700; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; }
        @media (max-width: 640px) {
          .profile-main { flex-direction: column; align-items: center; text-align: center; }
          .stats-row { justify-content: center; }
          .profile-actions { width: 100%; }
          .profile-actions .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
