import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { VoteOption } from '../types';
import { voteApi } from '../api/voteApi';
import { useWebSocket } from '../hooks/useWebSocket';

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  overIndex: number | null;
  startY: number;
  currentY: number;
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const voterId = searchParams.get('voterId') || '';

  const [options, setOptions] = useState<VoteOption[]>([]);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { vote: wsVote } = useWebSocket(id);

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    draggedIndex: null,
    overIndex: null,
    startY: 0,
    currentY: 0,
  });
  const [, forceRender] = useState(0);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const loadVote = async () => {
      try {
        const vote = await voteApi.getVote(id);
        setTitle(vote.title);
        setDeadline(vote.deadline);
        setIsClosed(vote.isClosed);
        setOptions(vote.options);
        if (vote.rankings.some((r) => r.voterId === voterId)) {
          setHasVoted(true);
          const votedRanking = vote.rankings.find((r) => r.voterId === voterId);
          if (votedRanking) {
            const sortedOptions = votedRanking.order
              .map((oid) => vote.options.find((o) => o.id === oid))
              .filter((o): o is VoteOption => !!o);
            if (sortedOptions.length === vote.options.length) {
              setOptions(sortedOptions);
            }
          }
        }
      } catch (error) {
        console.error('加载投票失败:', error);
        alert('加载投票失败');
      } finally {
        setLoading(false);
      }
    };
    loadVote();
  }, [id, voterId]);

  useEffect(() => {
    if (wsVote) {
      setIsClosed(wsVote.isClosed);
      setDeadline(wsVote.deadline);
    }
  }, [wsVote]);

  useEffect(() => {
    if (deadline && !isClosed) {
      const interval = setInterval(() => {
        if (Date.now() >= deadline) {
          setIsClosed(true);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [deadline, isClosed]);

  const getItemOffset = useCallback((index: number): number => {
    const el = itemRefs.current.get(index);
    if (!el || !listRef.current) return 0;
    const listRect = listRef.current.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    return itemRect.top - listRect.top;
  }, []);

  const handleDragStart = useCallback(
    (index: number, clientY: number) => {
      if (isClosed || hasVoted) return;
      dragStateRef.current = {
        isDragging: true,
        draggedIndex: index,
        overIndex: index,
        startY: clientY,
        currentY: clientY,
      };
      forceRender((n) => n + 1);
    },
    [isClosed, hasVoted]
  );

  const handleDragMove = useCallback((clientY: number) => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.draggedIndex === null) return;

    state.currentY = clientY;
    const draggedOffset = getItemOffset(state.draggedIndex);
    const draggedHeight = itemRefs.current.get(state.draggedIndex)?.offsetHeight || 0;
    const draggedCenter = draggedOffset + draggedHeight / 2 + (clientY - state.startY);

    let newOverIndex = state.draggedIndex;
    for (let i = 0; i < options.length; i++) {
      if (i === state.draggedIndex) continue;
      const itemOffset = getItemOffset(i);
      const itemHeight = itemRefs.current.get(i)?.offsetHeight || 0;
      const itemCenter = itemOffset + itemHeight / 2;
      if (draggedCenter >= itemOffset && draggedCenter <= itemOffset + itemHeight) {
        newOverIndex = draggedCenter < itemCenter ? i : i;
        break;
      }
    }

    const currentItemOffset = getItemOffset(newOverIndex);
    const currentItemHeight = itemRefs.current.get(newOverIndex)?.offsetHeight || 0;
    if (draggedCenter < currentItemOffset + currentItemHeight / 2) {
      newOverIndex = newOverIndex > state.draggedIndex ? newOverIndex - 1 : newOverIndex;
    } else {
      newOverIndex = newOverIndex < state.draggedIndex ? newOverIndex + 1 : newOverIndex;
    }
    newOverIndex = Math.max(0, Math.min(options.length - 1, newOverIndex));

    if (newOverIndex !== state.overIndex) {
      state.overIndex = newOverIndex;
      setOptions((prev) => {
        const newOptions = [...prev];
        const [removed] = newOptions.splice(state.draggedIndex!, 1);
        newOptions.splice(newOverIndex, 0, removed);
        return newOptions;
      });
      state.draggedIndex = newOverIndex;
      state.startY = clientY;
    }
    forceRender((n) => n + 1);
  }, [options, getItemOffset]);

  const handleDragEnd = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      draggedIndex: null,
      overIndex: null,
      startY: 0,
      currentY: 0,
    };
    forceRender((n) => n + 1);
  }, []);

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(index, e.clientY);
    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (index: number) => (e: React.TouchEvent) => {
    handleDragStart(index, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleSubmit = async () => {
    if (!id || isClosed || hasVoted) return;
    setSubmitting(true);
    try {
      await voteApi.submitRanking(id, {
        voterId,
        order: options.map((o) => o.id),
      });
      setHasVoted(true);
      alert('投票成功！');
      navigate(`/vote/${id}/results`);
    } catch (error) {
      console.error('提交投票失败:', error);
      alert('提交投票失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseVote = async () => {
    if (!id) return;
    if (!confirm('确定要提前截止投票吗？')) return;
    try {
      await voteApi.closeVote(id);
      setIsClosed(true);
    } catch (error) {
      console.error('截止投票失败:', error);
      alert('截止投票失败');
    }
  };

  const formatDeadline = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN');
  };

  const getDeadlineText = () => {
    if (isClosed) return '已截止';
    const remaining = deadline - Date.now();
    if (remaining <= 0) return '已截止';
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分钟`;
    return `剩余 ${minutes} 分钟`;
  };

  if (loading) {
    return <div className="page-title">加载中...</div>;
  }

  const state = dragStateRef.current;

  return (
    <div>
      <h1 className="page-title">
        {title}
        {isClosed && <span className="badge-closed">已截止</span>}
      </h1>
      <div className="card">
        <div className="vote-info">
          <h2>投票说明</h2>
          <p>拖拽选项卡片调整顺序，越靠前表示偏好越强。</p>
          <p>截止时间：{formatDeadline(deadline)} ({getDeadlineText()})</p>
          {hasVoted && <p style={{ color: '#4caf50', fontWeight: 600 }}>您已完成投票</p>}
        </div>

        <div
          ref={listRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ position: 'relative', minHeight: options.length * 72 }}
        >
          {options.map((option, index) => {
            const isDragging = state.isDragging && state.draggedIndex === index;
            const transform = isDragging
              ? `translateY(${state.currentY - state.startY}px) scale(1.02)`
              : 'none';
            const zIndex = isDragging ? 100 : 1;
            const boxShadow = isDragging
              ? '0 16px 40px rgba(26, 35, 126, 0.25)'
              : '0 2px 8px rgba(26, 35, 126, 0.08)';

            return (
              <div
                key={option.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(index, el);
                }}
                onMouseDown={handleMouseDown(index)}
                onTouchStart={handleTouchStart(index)}
                style={{
                  padding: '16px 20px',
                  marginBottom: '12px',
                  background: 'white',
                  border: `2px solid ${isDragging ? '#ff6f00' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  cursor: isClosed || hasVoted ? 'default' : 'grab',
                  userSelect: 'none',
                  transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform,
                  zIndex,
                  boxShadow,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  position: isDragging ? 'absolute' : 'relative',
                  width: '100%',
                  left: 0,
                  top: isDragging ? undefined : undefined,
                  opacity: isClosed || hasVoted ? 0.85 : 1,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: index < 3 ? 'var(--accent-color)' : 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1, fontSize: '16px', fontWeight: 500 }}>
                  {option.text}
                </div>
                {!isClosed && !hasVoted && (
                  <div style={{ color: '#999', fontSize: '20px' }}>⋮⋮</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isClosed || hasVoted || submitting}
            style={{ flex: 1 }}
          >
            {submitting ? '提交中...' : hasVoted ? '已投票' : '提交排序'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/vote/${id}/results`)}
          >
            查看结果
          </button>
          {!isClosed && (
            <button className="btn btn-danger" onClick={handleCloseVote}>
              提前截止
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
