"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, listLeagues, League } from "@/lib/store";

export default function JoinLeaguePage() {
  const { t } = useLang();
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setUser(getSessionUser());
      // 获取所有公开联赛
      const allLeagues = await listLeagues();
      setLeagues(allLeagues.filter((l: any) => l.visibility === "public"));
    };
    loadData();
  }, []);

  const filteredLeagues = leagues.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  // 示例公开联赛（实际应用中会从数据库获取）
  const sampleLeagues = [
    { id: "1", slug: "lebron-lab", name: "LeBron Lab", members: 8, maxMembers: 12, format: "H2H Categories" },
    { id: "2", slug: "rookie-rising", name: "Rookie Rising", members: 6, maxMembers: 10, format: "Points" },
    { id: "3", slug: "dynasty-dreams", name: "Dynasty Dreams", members: 10, maxMembers: 14, format: "Rotisserie" },
    { id: "4", slug: "casual-ballers", name: "Casual Ballers", members: 4, maxMembers: 8, format: "H2H Points" },
    { id: "5", slug: "pro-league", name: "Pro League 职业联赛", members: 12, maxMembers: 16, format: "H2H Categories" },
  ];

  const displayLeagues = filteredLeagues.length > 0 ? filteredLeagues : sampleLeagues.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || search === ""
  );

  if (!user) {
    return (
      <div className="app">
        <Header />
        <main className="page-content" style={{ textAlign: "center", paddingTop: 100 }}>
          <h1 className="page-title">{t("需要登录", "Login Required")}</h1>
          <p style={{ color: "#64748b", marginBottom: 24 }}>{t("请先登录后加入联赛", "Please login to join a league")}</p>
          <Link href="/auth/login" className="btn btn-primary">{t("登录", "Login")}</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="page-content">
        <div className="page-header">
          <h1 className="page-title">{t("加入公共联赛", "Join Public League")}</h1>
          <p className="page-desc">{t("浏览并加入开放的联赛", "Browse and join open leagues")}</p>
        </div>

        <div className="filters-bar">
          <input
            className="filter-search"
            placeholder={t("搜索联赛...", "Search leagues...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <div className="leagues-list">
          {displayLeagues.length === 0 ? (
            <div className="empty-state">
              <p>{t("没有找到匹配的联赛", "No leagues found")}</p>
            </div>
          ) : (
            displayLeagues.map((league: any) => (
              <div key={league.id || league.slug} className="league-card">
                <div className="league-card-info">
                  <h3 className="league-card-name">{league.name}</h3>
                  <div className="league-card-meta">
                    <span>{league.format || "H2H Categories"}</span>
                    <span>•</span>
                    <span>{league.members || 0}/{league.maxMembers || 12} {t("队", "teams")}</span>
                  </div>
                </div>
                <Link href={`/league/${league.slug}`} className="btn btn-primary">
                  {t("加入", "Join")}
                </Link>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>{t("没找到合适的联赛？", "Can't find a suitable league?")}</p>
          <Link href="/league/new" className="btn btn-ghost">{t("创建自己的联赛", "Create Your Own League")}</Link>
        </div>
      </main>
    </div>
  );
}
