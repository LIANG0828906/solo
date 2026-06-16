import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { AnnotationType } from '@/types';
import FloatingToolbar from '@/components/FloatingToolbar';
import AnnotationOverlay from '@/annotation/AnnotationOverlay';
import AnnotationPanel from '@/annotation/AnnotationPanel';
import StatsPanel from '@/components/StatsPanel';
import styles from './DocumentEditor.module.css';

function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const document = useAppStore((state) => (id ? state.getDocumentById(id) : undefined));
  const updateDocument = useAppStore((state) => state.updateDocument);
  const addAnnotation = useAppStore((state) => state.addAnnotation);
  const loadAnnotations = useAppStore((state) => state.loadAnnotations);
  const annotations = useAppStore((state) => (id ? state.getAnnotationsForDocument(id) : []));

  const [content, setContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadAnnotations(id);
    }
  }, [id, loadAnnotations]);

  useEffect(() => {
    if (document) {
      setContent(document.content);
    }
  }, [document]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      if (id) {
        updateDocument(id, newContent);
      }
    },
    [id, updateDocument],
  );

  const handleSelect = useCallback(() => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setShowToolbar(false);
      setSelection(null);
      return;
    }

    const selectedText = content.slice(start, end);

    const rect = textarea.getBoundingClientRect();
    const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();

    const lineHeight = 28.8;
    const charsPerLine = Math.floor(rect.width / 16);

    const startLine = Math.floor(start / charsPerLine);
    const endLine = Math.floor(end / charsPerLine);
    const selectionTop = (endLine + 1) * lineHeight + 48;

    const selectionLeft = Math.min((start % charsPerLine) * 16, rect.width - 300);

    setToolbarPosition({
      top: selectionTop,
      left: selectionLeft,
    });
    setSelection({ start, end, text: selectedText });
    setShowToolbar(true);
  }, [content]);

  const handleAddAnnotation = useCallback(
    async (type: AnnotationType, annotationContent: string) => {
      if (!id || !selection) return;

      await addAnnotation(
        id,
        type,
        annotationContent,
        selection.start,
        selection.end,
        selection.text,
      );

      setShowToolbar(false);
      setSelection(null);
    },
    [id, selection, addAnnotation],
  );

  const handleCloseToolbar = useCallback(() => {
    setShowToolbar(false);
    setSelection(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(`.${styles.toolbar}`) &&
        target !== editorRef.current
      ) {
        setShowToolbar(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!document) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← 返回
          </button>
          <h1 className={styles.title}>{document.title}</h1>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div className={styles.editorWrapper} ref={editorWrapperRef}>
            <AnnotationOverlay content={content} annotations={annotations} />
            <textarea
              ref={editorRef}
              className={styles.editor}
              value={content}
              onChange={handleContentChange}
              onSelect={handleSelect}
              onMouseUp={handleSelect}
              onKeyUp={handleSelect}
            />
            {showToolbar && selection && (
              <FloatingToolbar
                position={toolbarPosition}
                selectedText={selection.text}
                onSubmit={handleAddAnnotation}
                onClose={handleCloseToolbar}
              />
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <StatsPanel documentId={id || ''} />
          <AnnotationPanel documentId={id || ''} />
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;
