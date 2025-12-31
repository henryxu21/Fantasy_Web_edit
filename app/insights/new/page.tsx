"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInsight, getSessionUser } from "@/lib/store";

export default function NewInsightPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [conditions, setConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = getSessionUser();

  const handleSubmit = () => {
    if (!user) {
      alert("Please login first");
      router.push("/auth/login");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for your judgment");
      return;
    }

    if (!body.trim()) {
      setError("Please enter your reasoning");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = createInsight({
      title,
      body: `${body}\n\nConditions: ${conditions}`,
    });

    if (!res.ok) {
      setSubmitting(false);
      setError(res.error ?? "Failed to create judgment");
      return;
    }

    router.push(`/insights/${res.insight.id}`);
  };

  return (
    <div className="lb-new-page">
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
        </div>
      </header>

      <div className="lb-new-container">
        <div className="lb-new-card">
          <h1 className="lb-new-title">发布判断</h1>
          <p className="lb-new-subtitle">
            写下你的 Fantasy 判断，让它可追踪、可验证
          </p>

          <div className="lb-form">
            <div className="lb-form-group">
              <label className="lb-form-label">一句话判断</label>
              <input
                className="lb-form-input"
                placeholder="例如：Haliburton 本周场均 12+ 助攻"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="lb-form-group">
              <label className="lb-form-label">判断条件（可选）</label>
              <input
                className="lb-form-input"
                placeholder="例如：步行者主场, 对手防守效率后10"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="lb-form-group">
              <label className="lb-form-label">详细逻辑</label>
              <textarea
                className="lb-textarea"
                placeholder="写下你的判断依据和逻辑..."
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && <div className="lb-form-error">{error}</div>}

            <div className="lb-form-actions">
              <button
                className="lb-btn lb-btn-ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="lb-btn lb-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "发布中..." : "发布判断"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
