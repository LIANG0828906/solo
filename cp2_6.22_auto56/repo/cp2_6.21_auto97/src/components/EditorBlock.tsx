import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Block, VoteType } from '../types';
import { highlightCode, supportedLanguages } from '../utils/highlight';

interface EditorBlockProps {
  block: Block;
  isNew?: boolean;
  dragTransform?: string;
  isTouchDragging?: boolean;
  onContentChange: (blockId: string, content: string) => void;
  onBlockSaved?: (blockId: string) => void;
  onImageUpload?: (blockId: string, file: File) => Promise<string>;
  onDragStart: (e: React.DragEvent, blockId: string) => void;
  onDragOver: (e: React.DragEvent, blockId: string) => void;
  onDrop: (e: React.DragEvent, blockId: string) => void;
  onDragEnd: () => void;
  onTouchDragStart: (blockId: string, startY: number) => void;
  onTouchDragMove: (currentY: number) => void;
  onTouchDragEnd: () => void;
  onDelete: (blockId: string) => void;
  onVote: (blockId: string, type: VoteType) => void;
  onAddConnection: (fromBlockId: string) => void;
  onLanguageChange?: (blockId: string, language: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  userVote?: VoteType | null;
  blockRef?: (el: HTMLDivElement | null) => void;
}

const VOTE_EMOJIS: Record<VoteType, string> = {
  happy: '😊',
  sad: '😢',
  surprised: '😮',
};

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  isNew = false,
  dragTransform,
  isTouchDragging = false,
  onContentChange,
  onBlockSaved,
  onImageUpload,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onDelete,
  onVote,
  onAddConnection,
  onLanguageChange,
  isDragging = false,
  isDragOver = false,
  userVote = null,
  blockRef,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<HTMLPreElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef(false);
  const originalContentRef = useRef(block.content);

  const [isDesktopDraggable, setIsDesktopDraggable] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);
  const [imageUrl, setImageUrl] = useState(block.type === 'image' ? block.content : '');
  const [showSaved, setShowSaved] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(block.language || 'javascript');

  useEffect(() => {
    setLocalContent(block.content);
    originalContentRef.current = block.content;
  }, [block.content]);

  useEffect(() => {
    if (block.type === 'image') {
      setImageUrl(block.content);
    }
  }, [block.type, block.content]);

  useEffect(() => {
    if (block.language) {
      setCurrentLanguage(block.language);
    }
  }, [block.language]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const triggerSaved = useCallback(() => {
    if (onBlockSaved) {
      onBlockSaved(block.id);
    }
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [block.id, onBlockSaved]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange(block.id, newContent);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (newContent !== originalContentRef.current) {
        originalContentRef.current = newContent;
        triggerSaved();
      }
    }, 500);
  }, [block.id, onContentChange, triggerSaved]);

  const handleTextBlur = useCallback(() => {
    if (localContent !== originalContentRef.current) {
      originalContentRef.current = localContent;
      triggerSaved();
    }
  }, [localContent, triggerSaved]);

  const handleCodeChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setLocalContent(newContent);
    onContentChange(block.id, newContent);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (newContent !== originalContentRef.current) {
        originalContentRef.current = newContent;
        triggerSaved();
      }
    }, 500);
  }, [block.id, onContentChange, triggerSaved]);

  const handleCodeBlur = useCallback(() => {
    if (localContent !== originalContentRef.current) {
      originalContentRef.current = localContent;
      triggerSaved();
    }
  }, [localContent, triggerSaved]);

  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setLocalContent(url);
    onContentChange(block.id, url);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (url !== originalContentRef.current) {
        originalContentRef.current = url;
        triggerSaved();
      }
    }, 500);
  }, [block.id, onContentChange, triggerSaved]);

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    if (block.type !== 'image') return;
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsImageDragOver(true);
    }
  }, [block.type]);

  const handleImageDragLeave = useCallback(() => {
    setIsImageDragOver(false);
  }, []);

  const handleImageDrop = useCallback(async (e: React.DragEvent) => {
    if (block.type !== 'image') return;

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    e.preventDefault();
    setIsImageDragOver(false);
    setUploadingImage(true);

    try {
      let imageUrlResult: string;

      if (onImageUpload) {
        imageUrlResult = await onImageUpload(block.id, imageFiles[0]);
      } else {
        imageUrlResult = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFiles[0]);
        });
      }

      setImageUrl(imageUrlResult);
      setLocalContent(imageUrlResult);
      onContentChange(block.id, imageUrlResult);
      originalContentRef.current = imageUrlResult;
      triggerSaved();
    } catch {
      console.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }, [block.id, block.type, onContentChange, onImageUpload, triggerSaved]);

  const handleLanguageSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setCurrentLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(block.id, lang);
    }
  }, [block.id, onLanguageChange]);

  const handleVote = useCallback((type: VoteType) => {
    onVote(block.id, type);
  }, [block.id, onVote]);

  const handleBlockTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onTouchDragStart(block.id, touch.clientY);
    }, 500);
  }, [block.id, onTouchDragStart]);

  const handleBlockTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (isLongPressActiveRef.current) {
      e.preventDefault();
      onTouchDragMove(touch.clientY);
      return;
    }

    if (touchStartPosRef.current && longPressTimerRef.current) {
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, [onTouchDragMove]);

  const handleBlockTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      onTouchDragEnd();
    }

    touchStartPosRef.current = null;
  }, [onTouchDragEnd]);

  const handleDragHandleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onTouchDragStart(block.id, touch.clientY);
    }, 500);
  }, [block.id, onTouchDragStart]);

  const handleDragHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLongPressActiveRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      onTouchDragMove(touch.clientY);
    }
  }, [onTouchDragMove]);

  const handleDragHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      onTouchDragEnd();
    }
  }, [onTouchDragEnd]);

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            ref={textareaRef}
            className="block-textarea"
            value={localContent}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            placeholder="在这里输入内容...\n\n使用 # 号可以创建标题，例如：\n# 一级标题\n## 二级标题"
          />
        );
      case 'image':
        return (
          <div
            className={`image-drop-zone ${isImageDragOver ? 'drag-over' : ''}`}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
          >
            {uploadingImage && (
              <div className="image-uploading-overlay">
                <div className="upload-spinner" />
                <span>上传中...</span>
              </div>
            )}
            {imageUrl && imageUrl.length > 0 ? (
              <img
                src={imageUrl}
                alt="Block image"
                className="block-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  拖拽图片文件到此处或在下方输入URL
                </p>
              </div>
            )}
            <input
              type="text"
              className="block-image-input"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="输入图片URL..."
              style={{ marginTop: '12px' }}
            />
          </div>
        );
      case 'code':
        const highlighted = highlightCode(localContent, currentLanguage);
        return (
          <>
            <div className="block-code-header">
              <select
                className="block-language-select"
                value={currentLanguage}
                onChange={handleLanguageSelect}
              >
                {supportedLanguages().map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="code-editor-wrapper">
              <div
                ref={codeRef}
                className="block-code code-input"
                contentEditable
                onInput={handleCodeChange}
                onBlur={handleCodeBlur}
                suppressContentEditableWarning
                spellCheck={false}
                data-placeholder="// 在这里输入代码..."
              />
              <pre
                ref={codeMirrorRef}
                className="block-code code-highlight"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const totalVotes = block.votes.happy + block.votes.sad + block.votes.surprised;

  const blockStyle: React.CSSProperties = {};
  if (dragTransform) {
    blockStyle.transform = dragTransform;
    blockStyle.transition = 'transform 0.2s ease';
    blockStyle.willChange = 'transform';
  }
  if (isTouchDragging) {
    blockStyle.zIndex = 1000;
    blockStyle.opacity = 0.85;
    blockStyle.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
    blockStyle.transform = dragTransform || 'scale(1.02)';
    blockStyle.transition = 'none';
  }

  return (
    <div
      ref={blockRef}
      className={`editor-block ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isNew ? 'new-block' : ''} ${isTouchDragging ? 'touch-dragging' : ''}`}
      draggable={isDesktopDraggable}
      onDragStart={(e) => onDragStart(e, block.id)}
      onDragOver={(e) => onDragOver(e, block.id)}
      onDrop={(e) => onDrop(e, block.id)}
      onDragEnd={onDragEnd}
      onTouchStart={handleBlockTouchStart}
      onTouchMove={handleBlockTouchMove}
      onTouchEnd={handleBlockTouchEnd}
      style={blockStyle}
      data-block-id={block.id}
    >
      <div
        className="block-drag-handle"
        onMouseDown={() => setIsDesktopDraggable(true)}
        onMouseUp={() => setIsDesktopDraggable(false)}
        onMouseLeave={() => setIsDesktopDraggable(false)}
        onTouchStart={handleDragHandleTouchStart}
        onTouchMove={handleDragHandleTouchMove}
        onTouchEnd={handleDragHandleTouchEnd}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

      {totalVotes > 0 && (
        <div className="block-total-votes">
          <span>👍</span>
          <span>{totalVotes}</span>
        </div>
      )}

      <div className="block-content">
        {renderContent()}
      </div>

      {showSaved && (
        <div className="block-saved-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>已保存</span>
        </div>
      )}

      <div className="block-vote-container">
        {(['happy', 'sad', 'surprised'] as VoteType[]).map((type) => (
          <button
            key={type}
            className={`vote-btn ${userVote === type ? 'active' : ''}`}
            onClick={() => handleVote(type)}
            title={type === 'happy' ? '赞同' : type === 'sad' ? '反对' : '惊讶'}
          >
            {VOTE_EMOJIS[type]}
            {block.votes[type] > 0 && (
              <span className="vote-count">{block.votes[type]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="block-menu">
        <button
          className="block-menu-btn"
          onClick={() => onAddConnection(block.id)}
          title="添加关联"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button
          className="block-menu-btn"
          onClick={() => onDelete(block.id)}
          title="删除块"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
