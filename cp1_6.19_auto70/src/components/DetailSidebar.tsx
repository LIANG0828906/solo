import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineX,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import type { Excerpt, LinkedExcerpt } from '../types';
import { ExcerptCard } from './ExcerptCard';
import { AnnotationBubble } from './AnnotationBubble';

interface DetailSidebarProps {
  excerpt: Excerpt | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAnnotationChange: (annotation: string) => void;
  onAddImage: (url: string) => void;
  onRemoveImage: (index: number) => void;
  onImageClick: (url: string) => void;
  relatedExcerpts: LinkedExcerpt[];
  onRelatedClick: (excerpt: Excerpt) => void;
  isDeleting: boolean;
}

export function DetailSidebar({
  excerpt,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAnnotationChange,
  onAddImage,
  onRemoveImage,
  onImageClick,
  relatedExcerpts,
  onRelatedClick,
  isDeleting,
}: DetailSidebarProps) {
  const [annotationText, setAnnotationText] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (excerpt) {
      setAnnotationText(excerpt.annotation);
    }
  }, [excerpt?.id, excerpt?.annotation]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (excerpt && annotationText !== excerpt.annotation) {
        onAnnotationChange(annotationText);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [annotationText, excerpt?.id, excerpt?.annotation, onAnnotationChange]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !excerpt) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAddImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim() || !excerpt) return;
    onAddImage(imageUrlInput.trim());
    setImageUrlInput('');
    setShowImageInput(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!excerpt) return null;

  const contentLines = excerpt.content.split('\n');

  return (
    <div
      className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--open' : ''}`}
      onClick={handleOverlayClick}
    >
      <aside
        className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${
          isDeleting ? 'sidebar--closing' : ''
        }`}
      >
        <div className="sidebar__header" style={{ backgroundColor: excerpt.color }}>
          <div className="sidebar__header-content">
            <h2 className="sidebar__title">{excerpt.bookTitle}</h2>
            <p className="sidebar__author">— {excerpt.author}</p>
            <div className="sidebar__category-tag">{excerpt.category}</div>
          </div>
          <div className="sidebar__header-actions">
            <button className="sidebar__action-btn" onClick={onEdit} title="编辑">
              <HiOutlinePencil size={20} />
            </button>
            <button className="sidebar__action-btn" onClick={onDelete} title="删除">
              <HiOutlineTrash size={20} />
            </button>
            <button className="sidebar__action-btn" onClick={onClose} title="关闭">
              <HiOutlineX size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar__body">
          <section className="sidebar__section">
            <h3 className="sidebar__section-title">原文摘录</h3>
            <div className="sidebar__content-box">
              {contentLines.map((line, idx) => (
                <div key={idx} className="sidebar__content-line">
                  <span className="sidebar__line-number">{idx + 1}</span>
                  <span className="sidebar__line-text">{line || ' '}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="sidebar__section">
            <h3 className="sidebar__section-title">关键词标签</h3>
            <div className="sidebar__tags">
              {excerpt.tags.map((tag) => (
                <span key={tag} className="sidebar__tag" style={{ backgroundColor: excerpt.color }}>
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          <section className="sidebar__section">
            <h3 className="sidebar__section-title">我的批注</h3>
            <textarea
              className="sidebar__annotation-input"
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="记录你的随想、感悟、思考…"
              rows={4}
            />
            {excerpt.annotation && (
              <AnnotationBubble annotation={excerpt.annotation} />
            )}
          </section>

          <section className="sidebar__section">
            <h3 className="sidebar__section-title">关联图片</h3>
            <div className="sidebar__image-grid">
              {excerpt.images.map((url, idx) => (
                <div key={idx} className="sidebar__image-item">
                  <img
                    src={url}
                    alt={`关联图片 ${idx + 1}`}
                    className="sidebar__image"
                    loading="lazy"
                    onClick={() => onImageClick(url)}
                  />
                  <button
                    className="sidebar__image-remove"
                    onClick={() => onRemoveImage(idx)}
                    aria-label="删除图片"
                  >
                    <HiOutlineX size={14} />
                  </button>
                </div>
              ))}
              {excerpt.images.length < 5 && (
                <>
                  <button
                    className="sidebar__image-add"
                    onClick={() => setShowImageInput((v) => !v)}
                  >
                    <HiOutlinePlus size={20} />
                    <span>URL</span>
                  </button>
                  <label className="sidebar__image-add" title="上传本地图片">
                    <HiOutlinePhotograph size={20} />
                    <span>上传</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </>
              )}
            </div>
            {showImageInput && (
              <div className="sidebar__image-url-input">
                <input
                  type="url"
                  placeholder="粘贴图片链接…"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
                <button className="btn btn--primary btn--small" onClick={handleAddImageUrl}>
                  添加
                </button>
              </div>
            )}
          </section>

          {relatedExcerpts.length > 0 && (
            <section className="sidebar__section">
              <h3 className="sidebar__section-title">关联摘录推荐</h3>
              <div className="sidebar__related-scroll">
                {relatedExcerpts.map(({ excerpt: rel, similarity }) => (
                  <div key={rel.id} className="sidebar__related-card-wrapper">
                    <div className="sidebar__related-badge">{similarity}%</div>
                    <div onClick={() => onRelatedClick(rel)} className="sidebar__related-card">
                      <ExcerptCard
                        excerpt={rel}
                        onClick={() => {}}
                        isDeleting={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
