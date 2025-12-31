"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const topicData: Record<string, { title: string; description: string; judgments: Array<{ headline: string; author: string; agrees: number; divergence: number }> }> = {
  wemby: {
    title: "Wemby 新秀年值不值首轮？",
    description: "Victor Wembanyama's rookie year Fantasy value - is he worth a first-round pick?",
    judgments: [
      { headline: "Wemby 下半赛季场均 25+", author: "数据狂魔", agrees: 567, divergence: 65 },
      { headline: "新秀年盖帽王稳了", author: "大神阿飞", agrees: 423, divergence: 78 },
      { headline: "马刺会限制他的上场时间", author: "少数派", agrees: 234, divergence: 42 },
    ],
  },
  overrated: {
    title: "谁是今年最容易被高估的球员？",
    description: "Which players are being drafted too high relative to their expected value?",
    judgments: [
      { headline: "AD 的 ADP 太高了", author: "稳健老李", agrees: 891, divergence: 71 },
      { headline: "Kawhi 被高估得离谱", author: "伤病预言家", agrees: 756, divergence: 85 },
      { headline: "Zion 永远是陷阱", author: "复盘哥", agrees: 654, divergence: 82 },
    ],
  },
  centers: {
    title: "中锋荒时代：哪些中锋被低估",
    description: "In an era of center scarcity, which big men are flying under the radar?",
    judgments: [
      { headline: "Chet 第二年会爆发", author: "选秀王", agrees: 445, divergence: 58 },
      { headline: "Walker Kessler 是隐藏宝石", author: "数据狂魔", agrees: 312, divergence: 63 },
      { headline: "Sengun 被严重低估", author: "大神阿飞", agrees: 289, divergence: 72 },
    ],
  },
  injury: {
    title: "伤病大年？如何构建抗伤阵容",
    description: "Strategies for building a roster that can survive the injury bug.",
    judgments: [
      { headline: "轮休政策会毁掉你的赛季", author: "稳健老李", agrees: 567, divergence: 76 },
      { headline: "优先选择铁人", author: "复盘哥", agrees: 445, divergence: 81 },
      { headline: "不要在前三轮选伤病大户", author: "少数派", agrees: 398, divergence: 69 },
    ],
  },
};

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = topicData[slug] || {
    title: "Topic",
    description: "Discussion topic",
    judgments: [],
  };

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
            <Link href="/topics" className="lb-btn lb-btn-ghost">
              All Topics
            </Link>
            <Link href="/" className="lb-btn lb-btn-ghost">
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="lb-detail-container" style={{ maxWidth: 700 }}>
        <div className="lb-detail-card">
          <div className="lb-detail-header">
            <h1 className="lb-detail-title">{topic.title}</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>{topic.description}</p>
          </div>

          <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#374151" }}>
              Related Judgments
            </h3>

            {topic.judgments.map((j, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: "#f9fafb",
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#1f2937" }}>
                  {j.headline}
                </h4>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
                  <span>by {j.author}</span>
                  <span>👍 {j.agrees}</span>
                  <span>{j.divergence}% agree</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
