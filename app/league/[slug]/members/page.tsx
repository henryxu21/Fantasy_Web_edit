"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

function LeagueNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const { t } = useLang();
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
          <Link key={item.href} href={item.href} className={`league-nav-link ${item.href.includes('/members') ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function MembersPage() {
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());
    loadData();
  }, [slug]);

  async function loadData() {
    const leagueData = await getLeagueBySlug(slug);
    if (leagueData) {
      setLeague(leagueData);
      const membersData = await getLeagueMembers(leagueData.id);
      setMembers(membersData);
      const memberStatus = await isLeagueMember(leagueData.id);
      setIsMember(memberStatus);
    }
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

  function copyInviteLink() {
    const link = `${window.location.origin}/league/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isOwner = user && league && league.owner_id === user.id;

  const getMemberName = (member: LeagueMember) => {
    return member.user?.username || member.user?.name || "Anonymous";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading-container">
          <p>{t("加载中...", "Loading...")}</p>
        </div>
        <style jsx>{styles}</style>
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
        <style jsx>{styles}</style>
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
            <div>
              <h1>👥 {t("成员管理", "Members")}</h1>
              <p>{members.length}/{(league as any).max_teams || 10} {t("队伍", "teams")}</p>
            </div>
            {isOwner && (
              <button className="invite-btn" onClick={copyInviteLink}>
                {copied ? "✓ " + t("已复制", "Copied!") : "🔗 " + t("复制邀请链接", "Copy Invite Link")}
              </button>
            )}
          </div>

          {/* 邀请卡片 */}
          {isOwner && (
            <div className="invite-card">
              <div className="invite-icon">📨</div>
              <div className="invite-content">
                <h3>{t("邀请成员", "Invite Members")}</h3>
                <p>{t("分享链接邀请朋友加入联赛", "Share the link to invite friends to join")}</p>
              </div>
              <button className="copy-btn" onClick={copyInviteLink}>
                {copied ? t("已复制!", "Copied!") : t("复制链接", "Copy Link")}
              </button>
            </div>
          )}

          {/* 成员列表 */}
          <div className="members-grid">
            {members.map((member, index) => {
              const name = getMemberName(member);
              const isCurrentUser = user && member.user_id === user.id;

              return (
                <div key={member.id} className={`member-card ${isCurrentUser ? "current-user" : ""}`}>
                  <div className="member-rank">#{index + 1}</div>
                  <div className="member-avatar">{name[0]?.toUpperCase()}</div>
                  <div className="member-info">
                    <div className="member-name">
                      {name}
                      {isCurrentUser && <span className="you-badge">{t("你", "You")}</span>}
                    </div>
                    <div className="member-meta">
                      {member.role === "owner" && (
                        <span className="role-badge owner">👑 {t("联赛管理员", "League Manager")}</span>
                      )}
                      {member.role === "member" && (
                        <span className="role-badge member">{t("成员", "Member")}</span>
                      )}
                    </div>
                    <div className="join-date">
                      {t("加入于", "Joined")} {formatDate(member.joined_at)}
                    </div>
                  </div>
                  <div className="member-stats">
                    <div className="stat">
                      <span className="stat-value">0-0</span>
                      <span className="stat-label">{t("战绩", "Record")}</span>
                    </div>
                  </div>
                  {isOwner && !isCurrentUser && (
                    <div className="member-actions">
                      <button className="action-btn remove">{t("移除", "Remove")}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 加入/退出按钮 */}
          {!isMember ? (
            <div className="join-section">
              <button className="join-btn" onClick={handleJoin} disabled={joining}>
                {joining ? t("加入中...", "Joining...") : t("加入联赛", "Join League")}
              </button>
            </div>
          ) : !isOwner && (
            <div className="leave-section">
              <button className="leave-btn" onClick={handleLeave} disabled={joining}>
                {joining ? t("退出中...", "Leaving...") : t("退出联赛", "Leave League")}
              </button>
            </div>
          )}
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .league-header-mini {
    background: linear-gradient(135deg, #1a237e 0%, #0d1442 100%);
    border-bottom: 1px solid #283593;
  }

  .league-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
  }

  .league-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    text-decoration: none;
    font-size: 20px;
    font-weight: 600;
  }

  .league-icon { font-size: 28px; }

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
  }

  .league-nav-link:hover { color: #fff; }
  .league-nav-link.active { color: #f59e0b; border-bottom-color: #f59e0b; }

  .page-content {
    min-height: calc(100vh - 200px);
    background: #0a0a0a;
    padding: 24px 16px;
  }

  .container { max-width: 900px; margin: 0 auto; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 4px 0;
  }

  .page-header p {
    font-size: 14px;
    color: #888;
    margin: 0;
  }

  .invite-btn {
    padding: 10px 20px;
    background: #f59e0b;
    border: none;
    border-radius: 20px;
    color: #000;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .invite-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .invite-icon { font-size: 32px; }

  .invite-content {
    flex: 1;
  }

  .invite-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 4px 0;
  }

  .invite-content p {
    font-size: 14px;
    color: #888;
    margin: 0;
  }

  .copy-btn {
    padding: 10px 20px;
    background: #f59e0b;
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
  }

  .members-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .member-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
  }

  .member-card.current-user {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .member-rank {
    font-size: 14px;
    font-weight: 700;
    color: #666;
    width: 32px;
  }

  .member-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
    font-size: 22px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .you-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: #f59e0b;
    color: #000;
    border-radius: 10px;
  }

  .member-meta {
    margin-top: 4px;
  }

  .role-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .role-badge.owner {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  .role-badge.member {
    background: rgba(100, 100, 100, 0.2);
    color: #888;
  }

  .join-date {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }

  .member-stats {
    text-align: center;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
    display: block;
  }

  .member-actions {
    margin-left: 16px;
  }

  .action-btn.remove {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid #ef4444;
    border-radius: 8px;
    color: #ef4444;
    font-size: 13px;
    cursor: pointer;
  }

  .join-section, .leave-section {
    margin-top: 32px;
    text-align: center;
  }

  .join-btn {
    padding: 14px 40px;
    background: #f59e0b;
    border: none;
    border-radius: 24px;
    color: #000;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .leave-btn {
    padding: 12px 32px;
    background: transparent;
    border: 1px solid #666;
    border-radius: 24px;
    color: #888;
    font-size: 14px;
    cursor: pointer;
  }

  .leave-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .loading-container, .error-container {
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
  }
`;
