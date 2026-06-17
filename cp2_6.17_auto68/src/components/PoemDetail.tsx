import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { usePoemStore } from '../stores/poemStore';

const PoemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { poems, dbReady, initDB, getPoem, loadPoems } = usePoemStore();

  const [poem, setPoem] = useState(getPoem(id || '') || null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!dbReady) {
      initDB();
    }
  }, [dbReady, initDB]);

  useEffect(() => {
    if (!poem && id && dbReady) {
      loadPoems().then(() => {
        const found = getPoem(id);
        if (found) {
          setPoem(found);
        }
      });
    } else if (id) {
      const found = getPoem(id);
      if (found) {
        setPoem(found);
      }
    }
  }, [id, poems, dbReady, getPoem, loadPoems, poem]);

  const handleBack = () => {
    navigate('/');
  };

  const handleEdit = () => {
    if (poem) {
      navigate(`/editor/${poem.id}`);
    }
  };

  const handleExport = () => {
    if (!poem) return;
    const content = `${poem.title}\n\n${poem.content}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = poem.title.replace(/[\\/:*?"<>|]/g, '_');
    link.download = `${safeTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (!poem) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <span>正在加载诗歌...</span>
      </div>
    );
  }

  const htmlContent = marked.parse(poem.content) as string;

  const formatFullDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="detail-container">
      <div className={`export-toast ${showToast ? 'toast-show' : ''}`}>
        <span className="toast-icon">✓</span> 导出成功
      </div>

      <div className="detail-toolbar">
        <button className="btn-back" onClick={handleBack}>
          ← 返回诗集
        </button>
        <div className="detail-actions">
          <button className="btn-action btn-edit" onClick={handleEdit}>
            ✏️ 编辑
          </button>
          <button className="btn-action btn-export" onClick={handleExport}>
            📥 导出为TXT
          </button>
        </div>
      </div>

      <article className="detail-poem">
        <header className="detail-header">
          <h1 className="detail-title">{poem.title}</h1>
          <div className="detail-meta">
            <span>创建于 {formatFullDate(poem.createdAt)}</span>
            <span className="meta-sep">·</span>
            <span>最后编辑 {formatFullDate(poem.updatedAt)}</span>
          </div>
        </header>
        <div
          className="detail-content markdown-body markdown-body-large"
          dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="empty-poem">这首诗还是空白的，去编辑它吧...</p>' }}
        />
      </article>
    </div>
  );
};

export default PoemDetail;
