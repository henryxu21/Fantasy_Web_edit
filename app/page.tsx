"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { listInsights, Insight } from "@/lib/store";

type ParsedInsight = Insight & {
  coverImage?: string;
  tags?: string[];
  content?: string;
};

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
  const [insights, setInsights] = useState<ParsedInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rawInsights = await listInsights();
        const parsed = rawInsights.map((item): ParsedInsight => ({
          ...item,
          coverImage: item.cover_url,
          tags: item.tags,
          content: item.body,
        }));

        setInsights(
          parsed.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
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

  const getAuthorName = (item: ParsedInsight) => {
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

  const renderPostCard = (item: ParsedInsight) => {
    const authorName = getAuthorName(item);
    const hasImage = !!item.coverImage;

    return (
      <Link href={`/insights/${item.id}`} key={item.id} className="post-card">
        {/* 图片 */}
        <div className="post-media">
          {hasImage ? (
            <img
              src={item.coverImage}
              alt={item.title || "post"}
              loading="lazy"
            />
          ) : (
            <div className="post-placeholder">
              <div className="ph-icon">🏀</div>
              <div className="ph-title">{(item.title || "Insight").slice(0, 16)}</div>
            </div>
          )}
        </div>

        {/* 图片下方：用户名 + 点赞 */}
        <div className="post-footer">
          <div className="user">
            <span className="avatar">{authorName[0]?.toUpperCase()}</span>
            <span className="name" title={authorName}>
              {authorName}
            </span>
          </div>

          <div className="like">
            <span className="like-icon">❤️</span>
            <span className="like-num">{formatLikes(item.heat)}</span>
          </div>
        </div>
      </Link>
    );
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
        <style jsx>{`
          .feed-page {
            min-height: 100vh;
            background: var(--bg-primary);
          }
          .loading {
            text-align: center;
            padding: 120px 20px;
          }
          .loading-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .loading p {
            color: var(--text-muted);
          }
        `}</style>
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
                className={`category-tab ${
                  selectedCategory === cat.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {lang === "zh" ? cat.label : cat.labelEn}
              </button>
            ))}
          </div>
        </nav>

        <div className="feed-container">
          {filteredInsights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>{t("还没有内容", "No posts yet")}</h3>
              <p>{t("成为第一个发布洞见的人吧！", "Be the first to share!")}</p>
              <Link href="/insights/new" className="empty-btn">
                {t("发布洞见", "Post Insight")}
              </Link>
            </div>
          ) : (
            <div className="grid">
              {filteredInsights.map((item) => renderPostCard(item))}
            </div>
          )}
        </div>

        {/* 悬浮发布 */}
        <Link href="/insights/new" className="fab" aria-label="Post">
          <span>+</span>
        </Link>
      </main>

      <style jsx>{`
        .feed-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* 分类导航 */
        .category-nav {
          position: sticky;
          top: 60px;
          z-index: 50;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }
        .category-scroll {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 6px;
          padding: 12px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .category-scroll::-webkit-scrollbar {
          display: none;
        }
        .category-tab {
          padding: 8px 18px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          border-radius: 999px;
        }
        .category-tab:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .category-tab.active {
          background: var(--accent);
          color: #000;
        }

        /* 内容容器：固定网页宽度 */
        .feed-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 16px 110px;
        }

        /* ✅ 关键：网格，不重叠 */
        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          align-items: start;
        }

        /* 单个帖子卡片 */
        .post-card {
          display: block;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s ease, box-shadow 0.15s ease,
            border-color 0.15s ease;
        }
        .post-card:hover {
          transform: translateY(-3px);
          border-color: rgba(245, 158, 11, 0.7);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
        }

        /* ✅ 图片区域：统一比例，防止图片撑爆 */
        .post-media {
          width: 100%;
          aspect-ratio: 4 / 5; /* 小红书常见竖图 */
          background: rgba(255, 255, 255, 0.03);
          overflow: hidden;
        }
        .post-media img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* 永远铺满，不会撑开 */
          display: block;
        }

        /* 没图占位 */
        .post-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-align: center;
          padding: 14px;
          background: radial-gradient(
              900px 400px at 10% 10%,
              rgba(245, 158, 11, 0.18),
              transparent 60%
            ),
            rgba(255, 255, 255, 0.02);
        }
        .ph-icon {
          font-size: 34px;
          opacity: 0.9;
        }
        .ph-title {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ✅ 图片下方信息（你要的：用户名 + 点赞） */
        .post-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          gap: 10px;
        }

        .user {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .avatar {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          font-weight: 800;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .name {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .like {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
          flex-shrink: 0;
        }

        /* 空状态 */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
        }
        .empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .empty-state p {
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .empty-btn {
          display: inline-block;
          padding: 12px 28px;
          background: var(--accent);
          color: #000;
          font-weight: 700;
          border-radius: 999px;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .empty-btn:hover {
          transform: scale(1.05);
        }

        /* 悬浮发布按钮 */
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
          font-size: 32px;
          font-weight: 300;
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

        /* 桌面响应式（仍然不考虑手机，但可适配小屏幕窗口） */
        @media (max-width: 1100px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 860px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
