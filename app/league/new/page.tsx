"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { createLeague, getSessionUser } from "@/lib/store";

export default function NewLeaguePage() {
  const { t } = useLang();
  const router = useRouter();
  const user = getSessionUser();

  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      alert(t("请先登录", "Please login first"));
      router.push("/auth/login");
      return;
    }

    if (!name.trim()) {
      setError(t("请输入联赛名称", "Please enter league name"));
      return;
    }

    if (name.trim().length < 2) {
      setError(t("联赛名称至少 2 个字符", "League name must be at least 2 characters"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await createLeague({
      name: name.trim(),
      visibility,
    });

    if (res.ok) {
      router.push(`/league/${res.league.slug}`);
    } else {
      setError(res.error || t("创建失败", "Failed to create"));
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="app">
        <Header />
        <main className="new-league-page">
          <div className="login-prompt">
            <div className="icon">🔒</div>
            <h2>{t("需要登录", "Login Required")}</h2>
            <p>{t("登录后即可创建联赛", "Login to create a league")}</p>
            <button onClick={() => router.push("/auth/login")} className="login-btn">
              {t("去登录", "Login")}
            </button>
          </div>
        </main>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="new-league-page">
        <div className="container">
          <div className="card">
            <div className="card-header">
              <div className="icon">🏆</div>
              <h1>{t("创建联赛", "Create League")}</h1>
              <p>{t("创建你的 Fantasy 篮球联赛", "Create your Fantasy Basketball league")}</p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              {/* 联赛名称 */}
              <div className="form-group">
                <label>{t("联赛名称", "League Name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("例如：2024 Fantasy 联赛", "e.g., 2024 Fantasy League")}
                  maxLength={50}
                  disabled={submitting}
                />
                <div className="char-count">{name.length}/50</div>
              </div>

              {/* 可见性 */}
              <div className="form-group">
                <label>{t("可见性", "Visibility")}</label>
                <div className="visibility-options">
                  <button
                    type="button"
                    className={`visibility-option ${visibility === "public" ? "active" : ""}`}
                    onClick={() => setVisibility("public")}
                    disabled={submitting}
                  >
                    <span className="option-icon">🌍</span>
                    <span className="option-label">{t("公开", "Public")}</span>
                    <span className="option-desc">{t("所有人可见", "Visible to everyone")}</span>
                  </button>
                  <button
                    type="button"
                    className={`visibility-option ${visibility === "private" ? "active" : ""}`}
                    onClick={() => setVisibility("private")}
                    disabled={submitting}
                  >
                    <span className="option-icon">🔒</span>
                    <span className="option-label">{t("私密", "Private")}</span>
                    <span className="option-desc">{t("仅邀请可见", "Invite only")}</span>
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && <div className="error">{error}</div>}

              {/* 按钮 */}
              <div className="actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  {t("取消", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || !name.trim()}
                >
                  {submitting ? t("创建中...", "Creating...") : t("创建联赛", "Create League")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .new-league-page {
    min-height: 100vh;
    background: #0a0a0a;
    padding: 24px 16px;
  }

  .container {
    max-width: 500px;
    margin: 0 auto;
  }

  .card {
    background: #111;
    border: 1px solid #222;
    border-radius: 16px;
    padding: 32px;
  }

  .card-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .card-header .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .card-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #f59e0b;
    margin: 0 0 8px 0;
  }

  .card-header p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
  }

  .form-group input {
    padding: 14px 16px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 10px;
    color: #fff;
    font-size: 15px;
    outline: none;
  }

  .form-group input:focus {
    border-color: #f59e0b;
  }

  .char-count {
    font-size: 12px;
    color: #666;
    text-align: right;
  }

  .visibility-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .visibility-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 16px;
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .visibility-option:hover {
    border-color: #444;
  }

  .visibility-option.active {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .option-icon {
    font-size: 24px;
  }

  .option-label {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  }

  .option-desc {
    font-size: 12px;
    color: #666;
  }

  .error {
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 14px;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .cancel-btn {
    flex: 1;
    padding: 14px;
    background: transparent;
    border: 1px solid #333;
    border-radius: 10px;
    color: #888;
    font-size: 15px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #1a1a1a;
  }

  .submit-btn {
    flex: 2;
    padding: 14px;
    background: #f59e0b;
    border: none;
    border-radius: 10px;
    color: #000;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  .submit-btn:hover:not(:disabled) {
    background: #d97706;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .login-prompt {
    max-width: 400px;
    margin: 80px auto;
    text-align: center;
    padding: 48px;
    background: #111;
    border: 1px solid #222;
    border-radius: 16px;
  }

  .login-prompt .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .login-prompt h2 {
    font-size: 20px;
    color: #fff;
    margin: 0 0 8px 0;
  }

  .login-prompt p {
    font-size: 14px;
    color: #666;
    margin: 0 0 24px 0;
  }

  .login-btn {
    padding: 12px 32px;
    background: #f59e0b;
    border: none;
    border-radius: 8px;
    color: #000;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }
`;