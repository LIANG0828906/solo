import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { usePoemStore } from '../stores/poemStore';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { poems, dbReady, initDB, createPoem, updatePoem, getPoem, loadPoems } = usePoemStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [poemId, setPoemId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [previewHtml, setPreviewHtml] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

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
  }, [dbReady, id, poems, createPoem, getPoem, loadPoems, navigate]);

  useEffect(() => {
    const text = content.replace(/\s+/g, '');
    setWordCount(text.length);
  }, [content]);

  useEffect(() => {
    const html = marked.parse(content) as string;
    setPreviewHtml(html);
  }, [content]);

  const triggerSaveHint = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, []);

  const saveChanges = useCallback(async (t: string, c: string, pid: string) => {
    await updatePoem(pid, t, c);
    triggerSaveHint();
  }, [updatePoem, triggerSaveHint]);

  const debouncedSave = useCallback((t: string, c: string, pid: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveChanges(t, c, pid);
    }, 500);
  }, [saveChanges]);

  useEffect(() => {
    if (poemId) {
      debouncedSave(title, content, poemId);
    }
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, content, poemId, debouncedSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setContent(e.target.value);
  };

  const handleBack = () => {
    navigate('/');
  };

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
          />
          <textarea
            ref={contentRef}
            className="editor-textarea"
            placeholder="在这里开始你的创作...

让思绪如风吹过，
留下只属于你的诗行..."
            value={content}
            onChange={handleContentChange}
            spellCheck={false}
          />
        </div>

        <div className="editor-preview">
          <div className="preview-header">
            <span className="preview-title">📖 实时预览</span>
          </div>
          <div className="preview-content">
            <h2 className="preview-poem-title">{title || '无题'}</h2>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="empty-preview">开始输入以预览渲染效果...</p>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
