import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, X, ChevronRight, Menu, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore, generateId } from '../store';
import type { Question } from '../types';

export const AskPage: React.FC = () => {
  const navigate = useNavigate();
  const addQuestion = useStore(state => state.addQuestion);
  const getSimilarQuestions = useStore(state => state.getSimilarQuestions);
  const saveDraft = useStore(state => state.saveDraft);
  const loadDraft = useStore(state => state.loadDraft);
  const clearDraft = useStore(state => state.clearDraft);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setTags(draft.tags);
    }
  }, [loadDraft]);

  const similarQuestions = getSimilarQuestions(tags);

  const doSaveDraft = useCallback(() => {
    const content = title + description + tags.join(',');
    if (content !== lastSavedRef.current && (title || description || tags.length > 0)) {
      setIsSaving(true);
      saveDraft({
        title,
        description,
        tags,
        savedAt: new Date().toISOString()
      });
      lastSavedRef.current = content;
      setTimeout(() => setIsSaving(false), 600);
    }
  }, [title, description, tags, saveDraft]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      doSaveDraft();
    }, 30000);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, tags, doSaveDraft]);

  const handleBlur = () => {
    doSaveDraft();
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('请输入问题标题');
      return;
    }
    if (!description.trim()) {
      toast.error('请输入问题描述');
      return;
    }

    const newQuestion: Question = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      tags,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    addQuestion(newQuestion);
    clearDraft();
    lastSavedRef.current = '';
    toast.success('问题发布成功！');
    navigate(`/question/${newQuestion.id}`);
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ffcc80',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#5d4037',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)'
  };

  const inputFocusStyles: React.CSSProperties = {
    borderColor: '#e65100',
    boxShadow: '0px 4px 12px rgba(230, 81, 0, 0.15)'
  };

  const buttonStyles: React.CSSProperties = {
    padding: '12px 32px',
    borderRadius: '8px',
    backgroundColor: '#e65100',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    boxShadow: '0px 2px 4px rgba(230, 81, 0, 0.2)'
  };

  const tagStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fff3e0',
    color: '#e65100',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500'
  };

  const sidebarCardStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const sidebarContainerStyles: React.CSSProperties = isMobile ? {
    position: 'fixed',
    top: 0,
    right: showSidebar ? 0 : '-320px',
    width: '300px',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    zIndex: 100,
    transition: 'right 0.3s ease',
    overflowY: 'auto',
    boxShadow: showSidebar ? '-4px 0 20px rgba(0, 0, 0, 0.1)' : 'none'
  } : {
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    padding: '20px',
    alignSelf: 'flex-start',
    position: 'sticky',
    top: '80px'
  };

  const savingIndicatorStyles: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: isSaving ? '#4caf50' : '#bdbdbd',
    transition: 'background-color 0.3s ease',
    animation: isSaving ? 'pulse 0.6s ease-in-out infinite' : 'none'
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {isMobile && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#e65100',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 4px 12px rgba(230, 81, 0, 0.3)',
              zIndex: 50
            }}
          >
            <Menu size={24} />
          </button>
        )}

        {isMobile && showSidebar && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 99
            }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#bf360c', 
            marginBottom: '8px' 
          }}>
            发布新问题
          </h1>
          <p style={{ color: '#8d6e63', marginBottom: '32px', fontSize: '15px' }}>
            清晰地描述你的问题，让社区成员能够更好地帮助你
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#5d4037', 
                marginBottom: '8px' 
              }}>
                问题标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="请简明扼要地描述你的问题..."
                style={inputStyles}
                maxLength={200}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                onBlurCapture={(e) => {
                  e.target.style.borderColor = '#ffcc80';
                  e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  handleBlur();
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '6px',
                fontSize: '12px',
                color: '#a1887f'
              }}>
                <span>好的标题应该简洁明了，能够概括问题的核心</span>
                <span>{title.length}/200</span>
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#5d4037', 
                marginBottom: '8px' 
              }}>
                详细描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlur}
                placeholder="详细描述你的问题，包括背景、你已经尝试过的解决方法等..."
                rows={10}
                style={{ ...inputStyles, resize: 'vertical', minHeight: '200px' }}
                maxLength={5000}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                onBlurCapture={(e) => {
                  e.target.style.borderColor = '#ffcc80';
                  e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  handleBlur();
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginTop: '6px',
                fontSize: '12px',
                color: '#a1887f'
              }}>
                {description.length}/5000
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#5d4037', 
                marginBottom: '8px' 
              }}>
                标签 <span style={{ fontWeight: '400', color: '#a1887f' }}>(最多5个，帮助其他人找到你的问题)</span>
              </label>
              <div
                style={{
                  ...inputStyles,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '48px',
                  alignItems: 'center',
                  cursor: 'text'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus();
                  }
                }}
              >
                {tags.map(tag => (
                  <span key={tag} style={tagStyles}>
                    <Tag size={14} />
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                      style={{ display: 'flex', color: '#e65100' }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      addTag();
                      handleBlur();
                    }}
                    placeholder={tags.length === 0 ? '输入标签后按回车添加...' : ''}
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      minWidth: '120px',
                      fontSize: '14px',
                      backgroundColor: 'transparent',
                      color: '#5d4037',
                      padding: '4px 0'
                    }}
                  />
                )}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '6px',
                fontSize: '12px',
                color: '#a1887f'
              }}>
                <span>例如：React、TypeScript、前端</span>
                <span>{tags.length}/5</span>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #ffe0b2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#8d6e63' }}>
                <div style={savingIndicatorStyles} />
                <Clock size={16} />
                <span>{isSaving ? '正在保存草稿...' : '草稿已自动保存'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setTitle('');
                    setDescription('');
                    setTags([]);
                    lastSavedRef.current = '';
                    toast.success('草稿已清除');
                  }}
                  style={{
                    ...buttonStyles,
                    backgroundColor: '#ffffff',
                    color: '#e65100',
                    border: '1px solid #ffcc80',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  清除草稿
                </button>
                <button
                  type="submit"
                  style={buttonStyles}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.backgroundColor = '#bf360c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0px 2px 4px rgba(230, 81, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = '#e65100';
                  }}
                >
                  发布问题
                </button>
              </div>
            </div>
          </form>
        </div>

        <div style={{ ...sidebarContainerStyles, width: isMobile ? '300px' : '320px', flexShrink: 0 }}>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#bf360c' }}>
                相似问题推荐
              </h3>
              <button onClick={() => setShowSidebar(false)}>
                <X size={20} color="#5d4037" />
              </button>
            </div>
          )}
          {!isMobile && (
            <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '700', color: '#bf360c' }}>
              相似问题推荐
            </h3>
          )}
          
          {similarQuestions.length === 0 ? (
            <p style={{ color: '#a1887f', fontSize: '13px', lineHeight: '1.6' }}>
              添加标签后，这里会显示与你问题相关的已有问题，帮助你快速找到答案。
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {similarQuestions.map(q => (
                <a
                  key={q.id}
                  href={`/question/${q.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={sidebarCardStyles}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#5d4037',
                      marginBottom: '8px',
                      lineHeight: '1.5'
                    }}>
                      {q.title}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {q.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          padding: '2px 8px',
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#a1887f'
                    }}>
                      <span>{new Date(q.createdAt).toLocaleDateString('zh-CN')}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#e65100' }}>
                        查看 <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
