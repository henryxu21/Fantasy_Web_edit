"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeague } from "@/lib/store";

export default function NewLeaguePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("请输入联赛名称");
      return;
    }

    if (name.trim().length < 2) {
      setError("联赛名称至少 2 个字符");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createLeague({ name, visibility });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // 跳转到联赛页面
    router.push(`/league/${result.league.slug}`);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '24px 16px'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#f59e0b',
              margin: '0 0 8px 0'
            }}>
              创建联赛
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0
            }}>
              创建你的 Fantasy 篮球联赛
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 联赛名称 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#fff',
                marginBottom: '8px'
              }}>
                联赛名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：2024 Fantasy 联赛"
                maxLength={50}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {name.length}/50
              </div>
            </div>

            {/* 可见性 */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#fff',
                marginBottom: '8px'
              }}>
                可见性
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: visibility === "public" ? 'rgba(245, 158, 11, 0.2)' : '#1a1a1a',
                    border: visibility === "public" ? '1px solid #f59e0b' : '1px solid #333',
                    borderRadius: '10px',
                    color: visibility === "public" ? '#f59e0b' : '#888',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  🌐 公开
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: visibility === "private" ? 'rgba(245, 158, 11, 0.2)' : '#1a1a1a',
                    border: visibility === "private" ? '1px solid #f59e0b' : '1px solid #333',
                    borderRadius: '10px',
                    color: visibility === "private" ? '#f59e0b' : '#888',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  🔒 私密
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '14px',
                marginBottom: '24px'
              }}>
                {error}
              </div>
            )}

            {/* 按钮 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px'
            }}>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  color: '#888',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: submitting || !name.trim() ? '#666' : '#f59e0b',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? '创建中...' : '创建联赛'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}