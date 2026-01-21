"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { getSessionUser, createLeague } from "@/lib/store";

export default function CreateLeaguePage() {
  const { t } = useLang();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [name, setName] = useState("");
  const [teams, setTeams] = useState("12");
  const [format, setFormat] = useState("h2h");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{t("需要登录", "Login Required")}</h1>
            <p>{t("请先登录后创建联赛", "Please sign in to create a league")}</p>
          </div>
          <Link href="/auth/login" className="form-submit" style={{ display: "block", textAlign: "center" }}>
            {t("登录", "Sign In")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("请输入联赛名称", "League name is required"));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const res = await createLeague({ name, visibility });
    
    if (!res.ok) {
      setError(res.error || t("创建失败", "Failed to create league"));
      setLoading(false);
      return;
    }
    
    router.push(`/league/${res.league?.slug || "new"}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <Link href="/" style={{ display: "inline-block", marginBottom: 24 }}>
            <svg viewBox="0 0 40 40" fill="none" style={{ width: 50, height: 50, color: "#f59e0b" }}>
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M20 4 C20 4, 8 16, 20 20 C32 24, 20 36, 20 36" stroke="currentColor" strokeWidth="2.5" fill="none"/>
              <path d="M4 20 H36" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
          </Link>
          <h1>{t("创建联赛", "Create a League")}</h1>
          <p>{t("设置你的 Fantasy 篮球联赛", "Set up your fantasy basketball league")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t("联赛名称", "League Name")}</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("我的联赛", "My Awesome League")}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("队伍数量", "Number of Teams")}</label>
            <select 
              className="form-input" 
              value={teams}
              onChange={(e) => setTeams(e.target.value)}
            >
              <option value="8">8 {t("队", "Teams")}</option>
              <option value="10">10 {t("队", "Teams")}</option>
              <option value="12">12 {t("队", "Teams")}</option>
              <option value="14">14 {t("队", "Teams")}</option>
              <option value="16">16 {t("队", "Teams")}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t("联赛格式", "League Format")}</label>
            <select 
              className="form-input" 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="h2h">Head-to-Head Categories</option>
              <option value="h2h-points">Head-to-Head Points</option>
              <option value="roto">Rotisserie</option>
              <option value="points">Points League</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t("可见性", "Visibility")}</label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className="form-input"
                style={{ 
                  flex: 1, 
                  cursor: "pointer",
                  background: visibility === "public" ? "rgba(245, 158, 11, 0.15)" : undefined,
                  borderColor: visibility === "public" ? "#f59e0b" : undefined,
                  color: visibility === "public" ? "#f59e0b" : undefined
                }}
                onClick={() => setVisibility("public")}
              >
                {t("公开", "Public")}
              </button>
              <button
                type="button"
                className="form-input"
                style={{ 
                  flex: 1, 
                  cursor: "pointer",
                  background: visibility === "private" ? "rgba(245, 158, 11, 0.15)" : undefined,
                  borderColor: visibility === "private" ? "#f59e0b" : undefined,
                  color: visibility === "private" ? "#f59e0b" : undefined
                }}
                onClick={() => setVisibility("private")}
              >
                {t("私人", "Private")}
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            className="form-submit"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? t("创建中...", "Creating...") : t("创建联赛", "Create League")}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/">← {t("返回首页", "Back to Home")}</Link>
        </div>
      </div>
    </div>
  );
}
