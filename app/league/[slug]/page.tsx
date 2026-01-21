"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, getLeagueBySlug, League } from "@/lib/store";

// 聊天消息类型
type ChatMessage = {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
};

// 队伍/成员类型
type TeamMember = {
  id: string;
  userId: string;
  username: string;
  teamName: string;
  joinedAt: number;
  points: number;
  rank: number;
  wins: number;
  losses: number;
  draftPosition?: number;
  roster?: string[];
};

// 选秀结果类型
type DraftPick = {
  round: number;
  pick: number;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
};

export default function LeagueDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "standings" | "chat" | "draft">("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // 聊天相关
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // 成员和排行榜
  const [members, setMembers] = useState<TeamMember[]>([]);
  
  // 选秀结果
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [draftStatus, setDraftStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");

  useEffect(() => {
    const loadLeague = async () => {
      const currentUser = getSessionUser();
      setUser(currentUser);
      const found = await getLeagueBySlug(slug);
      setLeague(found);
      
      if (found) {
        // 加载聊天记录
        const savedMessages = JSON.parse(localStorage.getItem(`bp_league_chat_${found.id}`) || "[]");
        setMessages(savedMessages);
        
        // 加载成员列表
        const savedMembers = JSON.parse(localStorage.getItem(`bp_league_members_${found.id}`) || "[]");
        
        const ownerId = (found as any).owner_id || (found as any).ownerId;
        const createdAt = typeof (found as any).created_at === 'string' ? new Date((found as any).created_at).getTime() : (found as any).createdAt;
        
        // 如果没有成员，添加创建者作为第一个成员
        if (savedMembers.length === 0 && currentUser && ownerId === currentUser.id) {
          const ownerMember: TeamMember = {
            id: "m1",
            userId: currentUser.id,
            username: currentUser.username,
            teamName: `${currentUser.name}'s Team`,
            joinedAt: createdAt,
            points: 0,
            rank: 1,
            wins: 0,
            losses: 0,
          };
          savedMembers.push(ownerMember);
          localStorage.setItem(`bp_league_members_${found.id}`, JSON.stringify(savedMembers));
        }
        setMembers(savedMembers);
        
        // 加载选秀结果
        const savedDraft = JSON.parse(localStorage.getItem(`bp_league_draft_${found.id}`) || "{}");
        setDraftPicks(savedDraft.picks || []);
        setDraftStatus(savedDraft.status || "not_started");
      }
      
      setLoading(false);
    };
    loadLeague();
  }, [slug]);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOwner = user && league && ((league as any).owner_id === user.id || (league as any).ownerId === user.id);
  const isMember = user && members.some(m => m.userId === user.id);

  const handleDelete = () => {
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const filtered = allLeagues.filter((l: League) => l.slug !== slug);
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    
    // 清理相关数据
    if (league) {
      localStorage.removeItem(`bp_league_chat_${league.id}`);
      localStorage.removeItem(`bp_league_members_${league.id}`);
      localStorage.removeItem(`bp_league_draft_${league.id}`);
    }
    
    alert(t("联赛已删除", "League deleted"));
    router.push("/");
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/league/join/${slug}`;
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    const inviteUrl = `${window.location.origin}/league/join/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t("加入联赛", "Join League")}: ${league?.name}`,
          text: t("快来加入我的 Fantasy 篮球联赛！", "Come join my Fantasy basketball league!"),
          url: inviteUrl,
        });
      } catch { }
    } else {
      handleCopyInviteLink();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !league || !newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      author: user.name,
      authorId: user.id,
      content: newMessage.trim(),
      createdAt: Date.now(),
    };
    
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(`bp_league_chat_${league.id}`, JSON.stringify(updatedMessages));
    setNewMessage("");
  };

  const handleJoinLeague = () => {
    if (!user || !league) return;
    
    if (isMember) {
      alert(t("你已经是联赛成员", "You are already a member"));
      return;
    }
    
    if (members.length >= 12) {
      alert(t("联赛已满", "League is full"));
      return;
    }
    
    const newMember: TeamMember = {
      id: `m${members.length + 1}`,
      userId: user.id,
      username: user.username,
      teamName: `${user.name}'s Team`,
      joinedAt: Date.now(),
      points: 0,
      rank: members.length + 1,
      wins: 0,
      losses: 0,
    };
    
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    localStorage.setItem(`bp_league_members_${league.id}`, JSON.stringify(updatedMembers));
    alert(t("成功加入联赛！", "Successfully joined the league!"));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return t("刚刚", "Just now");
    if (minutes < 60) return `${minutes} ${t("分钟前", "min ago")}`;
    if (hours < 24) return `${hours} ${t("小时前", "hours ago")}`;
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="page-content" style={{ textAlign: "center", paddingTop: 100 }}>
          <p>{t("加载中...", "Loading...")}</p>
        </main>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="app">
        <Header />
        <main className="page-content" style={{ textAlign: "center", paddingTop: 100 }}>
          <h1 className="page-title">{t("联赛不存在", "League Not Found")}</h1>
          <p style={{ color: "#64748b", marginBottom: 24 }}>{t("该联赛可能已被删除或链接无效", "This league may have been deleted or the link is invalid")}</p>
          <Link href="/" className="btn btn-primary">{t("返回首页", "Back to Home")}</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="page-content">
        {/* League Header */}
        <div className="league-header">
          <div className="league-title-section">
            <div className="league-icon-large">🏀</div>
            <div>
              <h1 className="league-title">{league.name}</h1>
              <div className="league-meta-info">
                <span className="league-badge">{league.visibility === "public" ? t("公开", "Public") : t("私人", "Private")}</span>
                <span>•</span>
                <span>{members.length}/12 {t("队伍", "teams")}</span>
                <span>•</span>
                <span>{t("创建于", "Created")} {new Date(league.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="league-actions">
            {!isMember && user && (
              <button className="btn btn-primary" onClick={handleJoinLeague}>
                {t("加入联赛", "Join League")}
              </button>
            )}
            <button className="btn btn-accent" onClick={() => setShowInviteModal(true)}>
              📤 {t("邀请", "Invite")}
            </button>
            {isOwner && (
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                {t("删除", "Delete")}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            {t("概览", "Overview")}
          </button>
          <button 
            className={`tab-btn ${activeTab === "standings" ? "active" : ""}`}
            onClick={() => setActiveTab("standings")}
          >
            {t("排行榜", "Standings")}
          </button>
          <button 
            className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            {t("讨论区", "Chat")} {messages.length > 0 && <span className="badge">{messages.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === "draft" ? "active" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            {t("选秀", "Draft")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="overview-grid">
              {/* Stats Cards */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-value">{members.length}/12</span>
                    <span className="stat-label">{t("队伍", "Teams")}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-value">{draftStatus === "completed" ? t("已完成", "Done") : draftStatus === "in_progress" ? t("进行中", "Live") : t("未开始", "Pending")}</span>
                    <span className="stat-label">{t("选秀状态", "Draft")}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <span className="stat-value">{t("第1周", "Week 1")}</span>
                    <span className="stat-label">{t("当前周", "Current")}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⚙️</div>
                  <div className="stat-info">
                    <span className="stat-value">{t("蛇形", "Snake")}</span>
                    <span className="stat-label">{t("选秀方式", "Draft Type")}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="section-card">
                <h3 className="section-title">{t("快速操作", "Quick Actions")}</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => setShowInviteModal(true)}>
                    <span className="action-icon">📤</span>
                    <span>{t("邀请成员", "Invite Members")}</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab("standings")}>
                    <span className="action-icon">📊</span>
                    <span>{t("查看排行榜", "View Standings")}</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab("draft")}>
                    <span className="action-icon">📋</span>
                    <span>{t("选秀大厅", "Draft Room")}</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">⚙️</span>
                    <span>{t("联赛设置", "Settings")}</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="section-card">
                <h3 className="section-title">{t("最近动态", "Recent Activity")}</h3>
                {messages.length === 0 && members.length <= 1 ? (
                  <div className="empty-activity">
                    <p>{t("暂无动态，邀请好友加入吧！", "No activity yet. Invite friends to join!")}</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {members.slice(-3).reverse().map(member => (
                      <div key={member.id} className="activity-item">
                        <div className="activity-avatar">{member.username[0]?.toUpperCase()}</div>
                        <div className="activity-content">
                          <span className="activity-text">
                            <strong>@{member.username}</strong> {t("加入了联赛", "joined the league")}
                          </span>
                          <span className="activity-time">{formatDate(member.joinedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standings Tab */}
          {activeTab === "standings" && (
            <div className="standings-section">
              <div className="section-card">
                <h3 className="section-title">{t("联赛排行榜", "League Standings")}</h3>
                {members.length === 0 ? (
                  <div className="empty-state">
                    <p>{t("暂无成员", "No members yet")}</p>
                  </div>
                ) : (
                  <div className="standings-table">
                    <div className="table-header">
                      <span className="col-rank">{t("排名", "Rank")}</span>
                      <span className="col-team">{t("队伍", "Team")}</span>
                      <span className="col-record">{t("战绩", "Record")}</span>
                      <span className="col-points">{t("积分", "Points")}</span>
                    </div>
                    {members.sort((a, b) => b.points - a.points || a.rank - b.rank).map((member, index) => (
                      <div key={member.id} className={`table-row ${member.userId === user?.id ? "highlight" : ""}`}>
                        <span className="col-rank">
                          <span className={`rank-badge ${index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : ""}`}>
                            {index + 1}
                          </span>
                        </span>
                        <span className="col-team">
                          <div className="team-info">
                            <div className="team-avatar">{member.username[0]?.toUpperCase()}</div>
                            <div>
                              <div className="team-name">{member.teamName}</div>
                              <div className="team-owner">@{member.username}</div>
                            </div>
                          </div>
                        </span>
                        <span className="col-record">{member.wins}-{member.losses}</span>
                        <span className="col-points">{member.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="chat-section">
              <div className="section-card chat-card">
                <h3 className="section-title">{t("联赛讨论区", "League Chat")}</h3>
                
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      <p>{t("还没有消息，发送第一条吧！", "No messages yet. Send the first one!")}</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`message ${msg.authorId === user?.id ? "own" : ""}`}
                      >
                        {msg.authorId !== user?.id && (
                          <div className="message-avatar">{msg.author[0]?.toUpperCase()}</div>
                        )}
                        <div className="message-content">
                          {msg.authorId !== user?.id && (
                            <span className="message-author">{msg.author}</span>
                          )}
                          <div className="message-bubble">
                            {msg.content}
                          </div>
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {user ? (
                  <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      className="chat-input"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("输入消息...", "Type a message...")}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                      {t("发送", "Send")}
                    </button>
                  </form>
                ) : (
                  <div className="chat-login-prompt">
                    <p>{t("请登录后参与讨论", "Please login to chat")}</p>
                    <Link href="/auth/login" className="btn btn-primary">{t("登录", "Login")}</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Draft Tab */}
          {activeTab === "draft" && (
            <div className="draft-section">
              <div className="section-card">
                <div className="draft-header">
                  <h3 className="section-title">{t("选秀大厅", "Draft Room")}</h3>
                  <span className={`draft-status ${draftStatus}`}>
                    {draftStatus === "completed" ? t("已完成", "Completed") : 
                     draftStatus === "in_progress" ? t("进行中", "In Progress") : 
                     t("未开始", "Not Started")}
                  </span>
                </div>
                
                {draftStatus === "not_started" ? (
                  <div className="draft-not-started">
                    <div className="draft-info-card">
                      <h4>{t("选秀信息", "Draft Information")}</h4>
                      <div className="draft-details">
                        <div className="detail-row">
                          <span>{t("选秀方式", "Draft Type")}</span>
                          <span>{t("蛇形选秀", "Snake Draft")}</span>
                        </div>
                        <div className="detail-row">
                          <span>{t("每队选秀人数", "Roster Size")}</span>
                          <span>13 {t("人", "players")}</span>
                        </div>
                        <div className="detail-row">
                          <span>{t("选秀时限", "Time per Pick")}</span>
                          <span>90 {t("秒", "seconds")}</span>
                        </div>
                        <div className="detail-row">
                          <span>{t("当前队伍", "Current Teams")}</span>
                          <span>{members.length}/12</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="draft-order">
                      <h4>{t("选秀顺序", "Draft Order")}</h4>
                      {members.length < 2 ? (
                        <p className="draft-hint">{t("至少需要2个队伍才能开始选秀", "Need at least 2 teams to start draft")}</p>
                      ) : (
                        <div className="order-list">
                          {members.map((member, index) => (
                            <div key={member.id} className="order-item">
                              <span className="order-number">{index + 1}</span>
                              <span className="order-team">{member.teamName}</span>
                              <span className="order-owner">@{member.username}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {isOwner && members.length >= 2 && (
                      <button className="btn btn-primary btn-lg start-draft-btn">
                        {t("开始选秀", "Start Draft")}
                      </button>
                    )}
                  </div>
                ) : draftStatus === "completed" ? (
                  <div className="draft-results">
                    <h4>{t("选秀结果", "Draft Results")}</h4>
                    {draftPicks.length === 0 ? (
                      <p className="empty-hint">{t("暂无选秀数据", "No draft data available")}</p>
                    ) : (
                      <div className="picks-list">
                        {draftPicks.map((pick, index) => (
                          <div key={index} className="pick-item">
                            <span className="pick-number">R{pick.round}P{pick.pick}</span>
                            <span className="pick-team">{pick.teamName}</span>
                            <span className="pick-player">{pick.playerName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="draft-live">
                    <p>{t("选秀正在进行中...", "Draft is in progress...")}</p>
                    <Link href={`/league/${slug}/draft`} className="btn btn-primary">
                      {t("进入选秀房间", "Enter Draft Room")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="modal-content invite-modal" onClick={e => e.stopPropagation()}>
              <h3>{t("邀请成员", "Invite Members")}</h3>
              <p className="modal-desc">{t("分享以下链接邀请好友加入联赛", "Share this link to invite friends")}</p>
              
              <div className="invite-link-box">
                <input 
                  type="text" 
                  readOnly 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/league/join/${slug}`}
                  className="invite-link-input"
                />
                <button 
                  className={`btn ${inviteCopied ? "btn-success" : "btn-primary"}`}
                  onClick={handleCopyInviteLink}
                >
                  {inviteCopied ? t("已复制!", "Copied!") : t("复制", "Copy")}
                </button>
              </div>
              
              <div className="invite-actions">
                <button className="btn btn-accent" onClick={handleShareInvite}>
                  📤 {t("分享链接", "Share Link")}
                </button>
              </div>
              
              <div className="invite-qr">
                <p className="qr-hint">{t("或扫描二维码加入", "Or scan QR code to join")}</p>
                <div className="qr-placeholder">
                  <span>QR</span>
                </div>
              </div>
              
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>
                {t("确定要删除这个联赛吗？所有数据将被清除，此操作无法撤销。", "Are you sure? All league data will be deleted. This cannot be undone.")}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  {t("取消", "Cancel")}
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  {t("删除", "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .league-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .league-title-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .league-icon-large {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }
        .league-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .league-meta-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .league-badge {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .league-actions {
          display: flex;
          gap: 12px;
        }
        .tabs-nav {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 24px;
          overflow-x: auto;
        }
        .tab-btn {
          padding: 12px 20px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn:hover {
          color: var(--text-primary);
        }
        .tab-btn.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .tab-btn .badge {
          background: var(--accent);
          color: #000;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .overview-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
        }
        .section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .action-icon {
          font-size: 24px;
        }
        .empty-activity, .empty-state, .empty-chat {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .activity-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #000;
        }
        .activity-content {
          display: flex;
          flex-direction: column;
        }
        .activity-time {
          font-size: 12px;
          color: var(--text-muted);
        }
        .standings-table {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }
        .table-header, .table-row {
          display: grid;
          grid-template-columns: 60px 1fr 100px 80px;
          align-items: center;
          padding: 12px 16px;
        }
        .table-header {
          background: var(--bg-secondary);
          font-weight: 600;
          font-size: 13px;
          color: var(--text-muted);
        }
        .table-row {
          border-top: 1px solid var(--border-color);
        }
        .table-row.highlight {
          background: rgba(245, 158, 11, 0.1);
        }
        .rank-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          background: var(--bg-secondary);
        }
        .rank-badge.gold { background: #eab308; color: #000; }
        .rank-badge.silver { background: #94a3b8; color: #000; }
        .rank-badge.bronze { background: #cd7f32; color: #000; }
        .team-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .team-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #000;
        }
        .team-name {
          font-weight: 500;
        }
        .team-owner {
          font-size: 12px;
          color: var(--text-muted);
        }
        .chat-card {
          display: flex;
          flex-direction: column;
          height: 500px;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .message {
          display: flex;
          gap: 12px;
          max-width: 80%;
        }
        .message.own {
          margin-left: auto;
          flex-direction: row-reverse;
        }
        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #000;
          flex-shrink: 0;
        }
        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .message.own .message-content {
          align-items: flex-end;
        }
        .message-author {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .message-bubble {
          background: var(--bg-secondary);
          padding: 10px 14px;
          border-radius: 16px;
          border-top-left-radius: 4px;
        }
        .message.own .message-bubble {
          background: var(--accent);
          color: #000;
          border-top-left-radius: 16px;
          border-top-right-radius: 4px;
        }
        .message-time {
          font-size: 11px;
          color: var(--text-muted);
        }
        .chat-input-form {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
        .chat-input {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 12px 20px;
          color: var(--text-primary);
        }
        .chat-input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .chat-login-prompt {
          text-align: center;
          padding: 20px;
          border-top: 1px solid var(--border-color);
        }
        .chat-login-prompt p {
          margin-bottom: 12px;
          color: var(--text-muted);
        }
        .draft-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .draft-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .draft-status.not_started {
          background: var(--bg-secondary);
          color: var(--text-muted);
        }
        .draft-status.in_progress {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .draft-status.completed {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent);
        }
        .draft-not-started {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .draft-info-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 20px;
        }
        .draft-info-card h4 {
          margin-bottom: 16px;
        }
        .draft-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
        }
        .detail-row span:first-child {
          color: var(--text-muted);
        }
        .draft-order h4 {
          margin-bottom: 16px;
        }
        .draft-hint {
          color: var(--text-muted);
          font-size: 14px;
        }
        .order-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .order-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }
        .order-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .order-team {
          flex: 1;
          font-weight: 500;
        }
        .order-owner {
          color: var(--text-muted);
          font-size: 13px;
        }
        .start-draft-btn {
          align-self: center;
          padding: 16px 48px;
          font-size: 16px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text-muted);
        }
        .modal-desc {
          color: var(--text-muted);
          margin: 8px 0 24px;
        }
        .invite-link-box {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .invite-link-input {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          color: var(--text-primary);
          font-size: 13px;
        }
        .btn-success {
          background: #22c55e;
          color: #fff;
        }
        .invite-actions {
          margin-bottom: 24px;
        }
        .invite-qr {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
        }
        .qr-hint {
          color: var(--text-muted);
          font-size: 13px;
          margin-bottom: 16px;
        }
        .qr-placeholder {
          width: 120px;
          height: 120px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .league-header {
            flex-direction: column;
          }
          .league-actions {
            width: 100%;
          }
          .table-header, .table-row {
            grid-template-columns: 50px 1fr 70px;
          }
          .col-points {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
