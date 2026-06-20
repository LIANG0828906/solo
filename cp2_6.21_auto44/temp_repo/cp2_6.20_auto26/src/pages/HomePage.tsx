import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, Plus, Sparkles, Tag, FolderOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore, generateId } from '../store';
import { KnowledgeCardComponent } from '../components/KnowledgeCard';
import type { KnowledgeCard } from '../types';

export const HomePage: React.FC = () => {
  const cards = useStore(state => state.cards);
  const questions = useStore(state => state.questions);
  const addCard = useStore(state => state.addCard);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCard, setNewCard] = useState({
    title: '',
    summary: '',
    category: '',
    tags: [] as string[],
    content: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(6);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoading || displayCount >= cards.length) return;
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 6, cards.length));
      setIsLoading(false);
    }, 1000);
  }, [isLoading, displayCount, cards.length]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= docHeight - 200) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore]);

  const handleCreateCard = () => {
    if (!newCard.title.trim()) {
      toast.error('请输入卡片标题');
      return;
    }
    if (!newCard.summary.trim()) {
      toast.error('请输入卡片摘要');
      return;
    }
    if (!newCard.category.trim()) {
      toast.error('请选择或输入分类');
      return;
    }
    if (!newCard.content.trim()) {
      toast.error('请输入Markdown内容');
      return;
    }

    const card: KnowledgeCard = {
      id: generateId(),
      title: newCard.title.trim(),
      summary: newCard.summary.trim(),
      category: newCard.category.trim(),
      tags: newCard.tags,
      content: newCard.content.trim(),
      isFavorited: false,
      createdAt: new Date().toISOString()
    };

    addCard(card);
    setShowCreateModal(false);
    setNewCard({ title: '', summary: '', category: '', tags: [], content: '' });
    setTagInput('');
    toast.success('知识卡片创建成功！');
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !newCard.tags.includes(trimmedTag) && newCard.tags.length < 5) {
      setNewCard({ ...newCard, tags: [...newCard.tags, trimmedTag] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewCard({ ...newCard, tags: newCard.tags.filter(t => t !== tagToRemove) });
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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #e65100 0%, #ff6f00 50%, #ff8f00 100%)',
        borderRadius: '16px',
        padding: '48px 32px',
        marginBottom: '32px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '100px',
          width: '250px',
          height: '250px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            margin: 0, 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Sparkles size={36} />
            知识共享社区
          </h1>
          <p style={{ 
            fontSize: '18px', 
            opacity: 0.9, 
            margin: 0,
            marginBottom: '28px',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            在这里分享你的知识，提出你的问题，与社区成员一起成长。
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/ask"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#e65100',
                fontWeight: '700',
                fontSize: '15px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0px 6px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              <HelpCircle size={20} />
              发布问题
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '15px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={20} />
              创建知识卡片
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#bf360c', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <BookOpen size={28} />
          知识卡片
        </h2>
        <span style={{ color: '#8d6e63', fontSize: '14px' }}>
          共 {cards.length} 张卡片
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {cards.slice(0, displayCount).map(card => (
          <KnowledgeCardComponent key={card.id} card={card} />
        ))}
      </div>

      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '32px 0',
          marginBottom: '16px'
        }}>
          <Loader2 
            size={28} 
            style={{
              color: '#ffcc80',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {!isLoading && displayCount >= cards.length && cards.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          marginBottom: '24px',
          color: '#a1887f',
          fontSize: '13px'
        }}>
          已加载全部 {cards.length} 张卡片
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #ffe0b2'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#bf360c', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <HelpCircle size={28} />
          热门问题
        </h2>
        <Link
          to="/ask"
          style={{ 
            color: '#e65100', 
            fontSize: '14px', 
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          查看全部
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px'
      }}>
        {questions.slice(0, 4).map(q => (
          <Link
            key={q.id}
            to={`/question/${q.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#5d4037',
                margin: 0,
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {q.title}
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#8d6e63',
                lineHeight: '1.6',
                margin: 0,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {q.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {q.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    backgroundColor: '#fff3e0',
                    color: '#e65100',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff8e1',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #ffe0b2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#bf360c' }}>
                创建知识卡片
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px', borderRadius: '8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5d4037', marginBottom: '8px' }}>
                  标题
                </label>
                <input
                  type="text"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  placeholder="输入知识卡片标题..."
                  style={inputStyles}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ffcc80';
                    e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5d4037', marginBottom: '8px' }}>
                  摘要
                </label>
                <textarea
                  value={newCard.summary}
                  onChange={(e) => setNewCard({ ...newCard, summary: e.target.value })}
                  placeholder="简短描述这个知识点..."
                  rows={2}
                  style={{ ...inputStyles, resize: 'none' }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ffcc80';
                    e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5d4037', marginBottom: '8px' }}>
                  <FolderOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  分类
                </label>
                <input
                  type="text"
                  value={newCard.category}
                  onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                  placeholder="例如：前端开发、后端开发、设计..."
                  style={inputStyles}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ffcc80';
                    e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5d4037', marginBottom: '8px' }}>
                  标签 <span style={{ fontWeight: '400', color: '#a1887f' }}>(最多5个)</span>
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
                  {newCard.tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: '#fff3e0',
                      color: '#e65100',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      <Tag size={12} />
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(tag);
                        }}
                        style={{ fontSize: '14px', color: '#e65100', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {newCard.tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      onBlur={addTag}
                      placeholder={newCard.tags.length === 0 ? '输入标签后按回车添加...' : ''}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5d4037', marginBottom: '8px' }}>
                  Markdown 内容
                </label>
                <textarea
                  value={newCard.content}
                  onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                  placeholder="使用 Markdown 语法编写内容...\n\n# 标题\n## 小标题\n- 列表项\n```代码块```"
                  rows={10}
                  style={{
                    ...inputStyles,
                    resize: 'vertical',
                    minHeight: '200px',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    fontSize: '13px',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyles)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ffcc80';
                    e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #ffe0b2',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#e65100',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: '1px solid #ffcc80',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateCard}
                style={{
                  padding: '12px 28px',
                  borderRadius: '8px',
                  backgroundColor: '#e65100',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0px 2px 4px rgba(230, 81, 0, 0.2)'
                }}
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
                <Plus size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                创建卡片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
