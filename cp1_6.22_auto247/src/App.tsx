import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Page, LayoutMode, LayoutResult, Annotation } from './types';
import { EMOTION_TAGS } from './types';
import { albumManager } from './AlbumManager';
import { layoutEngine } from './LayoutEngine';
import { exportEngine } from './ExportEngine';

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedIndex: number;
    mouseX: number;
    mouseY: number;
    dragOverIndex: number;
  }>({
    isDragging: false,
    draggedIndex: -1,
    mouseX: 0,
    mouseY: 0,
    dragOverIndex: -1
  });
  const [annotationDragState, setAnnotationDragState] = useState<{
    isDragging: boolean;
    annotationId: string;
    offsetX: number;
    offsetY: number;
  }>({
    isDragging: false,
    annotationId: '',
    offsetX: 0,
    offsetY: 0
  });
  const [animateLayout, setAnimateLayout] = useState(false);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingMouseMoveRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const unsubscribe = albumManager.subscribe(() => {
      setPages(albumManager.getPages());
      setLayoutMode(albumManager.getLayoutMode());
    });

    setPages(albumManager.getPages());
    setLayoutMode(albumManager.getLayoutMode());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (pageContainerRef.current && pages.length > 0) {
      const containerWidth = pageContainerRef.current.clientWidth;
      const newLayout = layoutEngine.calculateLayout(pages, layoutMode, containerWidth);
      setLayout(newLayout);
      setAnimateLayout(true);
      const timer = setTimeout(() => setAnimateLayout(false), 400);
      return () => clearTimeout(timer);
    }
  }, [pages, layoutMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFlipping || isExporting) return;

      if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
        goToPage(currentPageIndex - 1, 'backward');
      } else if (e.key === 'ArrowRight' && currentPageIndex < pages.length - 1) {
        goToPage(currentPageIndex + 1, 'forward');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length, isFlipping, isExporting]);

  const goToPage = useCallback((newIndex: number, direction: 'forward' | 'backward') => {
    if (isFlipping || newIndex === currentPageIndex) return;
    if (newIndex < 0 || newIndex >= pages.length) return;

    setIsFlipping(true);
    setFlipDirection(direction);

    setTimeout(() => {
      setCurrentPageIndex(newIndex);
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }, 300);
  }, [isFlipping, currentPageIndex, pages.length]);

  const handleLayoutModeChange = (mode: LayoutMode) => {
    albumManager.setLayoutMode(mode);
    setCurrentPageIndex(0);
  };

  const handleAddIllustration = () => {
    albumManager.addIllustration();
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipping || !layout) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const targetClass = (e.target as HTMLElement).className;
    if (
      targetClass.includes('bubble-') ||
      targetClass.includes('emotion-tag') ||
      targetClass.includes('illustration-wrapper')
    ) {
      return;
    }

    albumManager.addAnnotation(currentPageIndex, {
      text: '',
      x,
      y,
      emotionTag: undefined
    });
  };

  const handleAnnotationTextChange = (annotationId: string, text: string) => {
    if (text.length > 140) return;
    albumManager.updateAnnotation(currentPageIndex, annotationId, { text });
  };

  const handleEmotionTagSelect = (annotationId: string, emotionType: keyof typeof EMOTION_TAGS | undefined) => {
    const emotionTag = emotionType ? EMOTION_TAGS[emotionType] : undefined;
    albumManager.setEmotionTag(currentPageIndex, annotationId, emotionTag);
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    albumManager.deleteAnnotation(currentPageIndex, annotationId);
  };

  const handleThumbnailMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();

    setDragState({
      isDragging: true,
      draggedIndex: index,
      mouseX: e.clientX,
      mouseY: e.clientY,
      dragOverIndex: index
    });

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleDocumentMouseMove = (e: MouseEvent) => {
    pendingMouseMoveRef.current = { x: e.clientX, y: e.clientY };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const move = pendingMouseMoveRef.current;
        if (move) {
          if (dragState.isDragging) {
            setDragState(prev => ({
              ...prev,
              mouseX: move.x,
              mouseY: move.y
            }));

            const thumbnailElements = document.querySelectorAll('.thumbnail-wrapper');
            for (let i = 0; i < thumbnailElements.length; i++) {
              const el = thumbnailElements[i] as HTMLElement;
              const rect = el.getBoundingClientRect();
              if (move.x >= rect.left && move.x <= rect.right && move.y >= rect.top && move.y <= rect.bottom) {
                setDragState(prev => ({ ...prev, dragOverIndex: i }));
                break;
              }
            }
          }

          if (annotationDragState.isDragging) {
            const pageEl = document.querySelector('.page-content');
            if (pageEl) {
              const rect = pageEl.getBoundingClientRect();
              const x = move.x - rect.left - annotationDragState.offsetX;
              const y = move.y - rect.top - annotationDragState.offsetY;
              albumManager.updateAnnotation(currentPageIndex, annotationDragState.annotationId, { x, y });
            }
          }
        }
        rafRef.current = null;
      });
    }
  };

  const handleDocumentMouseUp = () => {
    if (dragState.isDragging) {
      if (dragState.draggedIndex !== dragState.dragOverIndex) {
        albumManager.reorderPages(dragState.draggedIndex, dragState.dragOverIndex);
        if (currentPageIndex === dragState.draggedIndex) {
          setCurrentPageIndex(dragState.dragOverIndex);
        } else if (
          dragState.draggedIndex < currentPageIndex && dragState.dragOverIndex >= currentPageIndex
        ) {
          setCurrentPageIndex(prev => prev - 1);
        } else if (
          dragState.draggedIndex > currentPageIndex && dragState.dragOverIndex <= currentPageIndex
        ) {
          setCurrentPageIndex(prev => prev + 1);
        }
      }

      setDragState({
        isDragging: false,
        draggedIndex: -1,
        mouseX: 0,
        mouseY: 0,
        dragOverIndex: -1
      });
    }

    if (annotationDragState.isDragging) {
      setAnnotationDragState({
        isDragging: false,
        annotationId: '',
        offsetX: 0,
        offsetY: 0
      });
    }

    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    pendingMouseMoveRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleAnnotationMouseDown = (e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    const pageEl = document.querySelector('.page-content');
    if (!pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();

    setAnnotationDragState({
      isDragging: true,
      annotationId: annotation.id,
      offsetX: e.clientX - pageRect.left - annotation.x + 90,
      offsetY: e.clientY - pageRect.top - annotation.y - 50
    });

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleExport = async () => {
    if (pages.length === 0 || !layout) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportLayout = layoutEngine.calculateExportLayout(pages, layoutMode);
      const blob = await exportEngine.exportToPDF(pages, exportLayout, (progress) => {
        setExportProgress(progress);
      });

      const filename = `${albumManager.getProjectName()}.pdf`;
      exportEngine.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const currentPage = pages[currentPageIndex];
  const currentPageLayout = layout?.pages[currentPageIndex];

  const renderAnnotationBubble = (annotation: Annotation) => {
    const isDragging = annotationDragState.isDragging && annotationDragState.annotationId === annotation.id;
    const trianglePosition = annotation.y < 100 ? 'bottom' : 'top';

    return (
      <div
        key={annotation.id}
        className={`annotation-bubble ${isDragging ? 'dragging' : ''}`}
        style={{
          left: annotation.x - 90,
          top: annotation.y - (trianglePosition === 'top' ? 100 : 0)
        }}
        onMouseDown={(e) => handleAnnotationMouseDown(e, annotation)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bubble-triangle top" style={{ display: trianglePosition === 'top' ? 'block' : 'none' }} />
        <div className="bubble-content">
          <textarea
            className="bubble-textarea"
            placeholder="添加你的批注..."
            value={annotation.text}
            onChange={(e) => handleAnnotationTextChange(annotation.id, e.target.value)}
            maxLength={140}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div className="bubble-footer">
            <div className="emotion-tag-selector">
              {(Object.keys(EMOTION_TAGS) as Array<keyof typeof EMOTION_TAGS>).map((key) => (
                <button
                  key={key}
                  className={`emotion-tag-btn ${annotation.emotionTag?.type === key ? 'active' : ''}`}
                  style={{ backgroundColor: EMOTION_TAGS[key].color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmotionTagSelect(
                      annotation.id,
                      annotation.emotionTag?.type === key ? undefined : key
                    );
                  }}
                  title={EMOTION_TAGS[key].label}
                />
              ))}
            </div>
            <div className="emotion-tag-display">
              {annotation.emotionTag && (
                <span
                  className="emotion-tag-pill"
                  style={{ backgroundColor: annotation.emotionTag.color }}
                >
                  {annotation.emotionTag.label}
                </span>
              )}
              <button
                className="delete-annotation-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAnnotation(annotation.id);
                }}
                title="删除批注"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div className="bubble-triangle bottom" style={{ display: trianglePosition === 'bottom' ? 'block' : 'none' }} />
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1 className="project-title">{albumManager.getProjectName()}</h1>

        <div className="toolbar-center">
          {(['single', 'double', 'triple'] as LayoutMode[]).map((mode) => (
            <button
              key={mode}
              className={`layout-btn ${layoutMode === mode ? 'active' : ''}`}
              onClick={() => handleLayoutModeChange(mode)}
            >
              {layoutEngine.getLayoutModeLabel(mode)}
            </button>
          ))}
        </div>

        <select
          className="layout-dropdown"
          value={layoutMode}
          onChange={(e) => handleLayoutModeChange(e.target.value as LayoutMode)}
        >
          {(['single', 'double', 'triple'] as LayoutMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {layoutEngine.getLayoutModeLabel(mode)}
            </option>
          ))}
        </select>

        <div className="toolbar-right">
          <button
            className="add-btn"
            onClick={handleAddIllustration}
            disabled={!albumManager.canAddMore()}
          >
            + 添加插画 ({pages.reduce((s, p) => s + p.illustrations.length, 0)}/20)
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={pages.length === 0 || isExporting}
          >
            {isExporting ? '导出中...' : '导出PDF'}
          </button>
        </div>
      </div>

      <div className="thumbnail-bar">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`thumbnail-wrapper ${
              dragState.draggedIndex === index ? 'dragging' : ''
            } ${dragState.dragOverIndex === index && dragState.draggedIndex !== index ? 'drag-over' : ''}`}
            onMouseDown={(e) => handleThumbnailMouseDown(e, index)}
            onClick={() => {
              if (!dragState.isDragging) {
                goToPage(index, index > currentPageIndex ? 'forward' : 'backward');
              }
            }}
          >
            <div className="thumbnail">
              {page.illustrations[0] && (
                <img src={page.illustrations[0].imageUrl} alt={`Page ${index + 1}`} />
              )}
            </div>
            <span className="thumbnail-number">{index + 1}</span>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="book-container">
          <button
            className="nav-btn"
            onClick={() => goToPage(currentPageIndex - 1, 'backward')}
            disabled={currentPageIndex === 0 || isFlipping}
          >
            ‹
          </button>

          <div className="page-wrapper" ref={pageContainerRef}>
            {currentPage && currentPageLayout && (
              <div
                className={`page ${isFlipping ? (flipDirection === 'forward' ? 'flipping' : 'flipping-back') : ''} ${!isFlipping && currentPageIndex >= 0 ? 'page-enter' : ''}`}
                key={currentPage.id}
              >
                <div className="page-content" onClick={handlePageClick}>
                  {currentPage.illustrations.length === 0 ? (
                    <div className="empty-page">
                      <div className="empty-page-icon">📄</div>
                      <div className="empty-page-text">点击"添加插画"开始创作</div>
                    </div>
                  ) : (
                    currentPageLayout.illustrations.map((illuLayout, idx) => {
                      const illu = currentPage.illustrations.find(i => i.id === illuLayout.id);
                      if (!illu) return null;
                      return (
                        <div
                          key={illu.id}
                          className={`illustration-wrapper ${animateLayout ? 'animate-in' : ''}`}
                          style={{
                            left: illuLayout.x,
                            top: illuLayout.y,
                            width: illuLayout.width,
                            height: illuLayout.height,
                            animationDelay: `${idx * 0.1}s`
                          }}
                        >
                          <img src={illu.imageUrl} alt="Illustration" draggable={false} />
                        </div>
                      );
                    })
                  )}

                  {currentPage.annotations.map(renderAnnotationBubble)}

                  <div className="page-number">
                    {currentPageIndex + 1} / {pages.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="nav-btn"
            onClick={() => goToPage(currentPageIndex + 1, 'forward')}
            disabled={currentPageIndex >= pages.length - 1 || isFlipping}
          >
            ›
          </button>
        </div>
      </div>

      {dragState.isDragging && pages[dragState.draggedIndex]?.illustrations[0] && (
        <div
          className="drag-ghost"
          style={{
            left: dragState.mouseX - 60,
            top: dragState.mouseY - 45
          }}
        >
          <img
            src={pages[dragState.draggedIndex].illustrations[0].imageUrl}
            alt="Dragging"
          />
        </div>
      )}

      {isExporting && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="export-title">正在导出PDF...</div>
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(exportProgress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
