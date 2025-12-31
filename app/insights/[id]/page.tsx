"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listInsights, Insight } from "@/lib/store";

export default function InsightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const all = listInsights();
    const found = all.find((i) => i.id === id) ?? null;

    setInsight(found);
    setLoading(false);
  }, [id]);

  if (loading) {
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
          </div>
        </header>
        <div className="lb-detail-container">
          <div className="lb-detail-card">
            <div className="lb-detail-header">
              <p style={{ color: "#9ca3af" }}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insight) {
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
          </div>
        </header>
        <div className="lb-detail-container">
          <div className="lb-detail-card">
            <div className="lb-detail-header">
              <h1 className="lb-detail-title">Judgment Not Found</h1>
              <p style={{ color: "#9ca3af" }}>
                This judgment may have been deleted or does not exist.
              </p>
            </div>
            <div className="lb-detail-footer">
              <button className="lb-back-btn" onClick={() => router.push("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        </div>
      </header>

      <div className="lb-detail-container">
        <div className="lb-detail-card">
          <div className="lb-detail-header">
            <h1 className="lb-detail-title">{insight.title}</h1>
            <div className="lb-detail-meta">
              <span>by {insight.author}</span>
              <span>|</span>
              <span>{new Date(insight.createdAt).toLocaleString()}</span>
              <span>|</span>
              <span>🔥 {insight.heat}</span>
            </div>
          </div>

          <div className="lb-detail-body">{insight.body}</div>

          <div className="lb-detail-footer">
            <button className="lb-back-btn" onClick={() => router.back()}>
              Back
            </button>
            <button className="lb-back-btn" onClick={() => router.push("/")}>
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
