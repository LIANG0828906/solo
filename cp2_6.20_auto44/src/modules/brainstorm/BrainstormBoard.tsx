import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IdeaCard } from './IdeaCard';
import { useIdeasStore } from '../../store/ideasStore';
import { Idea, PRESET_TAGS, VoteType } from '../../types';

const COL_COUNT = 2;

export const BrainstormBoard: React.FC = () => {
  const { ideas, users, voteIdea, addIdea, currentUser } = useIdeasStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 });

  const onlineUsers = useMemo(() => users.filter((u) => u.online), [users]);

  const columnedIdeas = useMemo(() => {
    const cols: Idea[][] = Array.from({ length: COL_COUNT }, () => []);
    ideas.forEach((idea, i) => {
      cols[i % COL_COUNT].push(idea);
    });
    return cols;
  }, [ideas]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      await addIdea(title.trim(), description.trim(), selectedTags);
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      setIsExpanded(false);
    },
    [title, description, selectedTags, addIdea]
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 3 ? [...prev, tag] : prev
    );
  }, []);

  const handleVote = useCallback(
    (ideaId: string, voteType: VoteType) => {
      voteIdea(ideaId, voteType);
    },
    [voteIdea]
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      const itemHeight = 250;
      const buffer = 5;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) * COL_COUNT - buffer);
      const end = start + Math.ceil(viewportHeight / itemHeight) * COL_COUNT + buffer * COL_COUNT;
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleIdeas = useMemo(() => {
    return ideas.slice(visibleRange.start, visibleRange.end);
  }, [ideas, visibleRange]);

  const visibleIds = useMemo(() => new Set(visibleIdeas.map((i) => i.id)), [visibleIdeas]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>💡</div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                创意头脑风暴
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                共 {ideas.length} 个点子 · 实时同步中
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onlineUsers.slice(0, 6).map((user) => (
              <div
                key={user.id}
                className="fade-in-slide"
                style={{
                  position: 'relative',
                  marginLeft: '-8px',
                  animationDelay: `${Math.random() * 0.2}s`,
                }}
                title={user.name}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid #1e293b',
                    background: '#334155',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: user.online ? '#22c55e' : '#64748b',
                    border: '2px solid #1e293b',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </div>
              </div>
            ))}
            {onlineUsers.length > 6 && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.3)',
                  border: '2px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#fdba74',
                  marginLeft: '-8px',
                  fontWeight: 600,
                }}
              >
                +{onlineUsers.length - 6}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              flexDirection: isExpanded ? 'column' : 'row',
            }}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="输入你的创意点子标题..."
              style={{
                flex: isExpanded ? 'none' : 1,
                width: isExpanded ? '100%' : undefined,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.6)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
            {isExpanded && (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="详细描述（可选）..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      minHeight: '40px',
                      alignItems: 'center',
                    }}
                  >
                    {selectedTags.length === 0 ? (
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        选择标签（最多3个）
                      </span>
                    ) : (
                      selectedTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(249, 115, 22, 0.25)',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#fdba74',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {tag}
                          <span onClick={(e) => { e.stopPropagation(); toggleTag(tag); }} style={{ cursor: 'pointer' }}>
                            ✕
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                  {showTagPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        padding: '12px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        zIndex: 100,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                      className="fade-in"
                    >
                      {PRESET_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: selectedTags.includes(tag)
                              ? '1px solid rgba(249, 115, 22, 0.6)'
                              : '1px solid rgba(255,255,255,0.1)',
                            background: selectedTags.includes(tag)
                              ? 'rgba(249, 115, 22, 0.25)'
                              : 'rgba(255,255,255,0.05)',
                            color: selectedTags.includes(tag) ? '#fdba74' : '#cbd5e1',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setTitle('');
                      setDescription('');
                      setSelectedTags([]);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: title.trim()
                        ? 'linear-gradient(135deg, #f97316, #ea580c)'
                        : 'rgba(249, 115, 22, 0.3)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: title.trim() ? 'pointer' : 'not-allowed',
                      boxShadow: title.trim()
                        ? '0 4px 12px rgba(249, 115, 22, 0.35)'
                        : 'none',
                    }}
                  >
                    ✨ 发布点子
                  </button>
                </div>
              </>
            )}
            {!isExpanded && (
              <button
                type="submit"
                disabled={!title.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: title.trim()
                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                    : 'rgba(249, 115, 22, 0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: title.trim() ? '0 4px 12px rgba(249, 115, 22, 0.35)' : 'none',
                }}
              >
                发布
              </button>
            )}
          </div>
        </form>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COL_COUNT}, 1fr)`,
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {columnedIdeas.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {col.map((idea) =>
                visibleIds.has(idea.id) ? (
                  <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
                ) : (
                  <div
                    key={idea.id}
                    style={{
                      height: '220px',
                      marginBottom: '16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {ideas.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>还没有创意点子</p>
            <p style={{ fontSize: '13px', opacity: 0.7 }}>输入标题，开始你的第一个创意吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};
