"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim() && pw.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setErr(null);

    const res = login(email, pw);
    if (!res.ok) {
      setErr(res.error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="lb-auth-page">
      <div className="lb-auth-card">
        <div className="lb-auth-header">
          <Link href="/" className="lb-logo" style={{ justifyContent: "center", marginBottom: 24 }}>
            <div className="lb-logo-icon">蓝</div>
            <div className="lb-logo-text">
              <span className="lb-logo-title">蓝本</span>
              <span className="lb-logo-sub">Fantasy 决策平台</span>
            </div>
          </Link>
          <h1>登录</h1>
          <p>欢迎回来，继续记录你的判断</p>
        </div>

        <form className="lb-form" onSubmit={handleSubmit}>
          <div className="lb-form-group">
            <label className="lb-form-label">邮箱</label>
            <input
              className="lb-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="lb-form-group">
            <label className="lb-form-label">密码</label>
            <input
              className="lb-form-input"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
            />
          </div>

          {err && <div className="lb-form-error">{err}</div>}

          <button
            className="lb-form-submit"
            type="submit"
            disabled={!canSubmit || loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="lb-auth-footer">
          还没有账号？ <Link href="/auth/signup">立即注册</Link>
        </div>
      </div>
    </div>
  );
}
