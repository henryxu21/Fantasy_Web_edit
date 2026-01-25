"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { listInsights, listLeagues, Insight, League } from "@/lib/store";

const CATEGORIES = [
  { id: "all", label: "推荐", labelEn: "For You" },
  { id: "选秀策略", label: "选秀策略", labelEn: "Draft" },
  { id: "球员分析", label: "球员分析", labelEn: "Analysis" },
  { id: "交易建议", label: "交易建议", labelEn: "Trade" },
  { id: "新手指南", label: "新手指南", labelEn: "Guide" },
  { id: "Punt策略", label: "Punt策略", labelEn: "Punt" },
];

export default function HomePage() {
  const { t, lang } = useLang();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [insightsData, leaguesData] = await Promise.all([
          listInsights(),
          listLeagues(),
        ]);
        
        setInsights(
          insightsData.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        
        // 只取公开联赛，最多显示 5 个
        setLeagues(
          leaguesData
            .filter(l => l.visibility === "public")
            .slice(0, 5)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredInsights =
    selectedCategory === "all"
      ? insights
      : insights.filter((i) => i.tags?.includes(selectedCategory));

  const getAuthorName = (item: Insight) => {
    if (item.author?.username) return item.author.username;
    if (item.author?.name) return item.author.name;
    return "Anonymous";
  };

  const formatLikes = (num: number) => {
    const n = Number(num || 0);
    if (n >= 10000) return (n / 10000).toFixed(1) + "万";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  };

  // 获取封面图（优先 cover_url，否则取 images[0]）
  const getCoverImage = (item: Insight) => {
    if (item.cover_url) return item.cover_url;
    if (item.images && item.images.length > 0) return item.images[0];
    return null;
  };

  if (isLoading) {
    return (
      <div className="app">
        <Header />
        <main className="feed-page">
          <div className="loading">
            <div className="loading-icon">🏀</div>
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

      <main className="feed-page">
        {/* 分类导航 */}
        <nav className="category-nav">
          <div className="category-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {lang === "zh" ? cat.label : cat.labelEn}
              </button>
            ))}
          </div>
        </nav>

        <div className="feed-container">
          {/* 联赛入口 */}
          <div className="leagues-section">
            <div className="section-header">
              <h2>{t("🏆 公开联赛", "🏆 Public Leagues")}</h2>
              <Link href="/leagues" className="see-all">
                {t("查看全部", "See All")} →
              </Link>
            </div>
            
            <div className="leagues-row">
              {leagues.length === 0 ? (
                <div className="no-leagues">
                  <p>{t("还没有公开联赛", "No public leagues yet")}</p>
                </div>
              ) : (
                leagues.map(league => (
                  <Link href={`/league/${league.slug}`} key={league.id} className="league-item">
                    <span className="league-icon">🏆</span>
                    <span className="league-name">{league.name}</span>
                  </Link>
                ))
              )}
              <Link href="/leagues/new" className="league-item create-league">
                <span className="league-icon">+</span>
                <span className="league-name">{t("创建联赛", "Create")}</span>
              </Link>
            </div>
          </div>

          {/* 帖子列表 */}
          {filteredInsights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>{t("还没有内容", "No posts yet")}</h3>
              <p>{t("成为第一个发布的人吧！", "Be the first to share!")}</p>
              <Link href="/insights/new" className="empty-btn">
                {t("发布笔记", "Post Note")}
              </Link>
            </div>
          ) : (
            <div className="grid">
              {filteredInsights.map((item) => {
                const authorName = getAuthorName(item);
                const coverImage = getCoverImage(item);
                const imageCount = item.images?.length || (item.cover_url ? 1 : 0);

                return (
                  <Link href={`/insights/${item.id}`} key={item.id} className="post-card">
                    {/* 图片区域 */}
                    <div className="post-media">
                      {coverImage ? (
                        <>
                          <img src={coverImage} alt={item.title} loading="lazy" />
                          {imageCount > 1 && (
                            <div className="image-count">
                              <span>📷</span> {imageCount}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="post-placeholder">
                          <span>🏀</span>
                        </div>
                      )}
                    </div>

                    {/* 标题 */}
                    <div className="post-body">
                      <h3 className="post-title">{item.title}</h3>
                    </div>

                    {/* 底部：用户 + 点赞 */}
                    <div className="post-footer">
                      <div className="user">
                        <span className="avatar">{authorName[0]?.toUpperCase()}</span>
                        <span className="name">{authorName}</span>
                      </div>
                      <div className="like">
                        <span>❤️</span>
                        <span>{formatLikes(item.heat)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 悬浮发布按钮 */}
        <Link href="/insights/new" className="fab">
          <span>+</span>
        </Link>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .feed-page {
    min-height: 100vh;
    background: #0a0a0a;
  }

  /* 联赛入口 */
  .leagues-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #111;
    border: 1px solid #1a1a1a;
    border-radius: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .see-all {
    font-size: 14px;
    color: #f59e0b;
    text-decoration: none;
  }

  .see-all:hover {
    text-decoration: underline;
  }

  .leagues-row {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
  }

  .leagues-row::-webkit-scrollbar {
    display: none;
  }

  .league-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    background: #1a1a1a;
    border: 1px solid #222;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    min-width: 100px;
    transition: all 0.2s;
  }

  .league-item:hover {
    border-color: #f59e0b;
    transform: translateY(-2px);
  }

  .league-item .league-icon {
    font-size: 24px;
  }

  .league-item .league-name {
    font-size: 13px;
    color: #ccc;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;
  }

  .league-item.create-league {
    border-style: dashed;
    border-color: #333;
  }

  .league-item.create-league .league-icon {
    color: #f59e0b;
  }

  .league-item.create-league:hover {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .no-leagues {
    padding: 20px;
    color: #666;
    font-size: 14px;
  }

  /* 分类导航 */
  .category-nav {
    position: sticky;
    top: 60px;
    z-index: 50;
    background: #0a0a0a;
    border-bottom: 1px solid #1a1a1a;
  }

  .category-scroll {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .category-scroll::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #888;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    border-radius: 20px;
    transition: all 0.2s;
  }

  .category-tab:hover {
    color: #fff;
    background: #1a1a1a;
  }

  .category-tab.active {
    background: #f59e0b;
    color: #000;
    font-weight: 600;
  }

  /* 内容区 */
  .feed-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 16px 100px;
  }

  /* 瀑布流网格 */
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  /* 帖子卡片 */
  .post-card {
    display: flex;
    flex-direction: column;
    background: #111;
    border: 1px solid #1a1a1a;
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .post-card:hover {
    transform: translateY(-4px);
    border-color: rgba(245, 158, 11, 0.5);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  /* 图片区 */
  .post-media {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #1a1a1a;
    overflow: hidden;
  }

  .post-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .post-card:hover .post-media img {
    transform: scale(1.05);
  }

  .image-count {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 12px;
    font-size: 12px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .post-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    opacity: 0.3;
  }

  /* 标题区 */
  .post-body {
    padding: 12px;
  }

  .post-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 底部 */
  .post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 12px;
  }

  .user {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .name {
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .like {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
  }

  /* 加载状态 */
  .loading {
    text-align: center;
    padding: 120px 20px;
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

  .loading p {
    color: #666;
  }

  /* 空状态 */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    background: #111;
    border: 1px solid #1a1a1a;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    font-size: 18px;
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
    transition: all 0.2s;
  }

  .empty-btn:hover {
    background: #d97706;
    transform: scale(1.05);
  }

  /* 悬浮按钮 */
  .fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #000;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
    transition: all 0.2s;
    z-index: 100;
  }

  .fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 28px rgba(245, 158, 11, 0.5);
  }

  /* 响应式 */
  @media (max-width: 1100px) {
    .grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .post-title {
      font-size: 13px;
    }
  }
`;