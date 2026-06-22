import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { VoteOption } from '../types';
import { voteApi } from '../api/voteApi';
import { useWebSocket } from '../hooks/useWebSocket';

const ITEM_HEIGHT = 72;
const ITEM_GAP = 12;
const ITEM_STEP = ITEM_HEIGHT + ITEM_GAP;
const PLACEHOLDER_HEIGHT = ITEM_HEIGHT;

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  placeholderIndex: number | null;
  startY: number;
  currentY: number;
  listStartY: number;
  startScrollY: number;
  draggedOptionId: string | null;
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
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [dragTick, setDragTick] = useState(0);

  const { vote: wsVote } = useWebSocket(id);

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    draggedIndex: null,
    placeholderIndex: null,
    startY: 0,
    currentY: 0,
    listStartY: 0,
    startScrollY: 0,
    draggedOptionId: null,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const getOptionVisualIndex = useCallback(
    (arrayIndex: number, ds: DragState): number => {
      if (!ds.isDragging || ds.draggedIndex === null || ds.placeholderIndex === null) {
        return arrayIndex;
      }
      if (arrayIndex === ds.draggedIndex) {
        return ds.placeholderIndex;
      }
      const dragged = ds.draggedIndex;
      const placeholder = ds.placeholderIndex;
      if (dragged < placeholder) {
        if (arrayIndex > dragged && arrayIndex <= placeholder) {
          return arrayIndex - 1;
        }
      } else if (dragged > placeholder) {
        if (arrayIndex >= placeholder && arrayIndex < dragged) {
          return arrayIndex + 1;
        }
      }
      return arrayIndex;
    },
    []
  );

  const updatePlaceholderFromY = useCallback(
    (clientY: number) => {
      const ds = dragStateRef.current;
      if (!ds.isDragging || ds.draggedIndex === null) return;

      const listEl = listRef.current;
      if (!listEl) return;
      const listRect = listEl.getBoundingClientRect();
      const scrollOffset = window.scrollY - ds.startScrollY;
      const relativeY = clientY - ds.listStartY + scrollOffset;
      const centerY = relativeY + (ITEM_HEIGHT / 2);

      let newPlaceholder = Math.floor(centerY / ITEM_STEP);
      newPlaceholder = Math.max(0, Math.min(options.length - 1, newPlaceholder));

      if (newPlaceholder !== ds.placeholderIndex) {
        ds.placeholderIndex = newPlaceholder;
        setDragTick((t) => t + 1);
      }
    },
    [options.length]
  );

  const handleDragStart = useCallback(
    (index: number, clientY: number) => {
      if (isClosed || hasVoted) return;
      const listEl = listRef.current;
      if (!listEl) return;
      const listRect = listEl.getBoundingClientRect();

      dragStateRef.current = {
        isDragging: true,
        draggedIndex: index,
        placeholderIndex: index,
        startY: clientY,
        currentY: clientY,
        listStartY: listRect.top,
        startScrollY: window.scrollY,
        draggedOptionId: options[index]?.id || null,
      };
      setDragTick((t) => t + 1);
    },
    [isClosed, hasVoted, options]
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      const ds = dragStateRef.current;
      if (!ds.isDragging) return;
      ds.currentY = clientY;
      updatePlaceholderFromY(clientY);
      setDragTick((t) => t + 1);
    },
    [updatePlaceholderFromY]
  );

  const handleDragEnd = useCallback(() => {
    const ds = dragStateRef.current;
    if (!ds.isDragging || ds.draggedIndex === null || ds.placeholderIndex === null) {
      dragStateRef.current = {
        isDragging: false,
        draggedIndex: null,
        placeholderIndex: null,
        startY: 0,
        currentY: 0,
        listStartY: 0,
        startScrollY: 0,
        draggedOptionId: null,
      };
      return;
    }

    const from = ds.draggedIndex;
    const to = ds.placeholderIndex;
    const finalPlaceholder = to;

    dragStateRef.current = {
      isDragging: false,
      draggedIndex: null,
      placeholderIndex: null,
      startY: 0,
      currentY: 0,
      listStartY: 0,
      startScrollY: 0,
      draggedOptionId: null,
    };

    if (from !== to) {
      setOptions((prev) => {
        const newOptions = [...prev];
        const [removed] = newOptions.splice(from, 1);
        newOptions.splice(to, 0, removed);
        return newOptions;
      });
    }

    setHighlightedIndex(finalPlaceholder);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedIndex(null);
    }, 600);

    setDragTick((t) => t + 1);
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

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="page-title">加载中...</div>;
  }

  const ds = dragStateRef.current;

  const getDraggedTransform = (): string => {
    if (!ds.isDragging || ds.draggedIndex === null) return 'none';
    const scrollOffset = window.scrollY - ds.startScrollY;
    const deltaY = ds.currentY - ds.startY + scrollOffset;
    return `translateY(${deltaY}px) scale(1.04)`;
  };

  const renderItem = (option: VoteOption, arrayIndex: number) => {
    const visualIndex = getOptionVisualIndex(arrayIndex, ds);
    const isDraggedItem = ds.isDragging && ds.draggedIndex === arrayIndex;
    const isHighlighted = highlightedIndex === arrayIndex && !ds.isDragging;
    const rank = visualIndex + 1;

    let transform = `translateY(${visualIndex * ITEM_STEP}px)`;
    let opacity = 1;
    let zIndex = 1;
    let boxShadow = '0 2px 8px rgba(26, 35, 126, 0.08)';
    let borderColor = '#e0e0e0';
    let background = 'white';

    if (isDraggedItem) {
      transform = getDraggedTransform();
      opacity = 0.55;
      zIndex = 100;
      boxShadow = '0 20px 50px rgba(26, 35, 126, 0.28), 0 8px 20px rgba(255, 111, 0, 0.15)';
      borderColor = '#ff6f00';
    }

    if (isHighlighted) {
      background = 'linear-gradient(135deg, rgba(255, 111, 0, 0.12), rgba(255, 111, 0, 0.04))';
      borderColor = '#ff6f00';
      boxShadow = '0 0 0 3px rgba(255, 111, 0, 0.2), 0 4px 12px rgba(26, 35, 126, 0.1)';
    }

    return (
      <div
        key={option.id}
        onMouseDown={handleMouseDown(arrayIndex)}
        onTouchStart={handleTouchStart(arrayIndex)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: `${ITEM_HEIGHT}px`,
          padding: '16px 20px',
          background,
          border: `2px solid ${borderColor}`,
          borderRadius: '12px',
          cursor: isClosed || hasVoted ? 'default' : isDraggedItem ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          transition: isDraggedItem
            ? 'box-shadow 0.15s ease, border-color 0.15s ease'
            : 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background-color 0.25s ease, border-color 0.25s ease',
          transform,
          zIndex,
          boxShadow,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isHighlighted
              ? '#ff6f00'
              : rank <= 3
              ? 'var(--accent-color)'
              : 'var(--primary-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            flexShrink: 0,
            transition: 'all 0.25s ease',
            transform: isHighlighted ? 'scale(1.15)' : 'scale(1)',
            boxShadow: isHighlighted ? '0 2px 8px rgba(255, 111, 0, 0.4)' : 'none',
          }}
        >
          {rank}
        </div>
        <div
          style={{
            flex: 1,
            fontSize: '16px',
            fontWeight: isDraggedItem || isHighlighted ? 600 : 500,
            color: isDraggedItem ? '#ff6f00' : 'var(--text-primary)',
            transition: 'all 0.2s ease',
          }}
        >
          {option.text}
        </div>
        {!isClosed && !hasVoted && (
          <div
            style={{
              color: isDraggedItem ? '#ff6f00' : '#bbb',
              fontSize: '22px',
              letterSpacing: '-2px',
              fontWeight: 300,
              transition: 'color 0.2s ease',
              lineHeight: 1,
            }}
          >
            ⋮⋮
          </div>
        )}
      </div>
    );
  };

  const renderPlaceholder = () => {
    if (!ds.isDragging || ds.placeholderIndex === null) return null;
    const top = ds.placeholderIndex * ITEM_STEP;
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${top}px`,
          height: `${PLACEHOLDER_HEIGHT}px`,
          border: '2.5px dashed #ff6f00',
          borderRadius: '12px',
          background:
            'repeating-linear-gradient(45deg, rgba(255, 111, 0, 0.04), rgba(255, 111, 0, 0.04) 8px, rgba(255, 111, 0, 0.09) 8px, rgba(255, 111, 0, 0.09) 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff6f00',
          fontSize: '13px',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: 'placeholderPulse 1.6s ease-in-out infinite',
        }}
      >
        释放到此处 · 第 {ds.placeholderIndex + 1} 名
      </div>
    );
  };

  const listHeight = options.length * ITEM_STEP - ITEM_GAP;
  const cursorHint =
    ds.isDragging && ds.placeholderIndex !== null && ds.draggedIndex !== ds.placeholderIndex
      ? `↑ 释放后移动到第 ${ds.placeholderIndex + 1} 名`
      : ds.isDragging
      ? '↕ 上下拖动调整顺序'
      : !isClosed && !hasVoted
      ? '💡 按住卡片上下拖拽调整偏好顺序'
      : '';

  return (
    <div>
      <style>{`
        @keyframes placeholderPulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        @keyframes highlightGlow {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.12); }
          100% { filter: brightness(1); }
        }
      `}</style>
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
          style={{
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            fontSize: '13px',
            color: cursorHint ? '#ff6f00' : 'transparent',
            fontWeight: 600,
            transition: 'all 0.25s ease',
            transform: ds.isDragging ? 'translateY(0)' : 'translateY(-4px)',
            opacity: cursorHint ? 1 : 0,
          }}
        >
          {cursorHint || '提示'}
        </div>

        <div
          ref={listRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            height: `${listHeight}px`,
            paddingTop: '4px',
          }}
        >
          {renderPlaceholder()}
          {options.map((opt, i) => renderItem(opt, i))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isClosed || hasVoted || submitting}
            style={{ flex: '1 1 180px' }}
          >
            {submitting ? '提交中...' : hasVoted ? '已投票' : '提交排序'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/vote/${id}/results`)}
            style={{ flex: '1 1 140px' }}
          >
            查看结果
          </button>
          {!isClosed && (
            <button
              className="btn btn-danger"
              onClick={handleCloseVote}
              style={{ flex: '1 1 140px' }}
            >
              提前截止
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
