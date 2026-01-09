"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, getLeagueBySlug, League } from "@/lib/store";

export default function LeagueDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());
    const found = getLeagueBySlug(slug);
    setLeague(found);
    setLoading(false);
  }, [slug]);

  const isOwner = user && league && league.ownerId === user.id;

  const handleDelete = () => {
    // 直接在 localStorage 中删除
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const filtered = allLeagues.filter((l: League) => l.slug !== slug);
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    
    alert(t("联赛已删除", "League deleted"));
    router.push("/");
  };

  const handleDeleteAllDuplicates = () => {
    // 删除所有名为 "1234" 的联赛
    const allLeagues = JSON.parse(localStorage.getItem("bp_leagues") || "[]");
    const filtered = allLeagues.filter((l: League) => l.name !== "1234");
    localStorage.setItem("bp_leagues", JSON.stringify(filtered));
    
    alert(t("已删除所有重复联赛", "Deleted all duplicate leagues"));
    router.push("/");
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
        <div className="league-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">{league.name}</h1>
            <p style={{ color: "var(--text-muted)" }}>
              {league.visibility === "public" ? t("公开联赛", "Public League") : t("私人联赛", "Private League")}
              {" · "}
              {t("创建于", "Created")} {new Date(league.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {isOwner && (
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("删除联赛", "Delete League")}
            </button>
          )}
        </div>

        {/* League Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>{t("队伍数量", "Teams")}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>0 / 12</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>{t("赛季状态", "Status")}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{t("招募中", "Recruiting")}</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>{t("选秀方式", "Draft Type")}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{t("蛇形", "Snake")}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{t("快速操作", "Quick Actions")}</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary">{t("邀请成员", "Invite Members")}</button>
            <button className="btn btn-ghost">{t("联赛设置", "League Settings")}</button>
            <button className="btn btn-ghost">{t("开始选秀", "Start Draft")}</button>
          </div>
        </div>

        {/* Members List */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{t("成员列表", "Members")}</h3>
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
            {t("暂无其他成员，邀请好友加入吧！", "No members yet. Invite friends to join!")}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>
                {t("确定要删除这个联赛吗？此操作无法撤销。", "Are you sure you want to delete this league? This action cannot be undone.")}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  {t("取消", "Cancel")}
                </button>
                {league.name === "1234" && (
                  <button className="btn btn-danger" onClick={handleDeleteAllDuplicates}>
                    {t("删除所有重复联赛", "Delete All Duplicates")}
                  </button>
                )}
                <button className="btn btn-danger" onClick={handleDelete}>
                  {t("删除", "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
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
          border-radius: 12px;
          padding: 24px;
          max-width: 450px;
          width: 90%;
        }
      `}</style>
    </div>
  );
}
