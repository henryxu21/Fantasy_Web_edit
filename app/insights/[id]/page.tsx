"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useLang } from "@/lib/lang";
import { getSessionUser, getInsightById, addComment, listComments, Comment } from "@/lib/store";

type ParsedInsight = {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  author: string;
  createdAt: number;
  heat: number;
  leagueSlug?: string;
};

export default function InsightDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);
  const [insight, setInsight] = useState<ParsedInsight | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadInsight = async () => {
      const currentUser = getSessionUser();
      setUser(currentUser);
      
      const raw = await getInsightById(id);
          
      if (raw) {
        let content = raw.body;
        let coverImage: string | undefined;
        let images: string[] | undefined;
        let tags: string[] | undefined;
        
        try {
          const parsed = JSON.parse(raw.body);
          if (parsed.content) {
            content = parsed.content;
            coverImage = parsed.metadata?.coverImage;
            images = parsed.metadata?.images;
            tags = parsed.metadata?.tags;
          }
        } catch { }

        const authorName = typeof raw.author === 'object' ? (raw.author as any)?.username || (raw.author as any)?.name : raw.author;
        const createdAtNum = typeof (raw as any).created_at === 'string' ? new Date((raw as any).created_at).getTime() : ((raw as any).createdAt || Date.now());
        
        setInsight({
          id: raw.id,
          title: raw.title,
          content,
          coverImage,
          images,
          tags,
          author: authorName || 'Unknown',
          createdAt: createdAtNum,
          heat: raw.heat,
          leagueSlug: (raw as any).league_slug || (raw as any).leagueSlug,
        });
        setLikeCount(raw.heat);
        const commentsData = await listComments(raw.id);
        setComments(commentsData);
        
        // Check if user liked
        const likedPosts = JSON.parse(localStorage.getItem("bp_liked_posts") || "[]");
        setLiked(likedPosts.includes(raw.id));
        
        // Check if following author
        if (currentUser) {
          const following = JSON.parse(localStorage.getItem(`bp_following_${currentUser.id}`) || "[]");
          setIsFollowing(following.includes(authorName));
        }
      }
      setLoading(false);
    };
    loadInsight();
  }, [id]);

  const isAuthor = user && insight && insight.author === user.name;

  const handleLike = () => {
    if (!user) {
      alert(t("请先登录", "Please login first"));
      return;
    }
    
    const likedPosts = JSON.parse(localStorage.getItem("bp_liked_posts") || "[]");
    
    if (liked) {
      const newLiked = likedPosts.filter((pid: string) => pid !== id);
      localStorage.setItem("bp_liked_posts", JSON.stringify(newLiked));
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      likedPosts.push(id);
      localStorage.setItem("bp_liked_posts", JSON.stringify(likedPosts));
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleFollow = () => {
    if (!user) {
      alert(t("请先登录", "Please login first"));
      return;
    }
    if (!insight) return;
    
    const key = `bp_following_${user.id}`;
    const following = JSON.parse(localStorage.getItem(key) || "[]");
    
    if (isFollowing) {
      const newFollowing = following.filter((name: string) => name !== insight.author);
      localStorage.setItem(key, JSON.stringify(newFollowing));
      setIsFollowing(false);
    } else {
      following.push(insight.author);
      localStorage.setItem(key, JSON.stringify(following));
      setIsFollowing(true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t("请先登录", "Please login first"));
      return;
    }
    if (!newComment.trim()) return;

    const result = await addComment(id, newComment.trim());

    if (result.ok && result.comment) {
      setComments([...comments, result.comment]);
      setNewComment("");
    }
  };

  const handleDelete = () => {
    const allInsights = JSON.parse(localStorage.getItem("bp_insights") || "[]");
    const filtered = allInsights.filter((i: any) => i.id !== id);
    localStorage.setItem("bp_insights", JSON.stringify(filtered));
    alert(t("帖子已删除", "Post deleted"));
    router.push("/");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: insight?.title, url });
      } catch { }
    } else {
      navigator.clipboard.writeText(url);
      alert(t("链接已复制到剪贴板", "Link copied to clipboard"));
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return t("今天", "Today");
    if (days === 1) return t("昨天", "Yesterday");
    if (days < 7) return `${days} ${t("天前", "days ago")}`;
    return date.toLocaleDateString();
  };

  // Helper function to get comment author name
  const getCommentAuthor = (comment: any): string => {
    if (typeof comment.author === 'object') {
      return comment.author?.username || comment.author?.name || 'Anonymous';
    }
    return comment.author || 'Anonymous';
  };

  // Helper function to get comment date
  const getCommentDate = (comment: any): number => {
    if (typeof comment.created_at === 'string') {
      return new Date(comment.created_at).getTime();
    }
    return comment.createdAt || Date.now();
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="page-content" style={{ textAlign: "center", paddingTop: 100 }}>
          <p>{t("加载中...", "Loading...")}</p>
        </main>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="app">
        <Header />
        <main className="page-content" style={{ textAlign: "center", paddingTop: 100 }}>
          <h1 className="page-title">{t("内容不存在", "Content Not Found")}</h1>
          <p style={{ color: "#64748b", marginBottom: 24 }}>{t("该内容可能已被删除", "This content may have been deleted")}</p>
          <Link href="/" className="btn btn-primary">{t("返回首页", "Back to Home")}</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="insight-detail">
        {/* Cover Image */}
        {insight.coverImage && (
          <div className="cover-image" onClick={() => setLightboxImage(insight.coverImage!)}>
            <img src={insight.coverImage} alt={insight.title} />
          </div>
        )}

        <article className="insight-content">
          <header className="insight-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <h1 className="insight-title">{insight.title}</h1>
              {isAuthor && (
                <button 
                  className="delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  title={t("删除", "Delete")}
                >
                  🗑️
                </button>
              )}
            </div>
            
            {/* Author Info with Follow Button */}
            <div className="author-section">
              <Link href={`/u/${insight.author.replace("@", "")}`} className="author-link">
                <div className="author-avatar">{insight.author[0]?.toUpperCase()}</div>
                <div className="author-info">
                  <span className="author-name">{insight.author}</span>
                  <span className="publish-date">{formatDate(insight.createdAt)}</span>
                </div>
              </Link>
              {!isAuthor && (
                <button 
                  className={`follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? t("已关注", "Following") : t("关注", "Follow")}
                </button>
              )}
            </div>

            {/* Tags */}
            {insight.tags && insight.tags.length > 0 && (
              <div className="insight-tags">
                {insight.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </header>

          {/* Body */}
          <div className="insight-body">
            {insight.content.split("\n").map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
            ))}
          </div>

          {/* Images Gallery */}
          {insight.images && insight.images.length > 0 && (
            <div className="images-gallery">
              {insight.images.map((img, index) => (
                <div 
                  key={index} 
                  className="gallery-item"
                  onClick={() => setLightboxImage(img)}
                >
                  <img src={img} alt={`Image ${index + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="insight-actions">
            <button className={`action-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
              <span className="action-icon">{liked ? "❤️" : "🤍"}</span>
              <span>{likeCount}</span>
            </button>
            <button className="action-btn" onClick={() => document.getElementById("comment-input")?.focus()}>
              <span className="action-icon">💬</span>
              <span>{comments.length}</span>
            </button>
            <button className="action-btn" onClick={handleShare}>
              <span className="action-icon">📤</span>
              <span>{t("分享", "Share")}</span>
            </button>
          </div>
        </article>

        {/* Lightbox */}
        {lightboxImage && (
          <div className="lightbox" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} alt="Full size" />
            <button className="lightbox-close">✕</button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{t("确认删除", "Confirm Delete")}</h3>
              <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>
                {t("确定要删除这篇帖子吗？此操作无法撤销。", "Are you sure you want to delete this post? This action cannot be undone.")}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  {t("取消", "Cancel")}
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  {t("删除", "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <section className="comments-section">
          <h3 className="comments-title">
            {t("评论", "Comments")} ({comments.length})
          </h3>

          <form className="comment-form" onSubmit={handleComment}>
            <div className="comment-input-wrapper">
              {user ? (
                <div className="comment-avatar">{user.name[0]?.toUpperCase()}</div>
              ) : (
                <div className="comment-avatar">?</div>
              )}
              <textarea
                id="comment-input"
                className="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? t("写下你的评论...", "Write a comment...") : t("请先登录后评论", "Please login to comment")}
                disabled={!user}
                rows={3}
              />
            </div>
            <div className="comment-submit">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!user || !newComment.trim()}
              >
                {t("发表评论", "Post Comment")}
              </button>
            </div>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>{t("暂无评论，来发表第一条评论吧！", "No comments yet. Be the first to comment!")}</p>
              </div>
            ) : (
              comments.map(comment => {
                const commentAuthor = getCommentAuthor(comment);
                const commentDate = getCommentDate(comment);
                return (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">{(commentAuthor || '?')[0]?.toUpperCase()}</div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{commentAuthor}</span>
                        <span className="comment-date">{formatDate(commentDate)}</span>
                      </div>
                      <p className="comment-body">{comment.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .insight-detail {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px 60px;
        }
        .cover-image {
          width: 100%;
          margin-bottom: 24px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
        }
        .cover-image img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s;
        }
        .cover-image:hover img {
          transform: scale(1.02);
        }
        .insight-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
        }
        .insight-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1.3;
          flex: 1;
        }
        .delete-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .delete-btn:hover {
          opacity: 1;
        }
        .author-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .author-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        .author-link:hover .author-name {
          color: var(--accent);
        }
        .author-avatar, .comment-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #000;
          font-size: 16px;
          flex-shrink: 0;
        }
        .author-info {
          display: flex;
          flex-direction: column;
        }
        .author-name {
          font-weight: 600;
          transition: color 0.2s;
        }
        .publish-date {
          font-size: 13px;
          color: var(--text-muted);
        }
        .follow-btn {
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--accent);
          color: #000;
          border: 2px solid var(--accent);
        }
        .follow-btn:hover {
          transform: scale(1.05);
        }
        .follow-btn.following {
          background: transparent;
          color: var(--accent);
        }
        .insight-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .tag {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent);
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
        }
        .insight-body {
          line-height: 1.8;
          color: var(--text-primary);
          font-size: 16px;
        }
        .insight-body p {
          margin-bottom: 16px;
        }
        .images-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 24px;
        }
        .gallery-item {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
        }
        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .gallery-item:hover img {
          transform: scale(1.05);
        }
        .lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          cursor: pointer;
        }
        .lightbox img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        }
        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }
        .insight-actions {
          display: flex;
          gap: 24px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 15px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: var(--bg-secondary);
        }
        .action-btn.liked {
          color: #ef4444;
        }
        .action-icon {
          font-size: 18px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
        }
        .comments-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
        }
        .comments-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .comment-form {
          margin-bottom: 24px;
        }
        .comment-input-wrapper {
          display: flex;
          gap: 12px;
        }
        .comment-input {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          color: var(--text-primary);
          font-size: 14px;
          resize: none;
        }
        .comment-input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .comment-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .comment-submit {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .no-comments {
          text-align: center;
          color: var(--text-muted);
          padding: 40px 0;
        }
        .comment-item {
          display: flex;
          gap: 12px;
        }
        .comment-content {
          flex: 1;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .comment-author {
          font-weight: 500;
        }
        .comment-date {
          color: var(--text-muted);
          font-size: 13px;
        }
        .comment-body {
          color: var(--text-primary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}