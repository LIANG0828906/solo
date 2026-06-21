import React, { useState, useMemo, useEffect } from 'react';
import { Camera, AlignLeft, Layers, X } from 'lucide-react';
import { useSelection } from '../contexts/SelectionContext';
import { useCollection } from '../contexts/CollectionContext';
import TagChip from './TagChip';
import type { ContentType } from '../types';

const typeConfig: Record<ContentType, { icon: React.ReactNode; label: string; color: string }> = {
  image: { icon: <Camera size={18} />, label: '图片', color: '#3B82F6' },
  text: { icon: <AlignLeft size={18} />, label: '文字', color: '#10B981' },
  mixed: { icon: <Layers size={18} />, label: '混合', color: '#8B5CF6' },
};

const FloatingPanel: React.FC = () => {
  const { selection, clearSelection } = useSelection();
  const { createSnippet, showToast, allTags } = useCollection();

  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (selection) {
      setTitle(selection.plainText.slice(0, 30) || '未命名片段');
      setLocalTags([]);
      setTagInput('');
      setIsVisible(false);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [selection]);

  const matchedSuggestions = useMemo(() => {
    if (!tagInput.trim() || !showSuggestions) return [];
    const q = tagInput.toLowerCase();
    return allTags
      .filter((t) => t.toLowerCase().includes(q) && !localTags.includes(t))
      .slice(0, 5);
  }, [tagInput, allTags, localTags, showSuggestions]);

  if (!selection) return null;

  const cfg = typeConfig[selection.contentType];

  const addTagFromInput = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const tags = raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    if (tags.length) {
      setLocalTags((prev) => {
        const set = new Set([...prev, ...tags]);
        return Array.from(set);
      });
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault();
      addTagFromInput();
    } else if (e.key === 'Backspace' && !tagInput && localTags.length > 0) {
      setLocalTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !selection) {
      showToast('标题不能为空', 'error');
      return;
    }

    setIsSaving(true);
    const created = await createSnippet({
      title: title.trim(),
      tags: localTags,
      sourceUrl: window.location.href,
      contentType: selection.contentType,
      html: selection.html,
      plainText: selection.plainText,
    });

    setIsSaving(false);

    if (created) {
      showToast('已保存');
      clearSelection();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => clearSelection(), 200);
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: isVisible ? 'rgba(0,0,0,0.08)' : 'transparent',
          transition: 'background-color 0.3s ease',
          zIndex: 99,
        }}
      />
      <div
        className="prevent-selection"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          width: '100%',
          maxWidth: 420,
          height: 'calc(100vh - 48px)',
          maxHeight: 760,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '20px 20px 12px',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                backgroundColor: cfg.color + '15',
                color: cfg.color,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {cfg.icon}
              <span>{cfg.label}类型</span>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            placeholder="给这个片段起个名字"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 15,
              fontWeight: 600,
              color: '#111827',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
            onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {title.length}/50
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            background: 'linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            内容预览
          </div>
          <div
            className="snippet-preview"
            style={{
              padding: 16,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.6,
              maxHeight: 300,
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: selection.html }}
          />
        </div>

        <div
          style={{
            padding: '12px 20px 20px',
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            标签
          </div>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: '8px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              minHeight: 42,
              transition: 'border-color 0.2s ease',
              alignItems: 'center',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus();
              }
            }}
          >
            {localTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                size="sm"
                onRemove={() => setLocalTags((prev) => prev.filter((t) => t !== tag))}
              />
            ))}
            <input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleTagKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="输入标签后回车或用逗号分隔..."
              style={{
                flex: 1,
                minWidth: 120,
                border: 'none',
                outline: 'none',
                fontSize: 13,
                padding: '4px 6px',
                background: 'transparent',
              }}
            />
            {matchedSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {matchedSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setLocalTags((prev) => [...prev, s]);
                      setTagInput('');
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 13,
                      color: '#374151',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                width: 100,
                height: 36,
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                transform: isSaving ? 'scale(0.95)' : 'scale(1)',
                opacity: isSaving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSaving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563EB';
              }}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = isSaving ? '#3B82F6' : '#3B82F6')}
              onMouseDown={(e) => {
                if (!isSaving) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                if (!isSaving) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .prevent-selection {
            top: 0 !important;
            right: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            transform: translateY(0) !important;
          }
        }
        .snippet-preview img {
          max-width: 360px;
          height: auto;
          display: block;
        }
      `}</style>
    </>
  );
};

export default FloatingPanel;
