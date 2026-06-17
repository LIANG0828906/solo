import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { usePoemStore } from '../stores/poemStore';

const PERF_THRESHOLD_MS = 40;

const PreviewPanel = memo(function PreviewPanel({
  title,
  html
}: {
  title: string;
  html: string;
}) {
  return (
    <div className="editor-preview">
      <div className="preview-header">
        <span className="preview-title">📖 实时预览</span>
      </div>
      <div className="preview-content">
        <h2 className="preview-poem-title">{title || '无题'}</h2>
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{
            __html: html || '<p class="empty-preview">开始输入以预览渲染效果...</p>'
          }}
        />
      </div>
    </div>
  );
});

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dbReady, initDB, createPoem, updatePoem, getPoem, loadPoems } = usePoemStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [poemId, setPoemId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const perfStartRef = useRef<number>(0);

  useEffect(() => {
    if (!dbReady) {
      initDB();
    }
  }, [dbReady, initDB]);

  useEffect(() => {
    if (!dbReady) return;

    const initEditor = async () => {
      if (id) {
        let poem = getPoem(id);
        if (!poem) {
          await loadPoems();
          poem = getPoem(id);
        }
        if (poem) {
          setTitle(poem.title);
          setContent(poem.content);
          setPoemId(poem.id);
          return;
        }
      }
      if (!initializedRef.current) {
        initializedRef.current = true;
        const newPoem = await createPoem();
        setTitle(newPoem.title);
        setContent(newPoem.content);
        setPoemId(newPoem.id);
        navigate(`/editor/${newPoem.id}`, { replace: true });
      }
    };

    initEditor();
  }, [dbReady, id, createPoem, getPoem, loadPoems, navigate]);

  useEffect(() => {
    if (textareaRef.current && content) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const wordCount = useMemo(() => {
    return content.replace(/\s+/g, '').length;
  }, [content]);

  const previewHtml = useMemo(() => {
    if (typeof performance !== 'undefined') {
      perfStartRef.current = performance.now();
    }
    const html = marked.parse(content) as string;
    if (typeof performance !== 'undefined' && perfStartRef.current > 0) {
      const duration = performance.now() - perfStartRef.current;
      if (duration > PERF_THRESHOLD_MS) {
        console.warn(
          `[WindWhisper Perf] Markdown 渲染用时: ${duration.toFixed(2)}ms (阈值 ${PERF_THRESHOLD_MS}ms)`
        );
      } else if (import.meta.env.DEV) {
        console.debug(
          `[WindWhisper Perf] Markdown 渲染用时: ${duration.toFixed(2)}ms ✓`
        );
      }
    }
    return html;
  }, [content]);

  const triggerSaveHint = useCallback(() => {
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const saveChanges = useCallback(
    async (t: string, c: string, pid: string) => {
      const saveStart =
        typeof performance !== 'undefined' ? performance.now() : 0;
      await updatePoem(pid, t, c);
      if (saveStart > 0 && process.env.NODE_ENV === 'development') {
        console.debug(
          `[WindWhisper Perf] 保存到 IndexedDB 用时: ${(
            performance.now() - saveStart
          ).toFixed(2)}ms`
        );
      }
      triggerSaveHint();
    },
    [updatePoem, triggerSaveHint]
  );

  const scheduleSave = useCallback(
    (t: string, c: string, pid: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        saveChanges(t, c, pid);
      }, 500);
    },
    [saveChanges]
  );

  useEffect(() => {
    if (poemId) {
      scheduleSave(title, content, poemId);
    }
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [title, content, poemId, scheduleSave]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
    },
    []
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    []
  );

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!poemId && !id) {
    return (
      <div className="editor-loading">
        <div className="loading-spinner"></div>
        <span>正在初始化编辑器...</span>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className={`save-hint ${showSaved ? 'show' : ''}`}>
        <span className="save-icon">✓</span> 已保存
      </div>

      <div className="editor-toolbar">
        <button className="btn-back" onClick={handleBack}>
          ← 返回诗集
        </button>
        <div className="word-count">
          字数: <strong>{wordCount}</strong>
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-glass">
          <input
            type="text"
            className="editor-title-input"
            placeholder="请输入诗歌标题..."
            value={title}
            onChange={handleTitleChange}
            spellCheck={false}
          />
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder={`在这里开始你的创作...

让思绪如风吹过，
留下只属于你的诗行...`}
            value={content}
            onChange={handleContentChange}
            spellCheck={false}
          />
        </div>

        <PreviewPanel title={title} html={previewHtml} />
      </div>
    </div>
  );
};

export default memo(Editor);
