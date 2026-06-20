import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useBoardStore from '../store/useBoardStore';
import {
  getBoardRoom,
  addCreative,
  voteCreative,
  deleteCreative,
} from '../api/boardApi';
import {
  onCreativeCreated,
  onCreativeVoted,
  onCreativeDeleted,
  emitCreativeCreated,
  emitCreativeVoted,
  emitCreativeDeleted,
  disconnect,
} from '../socket/socketClient';
import CreativeCard from '../components/CreativeCard';
import VoteButton from '../components/VoteButton';
import { CreativeType, TYPE_COLORS, ICreative } from '../types';

type SortOption = 'votes_desc' | 'votes_asc' | 'created_desc' | 'created_asc';

const CURRENT_USER_ID = 'user_' + (localStorage.getItem('userId') || (() => {
  const id = Math.random().toString(36).slice(2, 10);
  localStorage.setItem('userId', id);
  return id;
})());

const CURRENT_USER_NAME = localStorage.getItem('userName') || '匿名用户';

const BoardRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    boardRoom,
    setBoardRoom,
    addCreative: storeAddCreative,
    updateCreative,
    removeCreative,
    optimisticVote,
    rollbackVote,
  } = useBoardStore();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<CreativeType>(CreativeType.功能);
  const [sortOption, setSortOption] = useState<SortOption>('votes_desc');
  const [activeTypes, setActiveTypes] = useState<Set<CreativeType>>(new Set());
  const [contentError, setContentError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadRoom = async () => {
      setLoading(true);
      try {
        const data = await getBoardRoom(id);
        setBoardRoom(data);
      } catch (error) {
        console.error('Failed to load board room:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();

    const offCreated = onCreativeCreated((creative) => {
      if (creative.boardRoomId === id) {
        storeAddCreative(creative);
      }
    });

    const offVoted = onCreativeVoted((creative) => {
      if (creative.boardRoomId === id) {
        updateCreative(creative);
      }
    });

    const offDeleted = onCreativeDeleted((data) => {
      if (data.boardRoomId === id) {
        removeCreative(data.creativeId);
      }
    });

    return () => {
      offCreated();
      offVoted();
      offDeleted();
      disconnect();
    };
  }, [id, setBoardRoom, storeAddCreative, updateCreative, removeCreative]);

  const filteredAndSortedCreatives = useMemo(() => {
    if (!boardRoom) return [];
    let list = [...boardRoom.creatives];

    if (activeTypes.size > 0) {
      list = list.filter((c) => activeTypes.has(c.type as CreativeType));
    }

    switch (sortOption) {
      case 'votes_desc':
        list.sort((a, b) => b.votes - a.votes);
        break;
      case 'votes_asc':
        list.sort((a, b) => a.votes - b.votes);
        break;
      case 'created_desc':
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'created_asc':
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    return list;
  }, [boardRoom, sortOption, activeTypes]);

  const handleSubmitCreative = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.length < 1 || content.length > 200) {
      setContentError('创意内容必须为1-200个字符');
      return;
    }

    if (!id) return;

    setSubmitting(true);
    try {
      const creative = await addCreative(id, {
        content: content.trim(),
        type: selectedType,
        author: CURRENT_USER_NAME,
        createdBy: CURRENT_USER_ID,
      });
      emitCreativeCreated(creative);
      storeAddCreative(creative);
      setContent('');
      setContentError('');
    } catch (error) {
      console.error('Failed to add creative:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (creative: ICreative) => {
    if (!id) return;

    const prevState = optimisticVote(creative.id, CURRENT_USER_ID);
    if (!prevState) return;

    try {
      const updated = await voteCreative(id, creative.id, CURRENT_USER_ID);
      emitCreativeVoted({
        boardRoomId: id,
        creativeId: creative.id,
        userId: CURRENT_USER_ID,
      });
      updateCreative(updated);
    } catch (error) {
      console.error('Failed to vote:', error);
      rollbackVote(creative.id, prevState.prevVotes, prevState.prevVoters);
    }
  };

  const handleDelete = async (creative: ICreative) => {
    if (!id) return;

    try {
      await deleteCreative(id, creative.id);
      emitCreativeDeleted({
        boardRoomId: id,
        creativeId: creative.id,
      });
      removeCreative(creative.id);
    } catch (error) {
      console.error('Failed to delete creative:', error);
    }
  };

  const toggleTypeFilter = (type: CreativeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px 20px 40px',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const topBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };

  const roomHeaderStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '200px',
  };

  const roomNameStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  const roomDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    margin: '6px 0 0 0',
    lineHeight: 1.5,
  };

  const controlBarStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    alignItems: 'center',
  };

  const controlGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const controlLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    color: '#333',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const createChipStyle = (type: CreativeType, active: boolean): React.CSSProperties => {
    const color = TYPE_COLORS[type];
    return {
      padding: '6px 14px',
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '16px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: active ? color : '#f0f0f0',
      color: active ? '#fff' : '#888',
    };
  };

  const inputAreaStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '28px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '280px',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    borderColor: contentError ? '#e91e63' : '#e0e0e0',
  };

  const rightControlsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '140px',
  };

  const typeSelectStyle: React.CSSProperties = {
    ...selectStyle,
    width: '100%',
  };

  const charCountStyle: React.CSSProperties = {
    fontSize: '11px',
    color: contentError ? '#e91e63' : '#aaa',
    textAlign: 'right',
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const errorTextStyle: React.CSSProperties = {
    color: '#e91e63',
    fontSize: '12px',
    marginTop: '6px',
  };

  const boardStyle: React.CSSProperties = {
    columnCount: 3,
    columnGap: '16px',
    '@media (max-width: 1024px)': {
      columnCount: 2,
    },
    '@media (max-width: 640px)': {
      columnCount: 1,
    },
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#fff',
    fontSize: '18px',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '16px',
    lineHeight: 1.8,
  };

  const responsiveBoardStyle = {
    ...boardStyle,
  };

  return (
    <div style={pageStyle}>
      <style>{`
        @media (max-width: 1024px) {
          .board-column { column-count: 2 !important; }
        }
        @media (max-width: 640px) {
          .board-column { column-count: 1 !important; }
        }
      `}</style>

      <div style={containerStyle}>
        <div style={topBarStyle}>
          <button
            onClick={() => navigate('/')}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
          >
            ← 返回列表
          </button>

          <div style={roomHeaderStyle}>
            {loading ? (
              <>
                <h2 style={{ ...roomNameStyle, opacity: 0.7 }}>加载中...</h2>
              </>
            ) : boardRoom ? (
              <>
                <h2 style={roomNameStyle}>{boardRoom.name}</h2>
                {boardRoom.description && (
                  <p style={roomDescStyle}>{boardRoom.description}</p>
                )}
              </>
            ) : (
              <h2 style={{ ...roomNameStyle, opacity: 0.7 }}>未找到房间</h2>
            )}
          </div>
        </div>

        {!loading && boardRoom && (
          <>
            <div style={controlBarStyle}>
              <div style={controlGroupStyle}>
                <span style={controlLabelStyle}>排序：</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  style={selectStyle}
                >
                  <option value="votes_desc">投票数 从高到低</option>
                  <option value="votes_asc">投票数 从低到高</option>
                  <option value="created_desc">创建时间 最新</option>
                  <option value="created_asc">创建时间 最早</option>
                </select>
              </div>

              <div style={{ ...controlGroupStyle, flex: 1, minWidth: '300px' }}>
                <span style={controlLabelStyle}>类型筛选：</span>
                {Object.values(CreativeType).map((type) => {
                  const active = activeTypes.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      style={createChipStyle(type, active)}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={inputAreaStyle}>
              <form onSubmit={handleSubmitCreative}>
                <div style={inputRowStyle}>
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (contentError) setContentError('');
                    }}
                    placeholder="写下你的创意灵感...（1-200字符）"
                    style={textareaStyle}
                    onFocus={(e) => {
                      if (!contentError) {
                        e.currentTarget.style.borderColor = '#667eea';
                      }
                    }}
                    onBlur={(e) => {
                      if (!contentError) {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }
                    }}
                    maxLength={200}
                  />

                  <div style={rightControlsStyle}>
                    <select
                      value={selectedType}
                      onChange={(e) =>
                        setSelectedType(e.target.value as CreativeType)
                      }
                      style={typeSelectStyle}
                    >
                      {Object.values(CreativeType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    <div style={charCountStyle}>
                      {content.length}/200
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        ...submitButtonStyle,
                        opacity: submitting ? 0.6 : 1,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!submitting) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {submitting ? '提交中...' : '提交创意'}
                    </button>
                  </div>
                </div>
                {contentError && <div style={errorTextStyle}>{contentError}</div>}
              </form>
            </div>

            {filteredAndSortedCreatives.length === 0 ? (
              <div style={emptyStyle}>
                {boardRoom.creatives.length === 0
                  ? '暂无创意，快来提交第一个吧！💡'
                  : '没有符合筛选条件的创意'}
              </div>
            ) : (
              <div className="board-column" style={responsiveBoardStyle}>
                {filteredAndSortedCreatives.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    onVote={() => handleVote(creative)}
                    onDelete={() => handleDelete(creative)}
                    currentUserId={CURRENT_USER_ID}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {loading && <div style={loadingStyle}>加载中...</div>}
      </div>
    </div>
  );
};

export default BoardRoom;
