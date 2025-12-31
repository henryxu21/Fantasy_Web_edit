"use client";

import Link from "next/link";

const topics = [
  { slug: "wemby", title: "Wemby 新秀年值不值首轮？", discussions: 5200, trending: true },
  { slug: "overrated", title: "谁是今年最容易被高估的球员？", discussions: 3800, trending: true },
  { slug: "centers", title: "中锋荒时代：哪些中锋被低估", discussions: 2100, trending: true },
  { slug: "injury", title: "伤病大年？如何构建抗伤阵容", discussions: 1800, trending: false },
  { slug: "h2h-vs-roto", title: "H2H vs Roto：哪种赛制更好玩", discussions: 2900, trending: false },
  { slug: "punting", title: "Punting 策略详解", discussions: 1500, trending: false },
  { slug: "auction", title: "拍卖联赛生存指南", discussions: 1200, trending: false },
  { slug: "rookies", title: "新秀 Fantasy 价值评估", discussions: 980, trending: false },
];

export default function TopicsPage() {
  return (
    <div className="lb-detail-page">
      <header className="lb-header">
        <div className="lb-header-inner">
          <Link href="/" className="lb-logo">
            <div className="lb-logo-icon">蓝</div>
            <div className="lb-logo-text">
              <span className="lb-logo-title">蓝本</span>
              <span className="lb-logo-sub">Fantasy 决策平台</span>
            </div>
          </Link>
          <div className="lb-header-actions">
            <Link href="/" className="lb-btn lb-btn-ghost">
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="lb-detail-container" style={{ maxWidth: 700 }}>
        <div className="lb-detail-card">
          <div className="lb-detail-header">
            <h1 className="lb-detail-title">🔥 Hot Topics</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Join the discussion on trending Fantasy topics
            </p>
          </div>

          <div style={{ padding: "8px 0" }}>
            {topics.map((topic, index) => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="lb-topic-item"
                style={{ padding: "16px 24px" }}
              >
                <span className={`lb-topic-rank ${topic.trending ? "hot" : ""}`}>
                  {index + 1}
                </span>
                <div className="lb-topic-content">
                  <p style={{ fontWeight: 600 }}>{topic.title}</p>
                  <span className="lb-topic-stats">
                    {topic.discussions.toLocaleString()} discussions
                    {topic.trending && " · Trending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
