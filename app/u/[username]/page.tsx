"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getSessionUser, listInsights } from "@/lib/store";

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const sessionUser = getSessionUser();
  const allInsights = listInsights();

  const userInsights = useMemo(() => {
    return allInsights.filter(
      (i) => i.author.toLowerCase() === username.toLowerCase()
    );
  }, [allInsights, username]);

  const isSelf =
    sessionUser &&
    sessionUser.username.toLowerCase() === username.toLowerCase();

  return (
    <div className="lb-profile-page">
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
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="lb-profile-container">
        <div className="lb-profile-header">
          <div className="lb-profile-info">
            <div className="lb-profile-avatar">
              {username[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="lb-profile-name">@{username}</h1>
              {isSelf && (
                <p className="lb-profile-self">This is your public profile</p>
              )}
            </div>
          </div>
        </div>

        <div className="lb-profile-insights">
          {userInsights.length === 0 && (
            <div className="lb-empty-state">No judgments yet.</div>
          )}

          {userInsights.map((i) => (
            <div key={i.id} className="lb-profile-insight-card">
              <h3 className="lb-profile-insight-title">{i.title}</h3>
              <p className="lb-profile-insight-time">
                {new Date(i.createdAt).toLocaleString()}
              </p>
              <Link
                href={`/insights/${i.id}`}
                className="lb-profile-insight-link"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
