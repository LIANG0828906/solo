import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { usePoemStore } from '@/stores/poemStore';
import { Toast } from './Toast';
import './Editor.css';

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPoem, fetchPoemById, createPoem, updatePoem } = usePoemStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isNewPoem, setIsNewPoem] = useState(false);
  const [poemId, setPoemId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const initPoem = async () => {
      if (id) {
        await fetchPoemById(id);
        setPoemId(id);
      } else {
        setIsNewPoem(true);
      }
    };
    initPoem();
  }, [id, fetchPoemById]);

  useEffect(() => {
    if (currentPoem && currentPoem.id === id) {
      setTitle(currentPoem.title);
      setContent(currentPoem.content);
    }
  }, [currentPoem, id]);

  const performSave = useCallback(async () => {
    const currentTitle = titleRef.current;
    const currentContent = contentRef.current;

    if (!currentTitle && !currentContent) return;

    try {
      if (isNewPoem && !poemId) {
        const newPoem = await createPoem(currentTitle || '无题', currentContent);
        setPoemId(newPoem.id);
        setIsNewPoem(false);
        navigate(`/editor/${newPoem.id}`, { replace: true });
      } else if (poemId) {
        await updatePoem(poemId, currentTitle || '无题', currentContent);
      }
      setShowSavedToast(true);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [isNewPoem, poemId, createPoem, updatePoem, navigate]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 500);
  }, [performSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerAutoSave();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    triggerAutoSave();
  };

  const wordCount = content.replace(/\s/g, '').length;

  const getPreviewHtml = () => {
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  };

  return (
    <div className="editor-page">
      <Toast message="已保存" visible={showSavedToast} duration={2000} onClose={() => setShowSavedToast(false)} />

      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回列表
        </button>
        <div className="word-count">字数: {wordCount}</div>
      </div>

      <div className="editor-container">
        <div className="editor-glass">
          <input
            type="text"
            className="editor-title-input"
            placeholder="输入诗歌标题..."
            value={title}
            onChange={handleTitleChange}
          />
          <textarea
            className="editor-content-textarea"
            placeholder="在这里开始创作你的诗歌..."
            value={content}
            onChange={handleContentChange}
          />
        </div>

        <div className="editor-preview">
          <div className="preview-header">预览</div>
          <div className="preview-content">
            {title && <h1 className="preview-title">{title}</h1>}
            <div
              className="preview-markdown"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
