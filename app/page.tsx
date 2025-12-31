/* app/page.tsx - 蓝本 Fantasy 小红书风格首页 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Section = "全部" | "判断" | "选秀" | "复盘" | "观战";

type JudgmentCard = {
  id: string;
  type: "judgment" | "draft" | "review" | "spectate";
  author: {
    name: string;
    avatar: string;
    accuracy?: number;
  };
  content: {
    headline: string;
    conditions?: string[];
    divergence?: number;
  };
  engagement: {
    agrees: number;
    comments: number;
  };
  timestamp: string;
  status?: "pending" | "correct" | "wrong";
  isHot?: boolean;
};

const mockCards: JudgmentCard[] = [
  {
    id: "1",
    type: "judgment",
    author: { name: "大神阿飞", avatar: "飞", accuracy: 82 },
    content: {
      headline: "Haliburton 本周场均 12+ 助攻",
      conditions: ["步行者主场", "对手防守效率后10"],
      divergence: 78,
    },
    engagement: { agrees: 412, comments: 86 },
    timestamp: "2小时前",
    status: "pending",
    isHot: true,
  },
  {
    id: "2",
    type: "judgment",
    author: { name: "稳健老李", avatar: "李", accuracy: 76 },
    content: {
      headline: "AD 这个月不会伤退",
      conditions: ["轮休政策", "赛程密度低"],
      divergence: 52,
    },
    engagement: { agrees: 238, comments: 124 },
    timestamp: "5小时前",
    status: "wrong",
  },
  {
    id: "3",
    type: "draft",
    author: { name: "选秀王", avatar: "王" },
    content: {
      headline: "为什么我在 1.06 放弃了 Tatum",
      conditions: ["9-CAT", "Punting FT%"],
    },
    engagement: { agrees: 891, comments: 203 },
    timestamp: "昨天",
  },
  {
    id: "4",
    type: "judgment",
    author: { name: "数据狂魔", avatar: "数", accuracy: 79 },
    content: {
      headline: "Wemby 下半赛季场均 25+",
      conditions: ["使用率提升", "马刺开始摆烂"],
      divergence: 65,
    },
    engagement: { agrees: 567, comments: 156 },
    timestamp: "3小时前",
    status: "pending",
  },
  {
    id: "5",
    type: "review",
    author: { name: "复盘哥", avatar: "盘" },
    content: {
      headline: "上周判断复盘：67% 命中率",
      conditions: ["50个判断", "12个翻车"],
    },
    engagement: { agrees: 324, comments: 89 },
    timestamp: "1天前",
  },
  {
    id: "6",
    type: "spectate",
    author: { name: "吃瓜群众", avatar: "瓜" },
    content: {
      headline: "这场比赛分歧最大",
      conditions: ["LAL vs GSW", "一半人 All-in 主队"],
      divergence: 51,
    },
    engagement: { agrees: 189, comments: 67 },
    timestamp: "实时",
    isHot: true,
  },
  {
    id: "7",
    type: "judgment",
    author: { name: "少数派", avatar: "少", accuracy: 71 },
    content: {
      headline: "Kawhi 本赛季能打 60 场",
      conditions: ["轮休计划", "无重大伤病"],
      divergence: 23,
    },
    engagement: { agrees: 45, comments: 234 },
    timestamp: "6小时前",
    status: "pending",
  },
  {
    id: "8",
    type: "draft",
    author: { name: "拍卖专家", avatar: "拍" },
    content: {
      headline: "拍卖联赛：别追稀缺叙事",
      conditions: ["$200预算", "中锋被高估"],
    },
    engagement: { agrees: 456, comments: 98 },
    timestamp: "2天前",
  },
  {
    id: "9",
    type: "judgment",
    author: { name: "伤病预言家", avatar: "伤", accuracy: 68 },
    content: {
      headline: "Ja Morant 复出后场均 20+",
      conditions: ["膝伤恢复顺利", "灰熊需要他"],
      divergence: 61,
    },
    engagement: { agrees: 234, comments: 178 },
    timestamp: "4小时前",
    status: "pending",
  },
  {
    id: "10",
    type: "spectate",
    author: { name: "赛事观察", avatar: "观" },
    content: {
      headline: "赛前2小时，判断突然反转",
      conditions: ["一条伤病消息", "改变了38%的人想法"],
      divergence: 62,
    },
    engagement: { agrees: 189, comments: 45 },
    timestamp: "刚刚",
    isHot: true,
  },
];

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [me, setMe] = useState<{ name: string; username: string } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("全部");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bp_session");
      if (!raw) return;
      const u = JSON.parse(raw) as { name?: string };
      if (!u?.name) return;
      const username = u.name.toLowerCase().replace(/\s+/g, "");
      setMe({ name: u.name, username });
      setAuthed(true);
    } catch {
      // ignore
    }
  }, []);

  const sections: Section[] = ["全部", "判断", "选秀", "复盘", "观战"];

  const filteredCards = mockCards.filter((card) => {
    if (activeSection === "全部") return true;
    if (activeSection === "判断") return card.type === "judgment";
    if (activeSection === "选秀") return card.type === "draft";
    if (activeSection === "复盘") return card.type === "review";
    if (activeSection === "观战") return card.type === "spectate";
    return true;
  });

  return (
    <div className="lb-app">
      {/* Header */}
      <header className="lb-header">
        <div className="lb-header-inner">
          <Link href="/" className="lb-logo">
            <div className="lb-logo-icon">蓝</div>
            <div className="lb-logo-text">
              <span className="lb-logo-title">蓝本</span>
              <span className="lb-logo-sub">Fantasy 决策平台</span>
            </div>
          </Link>

          <div className="lb-search">
            <svg className="lb-search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input placeholder="搜索球员、判断、用户..." />
          </div>

          <div className="lb-header-actions">
            {!authed ? (
              <>
                <Link href="/auth/login" className="lb-btn lb-btn-ghost">
                  登录
                </Link>
                <Link href="/auth/signup" className="lb-btn lb-btn-primary">
                  注册
                </Link>
              </>
            ) : (
              <>
                <Link href="/insights/new" className="lb-btn lb-btn-primary">
                  + 发布判断
                </Link>
                <Link href={`/u/${me?.username}`} className="lb-avatar-btn">
                  {me?.name?.[0] || "我"}
                </Link>
                <button
                  className="lb-btn lb-btn-ghost"
                  onClick={() => {
                    localStorage.removeItem("bp_session");
                    setMe(null);
                    setAuthed(false);
                  }}
                >
                  退出
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sections */}
      <nav className="lb-nav">
        <div className="lb-nav-inner">
          {sections.map((section) => (
            <button
              key={section}
              className={`lb-nav-item ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lb-main">
        <div className="lb-container">
          {/* Feed Grid - Xiaohongshu Style Masonry */}
          <div className="lb-feed">
            {filteredCards.map((card) => (
              <JudgmentCardComponent key={card.id} card={card} />
            ))}
          </div>

          {/* Right Sidebar */}
          <aside className="lb-sidebar">
            {/* Hot Topics */}
            <div className="lb-widget">
              <h3 className="lb-widget-title">🔥 热门话题</h3>
              <div className="lb-topic-list">
                <Link href="/topics/wemby" className="lb-topic-item">
                  <span className="lb-topic-rank hot">1</span>
                  <div className="lb-topic-content">
                    <p>Wemby 新秀年值不值首轮？</p>
                    <span className="lb-topic-stats">5.2k 讨论</span>
                  </div>
                </Link>
                <Link href="/topics/overrated" className="lb-topic-item">
                  <span className="lb-topic-rank hot">2</span>
                  <div className="lb-topic-content">
                    <p>谁是今年最容易被高估的球员？</p>
                    <span className="lb-topic-stats">3.8k 讨论</span>
                  </div>
                </Link>
                <Link href="/topics/centers" className="lb-topic-item">
                  <span className="lb-topic-rank hot">3</span>
                  <div className="lb-topic-content">
                    <p>中锋荒时代：哪些中锋被低估</p>
                    <span className="lb-topic-stats">2.1k 讨论</span>
                  </div>
                </Link>
                <Link href="/topics/injury" className="lb-topic-item">
                  <span className="lb-topic-rank">4</span>
                  <div className="lb-topic-content">
                    <p>伤病大年？如何构建抗伤阵容</p>
                    <span className="lb-topic-stats">1.8k 讨论</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="lb-widget">
              <h3 className="lb-widget-title">🏆 判断准确率榜</h3>
              <div className="lb-leaderboard">
                <div className="lb-leader-item">
                  <span className="lb-leader-rank gold">1</span>
                  <div className="lb-leader-avatar gradient-1">飞</div>
                  <div className="lb-leader-info">
                    <span className="lb-leader-name">大神阿飞</span>
                    <span className="lb-leader-stats">127 判断</span>
                  </div>
                  <span className="lb-leader-accuracy">82%</span>
                </div>
                <div className="lb-leader-item">
                  <span className="lb-leader-rank silver">2</span>
                  <div className="lb-leader-avatar gradient-2">数</div>
                  <div className="lb-leader-info">
                    <span className="lb-leader-name">数据狂魔</span>
                    <span className="lb-leader-stats">98 判断</span>
                  </div>
                  <span className="lb-leader-accuracy">79%</span>
                </div>
                <div className="lb-leader-item">
                  <span className="lb-leader-rank bronze">3</span>
                  <div className="lb-leader-avatar gradient-3">李</div>
                  <div className="lb-leader-info">
                    <span className="lb-leader-name">稳健老李</span>
                    <span className="lb-leader-stats">156 判断</span>
                  </div>
                  <span className="lb-leader-accuracy">76%</span>
                </div>
              </div>
              <Link href="/leaderboard" className="lb-widget-link">
                查看完整榜单 →
              </Link>
            </div>

            {/* CTA */}
            <div className="lb-cta">
              <h3>开始记录你的判断</h3>
              <p>让每一个决策都可追踪、可验证</p>
              <Link href="/auth/signup" className="lb-cta-btn">
                立即加入
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function JudgmentCardComponent({ card }: { card: JudgmentCard }) {
  const [expanded, setExpanded] = useState(false);

  const getTypeLabel = () => {
    switch (card.type) {
      case "judgment":
        return { text: "判断", class: "type-judgment" };
      case "draft":
        return { text: "选秀", class: "type-draft" };
      case "review":
        return { text: "复盘", class: "type-review" };
      case "spectate":
        return { text: "观战", class: "type-spectate" };
    }
  };

  const getStatusBadge = () => {
    if (!card.status) return null;
    switch (card.status) {
      case "pending":
        return <span className="lb-status pending">⏳ 待验证</span>;
      case "correct":
        return <span className="lb-status correct">✓ 判断正确</span>;
      case "wrong":
        return <span className="lb-status wrong">✗ 被打脸</span>;
    }
  };

  const typeInfo = getTypeLabel();

  return (
    <article className="lb-card" onClick={() => setExpanded(!expanded)}>
      {/* Card Header */}
      <div className="lb-card-header">
        <div className="lb-card-author">
          <div className={`lb-card-avatar gradient-${(parseInt(card.id) % 5) + 1}`}>
            {card.author.avatar}
          </div>
          <div className="lb-card-author-info">
            <span className="lb-card-author-name">{card.author.name}</span>
            {card.author.accuracy && (
              <span className="lb-card-author-accuracy">{card.author.accuracy}% 准确</span>
            )}
          </div>
        </div>
        <span className={`lb-card-type ${typeInfo.class}`}>{typeInfo.text}</span>
      </div>

      {/* Main Content - 一句话判断 */}
      <div className="lb-card-content">
        <h3 className="lb-card-headline">
          {card.isHot && <span className="lb-hot-badge">🔥</span>}
          {card.content.headline}
        </h3>

        {/* Conditions - 1-2个条件 */}
        {card.content.conditions && (
          <div className="lb-card-conditions">
            {card.content.conditions.slice(0, 2).map((cond, i) => (
              <span key={i} className="lb-condition-tag">
                {cond}
              </span>
            ))}
          </div>
        )}

        {/* Divergence - 群体分歧比例 */}
        {card.content.divergence !== undefined && (
          <div className="lb-card-divergence">
            <div className="lb-divergence-bar">
              <div
                className="lb-divergence-fill"
                style={{ width: `${card.content.divergence}%` }}
              />
            </div>
            <span className="lb-divergence-text">
              {card.content.divergence}% 认同
            </span>
          </div>
        )}

        {/* Status */}
        {getStatusBadge()}
      </div>

      {/* Card Footer - 只有两个动作入口 */}
      <div className="lb-card-footer">
        <button className="lb-action-btn primary" onClick={(e) => e.stopPropagation()}>
          <span>👍</span>
          <span>{card.engagement.agrees}</span>
        </button>
        <button className="lb-action-btn" onClick={(e) => e.stopPropagation()}>
          <span>💬</span>
          <span>看分歧</span>
        </button>
        <span className="lb-card-time">{card.timestamp}</span>
      </div>

      {/* Expanded Content - 高级信息折叠在第二层 */}
      {expanded && (
        <div className="lb-card-expanded">
          <div className="lb-expanded-section">
            <h4>详细逻辑</h4>
            <p>点击查看完整判断依据和历史对比...</p>
          </div>
          <Link 
            href={`/insights/${card.id}`} 
            className="lb-view-detail"
            onClick={(e) => e.stopPropagation()}
          >
            查看详情 →
          </Link>
        </div>
      )}
    </article>
  );
}
