"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import {
  getSessionUser,
  getLeagueBySlug,
  getLeagueMembers,
  isLeagueMember,
  League,
  LeagueMember,
  supabase,
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
          <Link key={item.href} href={item.href} className={`league-nav-link ${item.href.includes('/board') ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

type Message = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  is_pinned: boolean;
  created_at: string;
  user?: { name: string; username: string };
};

export default function BoardPage() {
  const { t } = useLang();
  const params = useParams();
  const slug = params.slug as string;

  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);

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

      // 加载消息
      const { data } = await supabase
        .from("league_messages")
        .select("*")
        .eq("league_id", leagueData.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) {
        // 关联用户信息
        const { data: users } = await supabase.from("users").select("id, name, username");
        const messagesWithUsers = data.map(msg => ({
          ...msg,
          user: users?.find(u => u.id === msg.user_id),
        }));
        setMessages(messagesWithUsers);
      }
    }
    setLoading(false);
  }

  async function handlePost() {
    if (!user || !league) return;
    if (!newBody.trim()) return;

    setPosting(true);

    const { data, error } = await supabase
      .from("league_messages")
      .insert({
        league_id: league.id,
        user_id: user.id,
        title: newTitle.trim() || null,
        body: newBody.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages([{ ...data, user: { name: user.name, username: user.username } }, ...messages]);
      setNewTitle("");
      setNewBody("");
      setShowNewPost(false);
    }

    setPosting(false);
  }

  const isOwner = user && league && league.owner_id === user.id;

  const getMemberName = (member: LeagueMember) => {
    return member.user?.username || member.user?.name || "Anonymous";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}${t("分钟前", "m ago")}`;
    if (hours < 24) return `${hours}${t("小时前", "h ago")}`;
    if (days < 7) return `${days}${t("天前", "d ago")}`;
    return date.toLocaleDateString();
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
            <h1>💬 {t("讨论区", "Message Board")}</h1>
            {isMember && (
              <button className="new-post-btn" onClick={() => setShowNewPost(true)}>
                + {t("发布帖子", "New Post")}
              </button>
            )}
          </div>

          {/* 新帖子表单 */}
          {showNewPost && (
            <div className="new-post-form">
              <input
                type="text"
                placeholder={t("标题（可选）", "Title (optional)")}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="post-title-input"
              />
              <textarea
                placeholder={t("写点什么...", "Write something...")}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="post-body-input"
                rows={4}
              />
              <div className="post-actions">
                <button className="cancel-btn" onClick={() => setShowNewPost(false)}>
                  {t("取消", "Cancel")}
                </button>
                <button 
                  className="submit-btn" 
                  onClick={handlePost}
                  disabled={posting || !newBody.trim()}
                >
                  {posting ? t("发布中...", "Posting...") : t("发布", "Post")}
                </button>
              </div>
            </div>
          )}

          {/* 消息列表 */}
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>{t("还没有帖子", "No messages yet")}</h3>
                <p>{t("成为第一个发言的人吧！", "Be the first to post!")}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message-card ${msg.is_pinned ? "pinned" : ""}`}>
                  {msg.is_pinned && (
                    <div className="pinned-badge">📌 {t("置顶", "Pinned")}</div>
                  )}
                  <div className="message-header">
                    <div className="author-info">
                      <span className="author-avatar">
                        {(msg.user?.username || msg.user?.name || "A")[0]?.toUpperCase()}
                      </span>
                      <span className="author-name">{msg.user?.username || msg.user?.name || "Anonymous"}</span>
                    </div>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  {msg.title && <h3 className="message-title">{msg.title}</h3>}
                  <p className="message-body">{msg.body}</p>
                  <div className="message-footer">
                    <button className="reply-btn">💬 {t("回复", "Reply")}</button>
                  </div>
                </div>
              ))
            )}
          </div>
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

  .container { max-width: 800px; margin: 0 auto; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }

  .new-post-btn {
    padding: 10px 20px;
    background: #f59e0b;
    border: none;
    border-radius: 20px;
    color: #000;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .new-post-btn:hover { background: #fbbf24; }

  .new-post-form {
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .post-title-input, .post-body-input {
    width: 100%;
    padding: 12px 16px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    margin-bottom: 12px;
    resize: none;
  }

  .post-title-input:focus, .post-body-input:focus {
    outline: none;
    border-color: #f59e0b;
  }

  .post-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .cancel-btn {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid #333;
    border-radius: 8px;
    color: #888;
    cursor: pointer;
  }

  .submit-btn {
    padding: 10px 24px;
    background: #f59e0b;
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
  }

  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message-card {
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 20px;
  }

  .message-card.pinned {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .pinned-badge {
    font-size: 12px;
    color: #f59e0b;
    margin-bottom: 12px;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .author-name {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  .message-time {
    font-size: 12px;
    color: #666;
  }

  .message-title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .message-body {
    font-size: 14px;
    color: #ccc;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  .message-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #222;
  }

  .reply-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 13px;
    cursor: pointer;
  }

  .reply-btn:hover { color: #f59e0b; }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
  }

  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-state h3 { font-size: 18px; color: #fff; margin: 0 0 8px 0; }
  .empty-state p { font-size: 14px; color: #888; margin: 0; }

  .loading-container, .error-container {
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
  }
`;
