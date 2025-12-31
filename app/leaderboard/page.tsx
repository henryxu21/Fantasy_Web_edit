"use client";

import Link from "next/link";

const leaderboardData = [
  { rank: 1, name: "大神阿飞", avatar: "飞", judgments: 127, accuracy: 82 },
  { rank: 2, name: "数据狂魔", avatar: "数", judgments: 98, accuracy: 79 },
  { rank: 3, name: "稳健老李", avatar: "李", judgments: 156, accuracy: 76 },
  { rank: 4, name: "选秀王", avatar: "王", judgments: 89, accuracy: 74 },
  { rank: 5, name: "少数派", avatar: "少", judgments: 67, accuracy: 71 },
  { rank: 6, name: "伤病预言家", avatar: "伤", judgments: 112, accuracy: 68 },
  { rank: 7, name: "复盘哥", avatar: "盘", judgments: 145, accuracy: 66 },
  { rank: 8, name: "拍卖专家", avatar: "拍", judgments: 78, accuracy: 65 },
  { rank: 9, name: "吃瓜群众", avatar: "瓜", judgments: 234, accuracy: 62 },
  { rank: 10, name: "新人小白", avatar: "新", judgments: 23, accuracy: 61 },
];

export default function LeaderboardPage() {
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

      <div className="lb-detail-container" style={{ maxWidth: 600 }}>
        <div className="lb-detail-card">
          <div className="lb-detail-header">
            <h1 className="lb-detail-title">🏆 Leaderboard</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Accuracy rankings based on verified judgments
            </p>
          </div>

          <div style={{ padding: "8px 0" }}>
            {leaderboardData.map((user) => (
              <div key={user.rank} className="lb-leader-item" style={{ padding: "16px 24px" }}>
                <span
                  className={`lb-leader-rank ${
                    user.rank === 1 ? "gold" : user.rank === 2 ? "silver" : user.rank === 3 ? "bronze" : ""
                  }`}
                  style={{ fontSize: 18, width: 32 }}
                >
                  {user.rank}
                </span>
                <div className={`lb-leader-avatar gradient-${(user.rank % 5) + 1}`}>
                  {user.avatar}
                </div>
                <div className="lb-leader-info">
                  <span className="lb-leader-name">{user.name}</span>
                  <span className="lb-leader-stats">{user.judgments} judgments</span>
                </div>
                <span className="lb-leader-accuracy" style={{ fontSize: 20 }}>
                  {user.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
