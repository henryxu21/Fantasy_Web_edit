"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import {
  getSessionUser,
  getLeagueBySlug,
  getLeagueMembers,
  isLeagueMember,
  joinLeague,
  leaveLeague,
  League,
  LeagueMember,
} from "@/lib/store";

// 联赛内部导航组件
function LeagueNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const { t } = useLang();
  const pathname = usePathname();
  
  const mainNav = [
    { href: `/league/${slug}`, label: t("联赛主页", "League Home"), icon: "🏠" },
    { href: `/league/${slug}/standings`, label: t("排行榜", "Standings"), icon: "🏆" },
    { href: `/league/${slug}/scoreboard`, label: t("记分板", "Scoreboard"), icon: "📊" },
    { href: `/league/${slug}/schedule`, label: t("赛程表", "Schedule"), icon: "📅" },
    { href: `/league/${slug}/board`, label: t("讨论区", "Message Board"), icon: "💬" },
    { href: `/league/${slug}/members`, label: t("成员", "Members"), icon: "👥" },
  ];

  if (isOwner) {
    mainNav.push({ href: `/league/${slug}/settings`, label: t("设置", "Settings"), icon: "⚙️" });
  }

  return (
    <nav className="league-nav">
      <div className="league-nav-inner">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`league-nav-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function LeagueDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [announcement, setAnnouncement] = useState("欢迎来到联赛！准备好开始你的 Fantasy 篮球之旅了吗？");

  useEffect(() => {
    setUser(getSessionUser());
    loadLeague();
  }, [slug]);

  async function loadLeague() {
    const leagueData = await getLeagueBySlug(slug);
    if (!leagueData) {
      setLoading(false);
      return;
    }

    setLeague(leagueData);

    const membersData = await getLeagueMembers(leagueData.id);
    setMembers(membersData);

    const memberStatus = await isLeagueMember(leagueData.id);
    setIsMember(memberStatus);

    setLoading(false);
  }

  async function handleJoin() {
    if (!user) {
      alert(t("请先登录", "Please login first"));
      router.push("/auth/login");
      return;
    }

    setJoining(true);
    const res = await joinLeague(league!.id);

    if (res.ok) {
      setIsMember(true);
      const membersData = await getLeagueMembers(league!.id);
      setMembers(membersData);
    } else {
      alert(res.error || t("加入失败", "Failed to join"));
    }
    setJoining(false);
  }

  async function handleLeave() {
    if (!confirm(t("确定要退出联赛吗？", "Are you sure you want to leave?"))) {
      return;
    }

    setJoining(true);
    const res = await leaveLeague(league!.id);

    if (res.ok) {
      setIsMember(false);
      const membersData = await getLeagueMembers(league!.id);
      setMembers(membersData);
    }
    setJoining(false);
  }

  const isOwner = user && league && league.owner_id === user.id;

  const getMemberName = (member: LeagueMember) => {
    if (member.user?.username) return member.user.username;
    if (member.user?.name) return member.user.name;
    return "Anonymous";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // 模拟最近动态
  const recentActivities = [
    { id: 1, type: "join", content: "h75yin 加入了联赛", time: "2小时前" },
    { id: 2, type: "message", content: "abcd 在讨论区发布了新帖子", time: "5小时前" },
    { id: 3, type: "settings", content: "联赛设置已更新", time: "1天前" },
  ];

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="league-page">
          <div className="loading">
            <div className="loading-icon">🏀</div>
            <p>{t("加载中...", "Loading...")}</p>
          </div>
        </main>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="app">
        <Header />
        <main className="league-page">
          <div className="not-found">
            <div className="icon">😕</div>
            <h2>{t("联赛不存在", "League Not Found")}</h2>
            <Link href="/league" className="back-btn">
              {t("返回联赛列表", "Back to Leagues")}
            </Link>
          </div>
        </main>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      
      {/* 联赛头部 */}
      <div className="league-header">
        <div className="league-header-inner">
          <div className="league-info">
            <div className="league-icon">🏆</div>
            <div className="league-details">
              <h1>{league.name}</h1>
              <div className="league-meta">
                <span className="badge">{league.visibility === "public" ? t("公开", "Public") : t("私密", "Private")}</span>
                <span className="meta-item">👥 {members.length}/{(league as any).max_teams || 10} {t("队伍", "teams")}</span>
                <span className="meta-item">📅 {(league as any).season_year || 2025} {t("赛季", "Season")}</span>
                <span className="meta-item status">{t("准备中", "Pre-Draft")}</span>
              </div>
            </div>
          </div>
          
          <div className="league-actions">
            {!isMember ? (
              <button className="action-btn join" onClick={handleJoin} disabled={joining}>
                {joining ? t("加入中...", "Joining...") : t("加入联赛", "Join League")}
              </button>
            ) : isOwner ? (
              <Link href={`/league/${slug}/settings`} className="action-btn settings">
                ⚙️ {t("管理联赛", "Manage")}
              </Link>
            ) : (
              <button className="action-btn leave" onClick={handleLeave} disabled={joining}>
                {t("退出联赛", "Leave")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 联赛导航 */}
      <LeagueNav slug={slug} isOwner={!!isOwner} />

      <main className="league-page">
        <div className="league-container">
          <div className="content-grid">
            {/* 左侧主内容 */}
            <div className="main-content">
              {/* 联赛公告 */}
              <div className="card announcement-card">
                <div className="card-header">
                  <h3>📢 {t("联赛公告", "League Announcement")}</h3>
                  {isOwner && (
                    <button className="edit-btn">{t("编辑", "Edit")}</button>
                  )}
                </div>
                <div className="card-body">
                  <p>{announcement}</p>
                </div>
              </div>

              {/* 快捷入口 */}
              {isMember && (
                <div className="quick-actions">
                  <Link href={`/league/${slug}/team`} className="quick-action-card">
                    <span className="qa-icon">🏀</span>
                    <span className="qa-title">{t("我的球队", "My Team")}</span>
                    <span className="qa-desc">{t("管理阵容", "Manage roster")}</span>
                  </Link>
                  <Link href={`/league/${slug}/players`} className="quick-action-card">
                    <span className="qa-icon">➕</span>
                    <span className="qa-title">{t("添加球员", "Add Players")}</span>
                    <span className="qa-desc">{t("自由球员市场", "Free agents")}</span>
                  </Link>
                  <Link href={`/league/${slug}/draft`} className="quick-action-card">
                    <span className="qa-icon">📋</span>
                    <span className="qa-title">{t("选秀大厅", "Draft Lobby")}</span>
                    <span className="qa-desc">{t("即将开始", "Coming soon")}</span>
                  </Link>
                  <Link href={`/league/${slug}/board`} className="quick-action-card">
                    <span className="qa-icon">💬</span>
                    <span className="qa-title">{t("讨论区", "Message Board")}</span>
                    <span className="qa-desc">{t("与队友交流", "Chat with league")}</span>
                  </Link>
                </div>
              )}

              {/* 最近动态 */}
              <div className="card">
                <div className="card-header">
                  <h3>📰 {t("最近动态", "Recent Activity")}</h3>
                  <Link href={`/league/${slug}/activity`} className="view-all">
                    {t("查看全部", "View All")} →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="activity-list">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          {activity.type === "join" && "👤"}
                          {activity.type === "message" && "💬"}
                          {activity.type === "settings" && "⚙️"}
                        </div>
                        <div className="activity-content">
                          <span className="activity-text">{activity.content}</span>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div className="sidebar">
              {/* 排行榜预览 */}
              <div className="card">
                <div className="card-header">
                  <h3>🏆 {t("排行榜", "Standings")}</h3>
                  <Link href={`/league/${slug}/standings`} className="view-all">
                    {t("查看", "View")} →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="standings-preview">
                    {members.slice(0, 5).map((member, index) => {
                      const name = getMemberName(member);
                      return (
                        <div key={member.id} className="standing-row">
                          <span className="rank">{index + 1}</span>
                          <div className="team-info">
                            <span className="team-avatar">{name[0]?.toUpperCase()}</span>
                            <span className="team-name">{name}</span>
                          </div>
                          <span className="record">0-0</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 成员列表 */}
              <div className="card">
                <div className="card-header">
                  <h3>👥 {t("成员", "Members")} ({members.length})</h3>
                  <Link href={`/league/${slug}/members`} className="view-all">
                    {t("查看", "View")} →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="members-preview">
                    {members.map((member) => {
                      const name = getMemberName(member);
                      return (
                        <div key={member.id} className="member-row">
                          <span className="member-avatar">{name[0]?.toUpperCase()}</span>
                          <span className="member-name">{name}</span>
                          {member.role === "owner" && (
                            <span className="owner-badge">👑</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 联赛信息 */}
              <div className="card">
                <div className="card-header">
                  <h3>ℹ️ {t("联赛信息", "League Info")}</h3>
                </div>
                <div className="card-body">
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-label">{t("计分方式", "Scoring")}</span>
                      <span className="info-value">{t("Head-to-Head", "H2H Categories")}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t("选秀类型", "Draft Type")}</span>
                      <span className="info-value">{t("蛇形选秀", "Snake")}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t("阵容大小", "Roster Size")}</span>
                      <span className="info-value">13</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t("创建时间", "Created")}</span>
                      <span className="info-value">{formatDate(league.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  /* 联赛头部 */
  .league-header {
    background: linear-gradient(135deg, #1a237e 0%, #0d1442 100%);
    border-bottom: 1px solid #283593;
  }

  .league-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .league-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .league-icon {
    font-size: 48px;
    width: 72px;
    height: 72px;
    background: rgba(255,255,255,0.1);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .league-details h1 {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .league-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .badge {
    padding: 4px 12px;
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .meta-item {
    font-size: 14px;
    color: #90caf9;
  }

  .meta-item.status {
    padding: 4px 12px;
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    border-radius: 12px;
  }

  .league-actions .action-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s;
  }

  .action-btn.join {
    background: #f59e0b;
    color: #000;
  }

  .action-btn.join:hover:not(:disabled) {
    background: #fbbf24;
  }

  .action-btn.settings {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .action-btn.leave {
    background: transparent;
    color: #888;
    border: 1px solid #444;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* 联赛导航 */
  .league-nav {
    background: #111;
    border-bottom: 1px solid #222;
    position: sticky;
    top: 60px;
    z-index: 40;
  }

  .league-nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
    padding: 0 16px;
    overflow-x: auto;
  }

  .league-nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 16px;
    color: #888;
    text-decoration: none;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .league-nav-link:hover {
    color: #fff;
    background: rgba(255,255,255,0.05);
  }

  .league-nav-link.active {
    color: #f59e0b;
    border-bottom-color: #f59e0b;
  }

  .nav-icon {
    font-size: 16px;
  }

  /* 主内容区 */
  .league-page {
    min-height: calc(100vh - 200px);
    background: #0a0a0a;
    padding: 24px 16px;
  }

  .league-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
  }

  /* 卡片样式 */
  .card {
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #222;
  }

  .card-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .card-body {
    padding: 16px 20px;
  }

  .view-all, .edit-btn {
    font-size: 13px;
    color: #f59e0b;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
  }

  .view-all:hover, .edit-btn:hover {
    text-decoration: underline;
  }

  /* 公告卡片 */
  .announcement-card .card-body p {
    color: #ccc;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }

  /* 快捷操作 */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .quick-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    text-decoration: none;
    text-align: center;
    transition: all 0.2s;
  }

  .quick-action-card:hover {
    border-color: #f59e0b;
    transform: translateY(-2px);
  }

  .qa-icon {
    font-size: 28px;
  }

  .qa-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  .qa-desc {
    font-size: 12px;
    color: #666;
  }

  /* 动态列表 */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #1a1a1a;
    border-radius: 8px;
  }

  .activity-icon {
    font-size: 20px;
    width: 36px;
    height: 36px;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .activity-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .activity-text {
    font-size: 14px;
    color: #ccc;
  }

  .activity-time {
    font-size: 12px;
    color: #666;
  }

  /* 排行榜预览 */
  .standings-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .standing-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: #1a1a1a;
    border-radius: 8px;
  }

  .rank {
    width: 24px;
    height: 24px;
    background: #333;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }

  .standing-row:first-child .rank {
    background: #f59e0b;
    color: #000;
  }

  .team-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .team-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .team-name {
    font-size: 14px;
    color: #fff;
  }

  .record {
    font-size: 13px;
    color: #888;
  }

  /* 成员预览 */
  .members-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: #1a1a1a;
    border-radius: 8px;
  }

  .member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .member-name {
    flex: 1;
    font-size: 14px;
    color: #fff;
  }

  .owner-badge {
    font-size: 14px;
  }

  /* 联赛信息 */
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-label {
    font-size: 13px;
    color: #888;
  }

  .info-value {
    font-size: 13px;
    color: #fff;
    font-weight: 500;
  }

  /* 加载和错误状态 */
  .loading, .not-found {
    text-align: center;
    padding: 80px 20px;
  }

  .loading-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .not-found .icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .not-found h2 {
    font-size: 20px;
    color: #fff;
    margin: 0 0 16px 0;
  }

  .back-btn {
    display: inline-block;
    padding: 12px 24px;
    background: #f59e0b;
    color: #000;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
  }

  /* 响应式 */
  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions {
      grid-template-columns: repeat(2, 1fr);
    }

    .league-header-inner {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .league-info {
      flex-direction: column;
    }
  }

  @media (max-width: 600px) {
    .quick-actions {
      grid-template-columns: 1fr 1fr;
    }

    .league-nav-inner {
      padding: 0 8px;
    }

    .league-nav-link {
      padding: 12px;
    }

    .nav-label {
      display: none;
    }
  }
`;