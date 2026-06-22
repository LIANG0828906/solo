import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { adaptForMultiplePlatforms } from '../utils/platformAdapter';
import type { Post, PlatformType } from '../types';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '../types';

interface ContentEditorProps {
  posts: Post[];
  onPostsUpdate: (posts: Post[]) => void;
  onNavigate: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

const ContentEditor = ({ posts, onPostsUpdate, onNavigate }: ContentEditorProps) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(posts[0]?.id || null);
  const [title, setTitle] = useState(posts[0]?.title || '');
  const [summary, setSummary] = useState(posts[0]?.summary || '');
  const [content, setContent] = useState(posts[0]?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(
    posts[0]?.platforms || ['blog']
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectPost = useCallback(
    (post: Post) => {
      setSelectedPostId(post.id);
      setTitle(post.title);
      setSummary(post.summary);
      setContent(post.content);
      setSelectedPlatforms(post.platforms);
    },
    []
  );

  const createNewPost = useCallback(() => {
    const newPost: Post = {
      id: uuidv4(),
      title: '新稿件',
      summary: '',
      content: '# 开始创作\n\n在这里输入您的内容...',
      status: 'draft',
      lastModified: new Date().toISOString(),
      platforms: ['blog'],
    };
    const updatedPosts = [newPost, ...posts];
    onPostsUpdate(updatedPosts);
    selectPost(newPost);
  }, [posts, onPostsUpdate, selectPost]);

  const saveCurrentPost = useCallback(() => {
    if (!selectedPostId) return;
    const updatedPosts = posts.map((p) =>
      p.id === selectedPostId
        ? {
            ...p,
            title,
            summary,
            content,
            platforms: selectedPlatforms,
            lastModified: new Date().toISOString(),
          }
        : p
    );
    onPostsUpdate(updatedPosts);
  }, [selectedPostId, title, summary, content, selectedPlatforms, posts, onPostsUpdate]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const handleBold = () => insertMarkdown('**', '**');
  const handleItalic = () => insertMarkdown('*', '*');
  const handleHeading = () => insertMarkdown('## ');
  const handleList = () => insertMarkdown('- ');
  const handleImage = () => insertMarkdown('![图片描述](', ')');

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('请至少选择一个发布平台');
      return;
    }
    if (!selectedPostId) return;

    saveCurrentPost();

    setShowPublishModal(true);

    const currentPost = posts.find((p) => p.id === selectedPostId);
    if (currentPost) {
      const adaptedContents = adaptForMultiplePlatforms(
        { ...currentPost, title, summary, content, platforms: selectedPlatforms },
        selectedPlatforms
      );
      console.log('适配后的内容:', adaptedContents);
    }

    const updatedPosts = posts.map((p) =>
      p.id === selectedPostId ? { ...p, status: 'published' as const } : p
    );
    onPostsUpdate(updatedPosts);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setShowPublishModal(false);
    onNavigate();
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>稿件列表</h3>
          <button className="btn-click" style={styles.newPostBtn} onClick={createNewPost}>
            + 新建
          </button>
        </div>

        <div style={styles.postList}>
          {posts.map((post) => (
            <div
              key={post.id}
              className={`post-item ${selectedPostId === post.id ? 'post-item-active' : ''}`}
              style={{
                ...styles.postItem,
                ...(selectedPostId === post.id ? styles.postItemActive : {}),
              }}
              onClick={() => selectPost(post)}
            >
              <div style={styles.postItemContent}>
                <div style={styles.postTitle}>{post.title || '无标题'}</div>
                <div style={styles.postMeta}>
                  <span style={styles.postDate}>
                    {formatDate(post.lastModified)}
                  </span>
                  <span
                    style={{
                      ...styles.postStatus,
                      ...(post.status === 'published'
                        ? styles.statusPublished
                        : styles.statusDraft),
                    }}
                  >
                    {post.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.editorArea}>
        <div style={styles.editorHeader}>
          <div style={styles.editorTabs}>
            <button
              style={{
                ...styles.tabBtn,
                ...(!showPreview ? styles.tabBtnActive : {}),
              }}
              onClick={() => setShowPreview(false)}
            >
              编辑
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(showPreview ? styles.tabBtnActive : {}),
              }}
              onClick={() => setShowPreview(true)}
            >
              预览
            </button>
          </div>

          <div style={styles.editorActions}>
            <button className="btn-click" style={styles.saveBtn} onClick={saveCurrentPost}>
              保存草稿
            </button>
            <button className="btn-click" style={styles.publishBtn} onClick={handlePublish}>
              🚀 发布
            </button>
          </div>
        </div>

        <div style={styles.platformSelector}>
          <span style={styles.platformLabel}>分发平台：</span>
          {(['blog', 'newsletter', 'social'] as PlatformType[]).map((platform) => (
            <label
              key={platform}
              style={{
                ...styles.platformCheckbox,
                ...(selectedPlatforms.includes(platform)
                  ? { borderColor: PLATFORM_COLORS[platform], backgroundColor: `${PLATFORM_COLORS[platform]}15` }
                  : {}),
              }}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                style={styles.checkboxInput}
              />
              <span
                style={{
                  ...styles.checkboxDot,
                  backgroundColor: selectedPlatforms.includes(platform)
                    ? PLATFORM_COLORS[platform]
                    : '#E5E7EB',
                }}
              />
              <span style={styles.platformName}>{PLATFORM_NAMES[platform]}</span>
            </label>
          ))}
        </div>

        <div style={styles.editorContent}>
          {!showPreview ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入稿件标题..."
                style={styles.titleInput}
              />

              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="输入内容摘要（可选，用于社交媒体和Newsletter预览）..."
                style={styles.summaryInput}
              />

              <div style={styles.toolbar}>
                <button className="btn-click" style={styles.toolBtn} onMouseDown={(e) => { e.preventDefault(); handleBold(); }} title="加粗">
                  <strong>B</strong>
                </button>
                <button className="btn-click" style={styles.toolBtn} onMouseDown={(e) => { e.preventDefault(); handleItalic(); }} title="斜体">
                  <em>I</em>
                </button>
                <button className="btn-click" style={styles.toolBtn} onMouseDown={(e) => { e.preventDefault(); handleHeading(); }} title="标题">
                  H
                </button>
                <button className="btn-click" style={styles.toolBtn} onMouseDown={(e) => { e.preventDefault(); handleList(); }} title="列表">
                  •
                </button>
                <button className="btn-click" style={styles.toolBtn} onMouseDown={(e) => { e.preventDefault(); handleImage(); }} title="图片">
                  🖼️
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始写作，支持Markdown语法..."
                style={styles.contentTextarea}
              />
            </>
          ) : (
            <div style={styles.previewArea}>
              <h1 style={styles.previewTitle}>{title || '无标题'}</h1>
              {summary && <p style={styles.previewSummary}>{summary}</p>}
              <div style={styles.previewContent}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPublishModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.progressRingContainer}>
              <div style={styles.progressRing}>
                <div style={styles.progressRingInner} />
              </div>
            </div>
            <p style={styles.modalText}>正在分发内容到各平台...</p>
            <div style={styles.platformProgress}>
              {selectedPlatforms.map((platform, index) => (
                <div key={platform} style={styles.platformProgressItem}>
                  <div
                    style={{
                      ...styles.platformDot,
                      backgroundColor: PLATFORM_COLORS[platform],
                      animationDelay: `${index * 0.2}s`,
                    }}
                  />
                  <span style={styles.platformProgressText}>
                    {PLATFORM_NAMES[platform]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 65px)',
    backgroundColor: '#ffffff',
  },
  sidebar: {
    width: '30%',
    minWidth: '280px',
    backgroundColor: '#F9FAFB',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
  },
  newPostBtn: {
    padding: '6px 14px',
    backgroundColor: '#3B82F6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  postList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  postItem: {
    padding: '12px 16px',
    marginBottom: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    borderLeft: '5px solid transparent',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
  },
  postItemActive: {
    backgroundColor: '#EFF6FF',
    borderLeft: '5px solid #3B82F6',
  },
  postItemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  postTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1F2937',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  postMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  postDate: {
    color: '#6B7280',
  },
  postStatus: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  },
  statusDraft: {
    backgroundColor: '#E5E7EB',
    color: '#4B5563',
  },
  statusPublished: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#ffffff',
  },
  editorTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#F3F4F6',
    padding: '4px',
    borderRadius: '8px',
  },
  tabBtn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#6B7280',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1F2937',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  editorActions: {
    display: 'flex',
    gap: '12px',
  },
  saveBtn: {
    padding: '8px 20px',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  publishBtn: {
    padding: '8px 20px',
    backgroundColor: '#3B82F6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  platformSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#FAFAFA',
    flexWrap: 'wrap',
  },
  platformLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  platformCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
  },
  checkboxInput: {
    display: 'none',
  },
  checkboxDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },
  platformName: {
    fontSize: '13px',
    color: '#374151',
  },
  editorContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    overflowY: 'auto',
    gap: '16px',
  },
  titleInput: {
    width: '100%',
    padding: '12px 0',
    border: 'none',
    borderBottom: '2px solid #E5E7EB',
    fontSize: '28px',
    fontWeight: 600,
    color: '#1F2937',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  summaryInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4B5563',
    resize: 'none',
    height: '60px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  toolbar: {
    display: 'flex',
    gap: '4px',
    padding: '10px 12px',
    backgroundColor: '#E5E7EB',
    borderRadius: '8px',
  },
  toolBtn: {
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s ease',
  },
  contentTextarea: {
    flex: 1,
    width: '100%',
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#1F2937',
    resize: 'none',
    outline: 'none',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    transition: 'border-color 0.2s ease',
    minHeight: '300px',
  },
  previewArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  previewTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '12px',
  },
  previewSummary: {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    borderLeft: '4px solid #3B82F6',
  },
  previewContent: {
    fontSize: '16px',
    lineHeight: 1.8,
    color: '#374151',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '40px 60px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '320px',
  },
  progressRingContainer: {
    width: '80px',
    height: '80px',
    position: 'relative',
  },
  progressRing: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #3B82F6, #8B5CF6, #3B82F6)',
    animation: 'spin 1.5s linear infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
  },
  modalText: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#374151',
  },
  platformProgress: {
    display: 'flex',
    gap: '24px',
  },
  platformProgressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  platformDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'pulse 0.8s ease-in-out infinite',
  },
  platformProgressText: {
    fontSize: '13px',
    color: '#6B7280',
  },
};

export default ContentEditor;
