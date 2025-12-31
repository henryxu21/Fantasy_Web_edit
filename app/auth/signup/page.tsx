"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length >= 2 && email.includes("@") && pw.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setErr(null);

    const res = signup(name, email, pw);
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
          <h1>创建账号</h1>
          <p>开始记录你的 Fantasy 判断</p>
        </div>

        <form className="lb-form" onSubmit={handleSubmit}>
          <div className="lb-form-group">
            <label className="lb-form-label">昵称</label>
            <input
              className="lb-form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
              autoComplete="name"
            />
          </div>

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
              placeholder="至少6位字符"
              autoComplete="new-password"
            />
          </div>

          {err && <div className="lb-form-error">{err}</div>}

          <button
            className="lb-form-submit"
            type="submit"
            disabled={!canSubmit || loading}
          >
            {loading ? "创建中..." : "创建账号"}
          </button>
        </form>

        <div className="lb-auth-footer">
          已有账号？ <Link href="/auth/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
}
