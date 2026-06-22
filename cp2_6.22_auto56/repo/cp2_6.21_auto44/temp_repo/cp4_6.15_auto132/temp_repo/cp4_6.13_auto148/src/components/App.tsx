import React, { useState, useEffect, useCallback, useRef } from 'react';
import IdeaCard from './IdeaCard';
import TrendChart from './TrendChart';
import JoinScreen from './JoinScreen';
import {
  getIdeas, createIdea, voteIdea, addComment, getRanking, getTrend,
  Idea, TrendPoint,
} from '../utils/api';
import { connectWebSocket, sendWebSocketMessage, disconnectWebSocket } from '../utils/websocket';

const COLOR_PALETTE = ['#FF6B35', '#004E89', '#1A936F', '#FFA630', '#D81B60'];
const TAG_OPTIONS = ['功能', '设计', '营销', '流程', '其他'];
const MEDALS = ['🥇', '🥈', '🥉'];

export default function App() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [ranking, setRanking] = useState<{ id: string; title: string; author: string; vote_count: number }[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [votedIdeas, setVotedIdeas] = useState<Set<string>>(new Set());
  const rankingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memberColorsRef = useRef<Map<string, string>>(new Map());

  const loadIdeas = useCallback(async () => {
    try {
      const data = await getIdeas(roomCode);
      setIdeas(data);
    } catch (e) {
      console.error('Failed to load ideas:', e);
    }
  }, [roomCode]);

  const loadRanking = useCallback(async () => {
    try {
      const data = await getRanking(roomCode);
      setRanking(data);
    } catch (e) {
      console.error('Failed to load ranking:', e);
    }
  }, [roomCode]);

  const loadTrend = useCallback(async () => {
    try {
      const data = await getTrend(roomCode);
      setTrendData(data);
    } catch (e) {
      console.error('Failed to load trend:', e);
    }
  }, [roomCode]);

  const handleJoin = (nick: string, room: string) => {
    setNickname(nick);
    setRoomCode(room);
    setJoined(true);
  };

  useEffect(() => {
    if (!joined) return;

    loadIdeas();
    loadRanking();
    loadTrend();

    connectWebSocket(roomCode, nickname, (msg) => {
      if (msg.type === 'members') {
        setMembers(msg.members);
        msg.members.forEach((m: string) => {
          if (!memberColorsRef.current.has(m)) {
            memberColorsRef.current.set(m, COLOR_PALETTE[memberColorsRef.current.size % COLOR_PALETTE.length]);
          }
        });
      }
      if (msg.type === 'new_idea') {
        setIdeas((prev) => [msg.idea, ...prev]);
        loadRanking();
        loadTrend();
      }
      if (msg.type === 'vote_update') {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === msg.idea_id ? { ...idea, vote_count: msg.vote_count } : idea
          )
        );
        loadRanking();
        loadTrend();
      }
      if (msg.type === 'new_comment') {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === msg.idea_id ? { ...idea, comment_count: msg.comment_count } : idea
          )
        );
      }
    });

    rankingTimerRef.current = setInterval(() => {
      loadRanking();
      loadTrend();
    }, 10000);

    return () => {
      disconnectWebSocket();
      if (rankingTimerRef.current) clearInterval(rankingTimerRef.current);
    };
  }, [joined, roomCode, nickname, loadIdeas, loadRanking, loadTrend]);

  const handleCreateIdea = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    try {
      const idea = await createIdea(roomCode, newTitle.trim(), newDesc.trim(), nickname, newTags);
      sendWebSocketMessage({ type: 'new_idea', idea });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewTags([]);
    } catch (e) {
      console.error('Failed to create idea:', e);
    }
  };

  const handleVote = async (ideaId: string) => {
    try {
      const result = await voteIdea(ideaId, nickname, roomCode);
      setVotedIdeas((prev) => new Set(prev).add(ideaId));
      sendWebSocketMessage({ type: 'vote_update', idea_id: result.idea_id, vote_count: result.vote_count });
      loadRanking();
      loadTrend();
    } catch (e: any) {
      if (e.message === 'Already voted') {
        setVotedIdeas((prev) => new Set(prev).add(ideaId));
      }
      throw e;
    }
  };

  const handleComment = async (ideaId: string, content: string) => {
    try {
      const result = await addComment(ideaId, nickname, content);
      sendWebSocketMessage({
        type: 'new_comment',
        idea_id: result.idea_id,
        comment: result.comment,
        comment_count: result.comment_count,
      });
    } catch (e) {
      console.error('Failed to add comment:', e);
    }
  };

  if (!joined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0' }}>
      <header style={{
        background: '#2D7D9A', color: '#fff', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>点子孵化器</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
            borderRadius: 6, fontSize: 14, letterSpacing: 2,
          }}>房间 {roomCode}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {members.map((m) => (
            <div
              key={m}
              title={m}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: memberColorsRef.current.get(m) || '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 600,
              }}
            >
              {m.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 56px)' }}>
        <div style={{ width: '70%', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#2D7D9A', fontSize: 20, fontWeight: 600 }}>
              点子看板 ({ideas.length})
            </h2>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: '#F4A261', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 20px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E0934D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F4A261')}
            >
              + 提交新点子
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 260px)',
            gap: 16,
            justifyContent: 'center',
          }}>
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                nickname={nickname}
                onVote={handleVote}
                onComment={handleComment}
                votedIdeas={votedIdeas}
              />
            ))}
          </div>

          {ideas.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#999', marginTop: 80,
              fontSize: 16,
            }}>
              还没有点子，快来提交第一个吧！💡
            </div>
          )}
        </div>

        <div style={{
          width: '30%', background: '#fff', borderLeft: '1px solid #e8e8e8',
          padding: 20, overflowY: 'auto',
        }}>
          <h3 style={{ color: '#2D7D9A', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            🏆 热度排行 Top 10
          </h3>
          {ranking.length === 0 && (
            <div style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>暂无排行数据</div>
          )}
          {ranking.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid #f0f0f0',
            }}>
              <span style={{
                fontSize: idx < 3 ? 20 : 14, width: 28, textAlign: 'center',
                color: idx < 3 ? undefined : '#999', fontWeight: 600,
              }}>
                {idx < 3 ? MEDALS[idx] : idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#333',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>@{item.author}</div>
              </div>
              <span style={{
                background: '#2D7D9A', color: '#fff', fontSize: 12,
                padding: '2px 8px', borderRadius: 10, fontWeight: 600,
              }}>
                ❤️ {item.vote_count}
              </span>
            </div>
          ))}

          <h3 style={{ color: '#2D7D9A', fontSize: 16, fontWeight: 700, marginTop: 28, marginBottom: 16 }}>
            📈 投票趋势
          </h3>
          <div style={{ width: '100%', height: 200 }}>
            <TrendChart data={trendData} />
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: 32, width: 480,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#2D7D9A', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              提交新点子
            </h2>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>
              标题 <span style={{ color: '#999', fontWeight: 400 }}>(最多50字)</span>
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value.slice(0, 50))}
              placeholder="一句话描述你的点子"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '2px solid #e0e0e0', fontSize: 14, marginBottom: 16,
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2D7D9A'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>
              描述 <span style={{ color: '#999', fontWeight: 400 }}>(支持 **加粗** 和 *斜体*)</span>
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="详细描述你的点子..."
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '2px solid #e0e0e0', fontSize: 14, marginBottom: 16,
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2D7D9A'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>
              标签 <span style={{ color: '#999', fontWeight: 400 }}>(最多3个)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {TAG_OPTIONS.map((tag) => {
                const selected = newTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (selected) {
                        setNewTags((prev) => prev.filter((t) => t !== tag));
                      } else if (newTags.length < 3) {
                        setNewTags((prev) => [...prev, tag]);
                      }
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 13,
                      border: `1px solid ${selected ? '#2D7D9A' : '#ddd'}`,
                      background: selected ? '#2D7D9A' : '#fff',
                      color: selected ? '#fff' : '#666',
                      cursor: newTags.length >= 3 && !selected ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{tag}</button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  border: '1px solid #ddd', background: '#fff',
                  color: '#666', fontSize: 14, cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >取消</button>
              <button
                onClick={handleCreateIdea}
                disabled={!newTitle.trim() || !newDesc.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  border: 'none',
                  background: (!newTitle.trim() || !newDesc.trim()) ? '#ccc' : '#F4A261',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (newTitle.trim() && newDesc.trim()) e.currentTarget.style.background = '#E0934D';
                }}
                onMouseLeave={(e) => {
                  if (newTitle.trim() && newDesc.trim()) e.currentTarget.style.background = '#F4A261';
                }}
              >提交点子</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
