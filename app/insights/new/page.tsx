"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createInsight, getSessionUser, listLeagues, uploadImage, type League } from "@/lib/store";
import Header from "@/components/Header";

type LeagueOption = { slug: string; name: string };

export default function NewInsightPage() {
  const router = useRouter();
  const user = getSessionUser();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [leagueSlug, setLeagueSlug] = useState<string>("");
  const [loadingLeagues, setLoadingLeagues] = useState(true);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLeagues(true);
        const data: League[] = await listLeagues();
        setLeagues(data.map((l) => ({ slug: l.slug, name: l.name })));
      } finally {
        setLoadingLeagues(false);
      }
    })();
  }, []);

  // 处理封面图片选择，生成预览
  function handleCoverChange(file: File | null) {
    setCoverFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  }

  const leagueSelectDisabled = useMemo(
    () => submitting || loadingLeagues || leagues.length === 0,
    [submitting, loadingLeagues, leagues.length]
  );

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t || t.length > 16 || tags.includes(t) || tags.length >= 5) return;
    setTags((prev) => [...prev, t]);
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  async function onSubmit() {
    if (!user) {
      alert("需要登录后才能发布洞见");
      router.push("/auth/login");
      return;
    }

    if (!title.trim()) {
      setError("标题不能为空");
      return;
    }
    if (!body.trim()) {
      setError("内容不能为空");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. 如果有封面图片，先上传
      let coverUrl: string | undefined;
      if (coverFile) {
        const uploadRes = await uploadImage(coverFile, "covers");
        if (!uploadRes.ok) {
          setError(uploadRes.error ?? "图片上传失败");
          setSubmitting(false);
          return;
        }
        coverUrl = uploadRes.url;
      }

      // 2. 创建 insight
      const res = await createInsight({
        title,
        body,
        league_slug: leagueSlug ? leagueSlug : undefined,
        cover_url: coverUrl,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (!res.ok) {
        setSubmitting(false);
        setError(res.error ?? "发布失败");
        return;
      }

      router.push("/");
    } catch (err) {
      setError("发布失败，请重试");
      setSubmitting(false);
    }
  }

  const POPULAR_TAGS = ["选秀策略", "球员分析", "交易建议", "新手指南", "Punt策略"];

  return (
    <div className="app">
      <Header />
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>发布洞见</h1>
            <p style={styles.subtitle}>分享你的 Fantasy 篮球策略和分析</p>
          </div>

          <div style={styles.card}>
            {/* Cover Image */}
            <section style={styles.section}>
              <label style={styles.label}>封面图片 <span style={styles.optional}>(可选)</span></label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={submitting}
                style={{
                  ...styles.uploadBox,
                  ...(coverPreview ? { padding: 0, overflow: 'hidden' } : {})
                }}
              >
                {coverPreview ? (
                  <div style={styles.previewContainer}>
                    <img src={coverPreview} alt="预览" style={styles.previewImage} />
                    <div style={styles.previewOverlay}>
                      <span>点击更换图片</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={styles.uploadIcon}>🖼</div>
                    <div style={styles.uploadText}>点击上传封面图</div>
                    <div style={styles.uploadHint}>推荐尺寸 16:9，最大 5MB</div>
                  </>
                )}
              </button>
              {coverFile && (
                <button
                  type="button"
                  onClick={() => handleCoverChange(null)}
                  style={styles.removeCoverBtn}
                >
                  移除封面
                </button>
              )}
            </section>

            {/* Title */}
            <section style={styles.section}>
              <label style={styles.label}>标题 <span style={styles.required}>*</span></label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                placeholder="例如：为什么我在首轮放弃了 Tatum"
                style={styles.input}
                maxLength={100}
              />
              <div style={styles.charCount}>{title.length}/100</div>
            </section>

            {/* Body */}
            <section style={styles.section}>
              <label style={styles.label}>内容 <span style={styles.required}>*</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={submitting}
                placeholder="分享你的策略、分析或经验...&#10;&#10;支持使用 Markdown 格式"
                rows={10}
                style={styles.textarea}
              />
            </section>

            {/* Analysis Images - 暂时保留UI但不实现功能 */}
            <section style={styles.section}>
              <label style={styles.label}>分析配图 <span style={styles.optional}>(最多9张)</span></label>
              <div style={styles.imageGrid}>
                <button type="button" disabled={submitting} style={styles.addImageBox}>
                  <span style={{ fontSize: 24 }}>+</span>
                  <span style={{ fontSize: 12, marginTop: 4 }}>添加图片</span>
                </button>
              </div>
            </section>

            {/* Tags */}
            <section style={styles.section}>
              <label style={styles.label}>标签 <span style={styles.optional}>(最多5个)</span></label>
              <div style={styles.tagInputRow}>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  disabled={submitting}
                  placeholder="输入标签后按回车"
                  style={{ ...styles.input, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { addTag(tagInput); setTagInput(""); }}
                  style={styles.addTagBtn}
                >
                  添加
                </button>
              </div>
              
              {/* Selected Tags */}
              <div style={styles.tagsRow}>
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    style={styles.selectedTag}
                  >
                    #{t} <span style={{ marginLeft: 4, opacity: 0.6 }}>×</span>
                  </button>
                ))}
              </div>

              {/* Popular Tags */}
              <div style={styles.popularTagsRow}>
                <span style={styles.popularLabel}>热门标签：</span>
                {POPULAR_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    style={styles.popularTag}
                    disabled={tags.includes(t)}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </section>

            {/* League Select */}
            <section style={styles.section}>
              <label style={styles.label}>关联联赛 <span style={styles.optional}>(可选)</span></label>
              <div style={styles.selectWrapper}>
                <select
                  value={leagueSlug}
                  onChange={(e) => setLeagueSlug(e.target.value)}
                  disabled={leagueSelectDisabled}
                  style={styles.select}
                >
                  <option value="">
                    {loadingLeagues ? "加载中…" : leagues.length === 0 ? "暂无联赛" : "不关联联赛"}
                  </option>
                  {leagues.map((l) => (
                    <option key={l.slug} value={l.slug}>{l.name}</option>
                  ))}
                </select>
                <span style={styles.selectArrow}>▾</span>
              </div>
            </section>

            {/* Error */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Actions */}
            <div style={styles.actions}>
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={submitting}
                style={styles.cancelBtn}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                style={styles.submitBtn}
              >
                {submitting ? "发布中…" : "发布"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0f1a 0%, #070b14 100%)',
    padding: '40px 16px 80px',
  },
  container: {
    maxWidth: 700,
    margin: '0 auto',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f59e0b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 32,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  required: {
    color: '#f59e0b',
  },
  optional: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 400,
  },
  uploadBox: {
    width: '100%',
    padding: '40px 20px',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.6,
  },
  uploadText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: 500,
  },
  uploadHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  previewContainer: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '16/9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  previewOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    color: '#fff',
    fontSize: 14,
  },
  removeCoverBtn: {
    marginTop: 8,
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right' as const,
    marginTop: 6,
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 180,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  addImageBox: {
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
  },
  tagInputRow: {
    display: 'flex',
    gap: 10,
  },
  addTagBtn: {
    padding: '14px 20px',
    background: '#f59e0b',
    color: '#000',
    fontWeight: 600,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 12,
  },
  selectedTag: {
    padding: '6px 12px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
    color: '#f59e0b',
    fontSize: 13,
    cursor: 'pointer',
  },
  popularTagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  popularLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  popularTag: {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    cursor: 'pointer',
  },
  selectWrapper: {
    position: 'relative' as const,
  },
  select: {
    width: '100%',
    padding: '14px 40px 14px 16px',
    fontSize: 15,
    color: '#fff',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  selectArrow: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.5)',
    pointerEvents: 'none' as const,
  },
  error: {
    padding: '12px 16px',
    background: 'rgba(220, 38, 38, 0.15)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: 10,
    color: '#fca5a5',
    fontSize: 14,
    marginBottom: 20,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '12px 28px',
    background: '#f59e0b',
    border: 'none',
    borderRadius: 10,
    color: '#000',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};