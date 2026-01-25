"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { listLeagues, getSessionUser, League } from "@/lib/store";

export default function LeaguesPage() {
  const { t } = useLang();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getSessionUser();

  useEffect(() => {
    async function load() {
      const data = await listLeagues();
      // 只显示公开的联赛
      setLeagues(data.filter(l => l.visibility === "public"));
      setLoading(false);
    }
    load();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="leagues-page">
          <div className="loading">
            <p>{t("加载中...", "Loading...")}</p>
          </div>
        </main>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="leagues-page">
        <div className="container">
          {/* 头部 */}
          <div className="page-header">
            <div className="header-left">
              <h1>{t("公开联赛", "Public Leagues")}</h1>
              <p>{t("加入一个联赛，和其他玩家一起竞技", "Join a league and compete with other players")}</p>
            </div>
            <Link href="/leagues/new" className="create-btn">
              + {t("创建联赛", "Create League")}
            </Link>
          </div>

          {/* 联赛列表 */}
          {leagues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>{t("还没有公开联赛", "No public leagues yet")}</h3>
              <p>{t("成为第一个创建联赛的人！", "Be the first to create a league!")}</p>
              <Link href="/leagues/new" className="empty-btn">
                {t("创建联赛", "Create League")}
              </Link>
            </div>
          ) : (
            <div className="leagues-grid">
              {leagues.map(league => (
                <Link href={`/league/${league.slug}`} key={league.id} className="league-card">
                  <div className="league-icon">🏆</div>
                  <div className="league-info">
                    <h3 className="league-name">{league.name}</h3>
                    <div className="league-meta">
                      <span className="badge public">{t("公开", "Public")}</span>
                      <span className="date">{t("创建于", "Created")} {formatDate(league.created_at)}</span>
                    </div>
                  </div>
                  <div className="league-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .leagues-page {
    min-height: 100vh;
    background: #0a0a0a;
    padding: 24px 16px;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    gap: 16px;
  }

  .header-left h1 {
    font-size: 28px;
    font-weight: 700;
    color: #f59e0b;
    margin: 0 0 8px 0;
  }

  .header-left p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .create-btn {
    padding: 12px 24px;
    background: #f59e0b;
    color: #000;
    font-weight: 600;
    border-radius: 24px;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .create-btn:hover {
    background: #d97706;
    transform: scale(1.05);
  }

  .leagues-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .league-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .league-card:hover {
    border-color: #f59e0b;
    transform: translateX(4px);
  }

  .league-icon {
    font-size: 32px;
    width: 56px;
    height: 56px;
    background: rgba(245, 158, 11, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .league-info {
    flex: 1;
  }

  .league-name {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .league-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge.public {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .date {
    font-size: 13px;
    color: #666;
  }

  .league-arrow {
    font-size: 20px;
    color: #666;
    transition: color 0.2s;
  }

  .league-card:hover .league-arrow {
    color: #f59e0b;
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    background: #111;
    border: 1px solid #222;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    font-size: 20px;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #666;
    margin: 0 0 24px 0;
  }

  .empty-btn {
    display: inline-block;
    padding: 12px 32px;
    background: #f59e0b;
    color: #000;
    font-weight: 600;
    border-radius: 24px;
    text-decoration: none;
  }

  .loading {
    text-align: center;
    padding: 80px 20px;
    color: #666;
  }

  @media (max-width: 600px) {
    .page-header {
      flex-direction: column;
    }

    .create-btn {
      width: 100%;
      text-align: center;
    }
  }
`;
