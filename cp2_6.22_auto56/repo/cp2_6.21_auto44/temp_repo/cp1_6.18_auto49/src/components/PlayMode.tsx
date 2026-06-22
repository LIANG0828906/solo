import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { TimelineNode } from '../types';
import { useTimelineStore } from '../store/timelineStore';

const PLAY_NODE_SPACING = 220;
const PLAY_TOP_PADDING = 200;
const BRANCH_OFFSET_X = 200;
const SCROLL_SPEED = 2;

interface NodePosition {
  node: TimelineNode;
  x: number;
  y: number;
}

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    let processed = line;

    if (processed.startsWith('### ')) {
      elements.push(<h3 key={idx}>{processed.slice(4)}</h3>);
      return;
    }
    if (processed.startsWith('## ')) {
      elements.push(<h2 key={idx}>{processed.slice(3)}</h2>);
      return;
    }
    if (processed.startsWith('# ')) {
      elements.push(<h1 key={idx}>{processed.slice(2)}</h1>);
      return;
    }

    processed = processed.replace(
      /\*\*(.+?)\*\*/g,
      '<strong>$1</strong>'
    );
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');

    if (processed.trim() === '') {
      elements.push(<br key={idx} />);
    } else {
      elements.push(
        <p key={idx} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    }
  });

  return elements;
};

export const PlayMode: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const localProgressRef = useRef<number>(0);

  const store = useTimelineStore();
  const { nodes, branches, togglePlay, activeBranchId, setActiveBranch, currentProgress } = store;

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    localProgressRef.current = currentProgress;
  }, [currentProgress]);

  const mainNodes = useMemo(
    () => nodes.filter((n) => !n.isBranch).sort((a, b) => a.order - b.order),
    [nodes]
  );

  const getNodePositions = useCallback(
    (canvasWidth: number): NodePosition[] => {
      const centerX = canvasWidth / 2;
      const positions: NodePosition[] = [];

      mainNodes.forEach((node, index) => {
        positions.push({
          node,
          x: centerX,
          y: PLAY_TOP_PADDING + index * PLAY_NODE_SPACING,
        });

        const branch = branches.find((b) => b.parentId === node.id);
        if (branch) {
          branch.nodeIds.forEach((branchNodeId, branchIdx) => {
            const branchNode = nodes.find((n) => n.id === branchNodeId);
            if (branchNode) {
              positions.push({
                node: branchNode,
                x: centerX + BRANCH_OFFSET_X,
                y:
                  PLAY_TOP_PADDING +
                  (index + 0.5) * PLAY_NODE_SPACING +
                  branchIdx * PLAY_NODE_SPACING * 0.7,
              });
            }
          });
        }
      });

      return positions;
    },
    [mainNodes, branches, nodes]
  );

  const getTotalHeight = useCallback(() => {
    let maxY = PLAY_TOP_PADDING;
    mainNodes.forEach((node, index) => {
      const branch = branches.find((b) => b.parentId === node.id);
      if (branch) {
        maxY = Math.max(
          maxY,
          PLAY_TOP_PADDING +
            (index + 0.5) * PLAY_NODE_SPACING +
            (branch.nodeIds.length - 1) * PLAY_NODE_SPACING * 0.7
        );
      }
      maxY = Math.max(maxY, PLAY_TOP_PADDING + index * PLAY_NODE_SPACING);
    });
    return maxY + 400;
  }, [mainNodes, branches]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = getTotalHeight();

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const positions = getNodePositions(width);
    const time = timeRef.current;

    if (mainNodes.length > 0) {
      const firstMain = positions.find((p) => p.node.id === mainNodes[0].id);
      const lastMain = positions.find(
        (p) => p.node.id === mainNodes[mainNodes.length - 1].id
      );
      if (firstMain && lastMain) {
        ctx.beginPath();
        ctx.moveTo(centerX, firstMain.y);
        ctx.lineTo(centerX, lastMain.y);
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    branches.forEach((branch) => {
      const parentPos = positions.find((p) => p.node.id === branch.parentId);
      const mergePos = positions.find((p) => p.node.id === branch.mergeTargetId);
      if (!parentPos) return;

      const branchNodes = branch.nodeIds
        .map((id) => positions.find((p) => p.node.id === id))
        .filter(Boolean) as NodePosition[];

      if (branchNodes.length === 0) return;

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(parentPos.x, parentPos.y);
      ctx.lineTo(parentPos.x + BRANCH_OFFSET_X, parentPos.y);
      ctx.lineTo(parentPos.x + BRANCH_OFFSET_X, branchNodes[0].y);
      ctx.stroke();

      for (let i = 0; i < branchNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(branchNodes[i].x, branchNodes[i].y);
        ctx.lineTo(branchNodes[i + 1].x, branchNodes[i + 1].y);
        ctx.stroke();
      }

      if (mergePos) {
        const lastBranch = branchNodes[branchNodes.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastBranch.x, lastBranch.y);
        ctx.lineTo(mergePos.x, lastBranch.y);
        ctx.lineTo(mergePos.x, mergePos.y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    });

    positions.forEach(({ node, x, y }) => {
      const isActive = currentNodeId === node.id;
      const baseColor = node.edited ? '#6BCB77' : '#FF6B6B';

      if (isActive) {
        const pulse = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
        const glowRadius = 28 + pulse * 8;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, 'rgba(78, 205, 196, 0.6)');
        gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = node.isBranch ? '#FF6B6B' : baseColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = node.isBranch ? '#FF6B6B' : baseColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    });
  }, [mainNodes, branches, currentNodeId, getNodePositions, getTotalHeight]);

  useEffect(() => {
    let lastNodeUpdateTime = 0;

    const animate = () => {
      timeRef.current += 1 / 60;

      const totalHeight = getTotalHeight() - window.innerHeight + 100;
      if (totalHeight > 0 && !isDraggingRef.current) {
        localProgressRef.current += SCROLL_SPEED / totalHeight;
        localProgressRef.current = Math.min(localProgressRef.current, 1);
      }

      draw();

      const scrollY = localProgressRef.current * Math.max(totalHeight, 0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.transform = `translateY(${-scrollY}px)`;
      }

      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${localProgressRef.current * 100}%`;
      }

      if (timeRef.current - lastNodeUpdateTime > 0.1) {
        lastNodeUpdateTime = timeRef.current;
        const scrollPosition = localProgressRef.current * (getTotalHeight() - window.innerHeight + 100);
        const viewportCenter = scrollPosition + window.innerHeight / 2;
        const width = window.innerWidth;
        const positions = getNodePositions(width);

        let closestNode: TimelineNode | null = null;
        let closestDist = Infinity;

        for (let i = 0; i < positions.length; i++) {
          const { node, y } = positions[i];
          if (activeBranchId && node.isBranch) {
            const branch = branches.find((b) => b.parentId === activeBranchId);
            if (!branch?.nodeIds.includes(node.id)) continue;
          }
          if (!activeBranchId && node.isBranch) continue;

          const dist = Math.abs(y - viewportCenter);
          if (dist < closestDist && dist < PLAY_NODE_SPACING) {
            closestDist = dist;
            closestNode = node;
          }
        }

        const foundNode = closestNode;
        if (foundNode && foundNode.id !== currentNodeId) {
          setCurrentNodeId(foundNode.id);
        } else if (!foundNode && currentNodeId) {
          setCurrentNodeId(null);
        }

        forceUpdate((n) => n + 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, getTotalHeight, getNodePositions, currentNodeId, activeBranchId, branches]);

  const updateProgressFromUI = useCallback(
    (progress: number) => {
      localProgressRef.current = Math.max(0, Math.min(1, progress));
      store.setProgress(localProgressRef.current);
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${localProgressRef.current * 100}%`;
      }
    },
    [store]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const progress = (e.clientX - rect.left) / rect.width;
      updateProgressFromUI(progress);
    },
    [updateProgressFromUI]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      handleProgressClick(e);
    },
    [handleProgressClick]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      updateProgressFromUI(progress);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateProgressFromUI]);

  const currentNode = nodes.find((n) => n.id === currentNodeId);
  const currentBranch = currentNode
    ? branches.find((b) => b.parentId === currentNode.id)
    : null;

  const handleBranchSelect = (branchNodeId: string) => {
    const branchNode = nodes.find((n) => n.id === branchNodeId);
    if (branchNode?.parentId) {
      setActiveBranch(branchNode.parentId);
      setCurrentNodeId(branchNodeId);

      const width = window.innerWidth;
      const positions = getNodePositions(width);
      const pos = positions.find((p) => p.node.id === branchNodeId);
      if (pos) {
        const totalHeight = getTotalHeight() - window.innerHeight + 100;
        const targetProgress = Math.max(
          0,
          (pos.y - window.innerHeight / 2) / totalHeight
        );
        updateProgressFromUI(Math.min(1, targetProgress));
      }
    }
  };

  const handleBackToMain = () => {
    setActiveBranch(null);
    if (currentNode?.parentId) {
      setCurrentNodeId(currentNode.parentId);
    }
  };

  return (
    <div className="play-mode-overlay">
      <button className="play-exit-button" onClick={togglePlay}>
        ✕ 退出播放
      </button>

      {activeBranchId && (
        <button className="play-back-button" onClick={handleBackToMain}>
          ← 返回主线
        </button>
      )}

      <div className="play-mode-content">
        <div
          ref={scrollContainerRef}
          className={`play-scroll-container ${activeBranchId ? 'branch-active' : ''}`}
          style={{ width: '100%' }}
        >
          <canvas
            ref={canvasRef}
            className="play-timeline-canvas"
          />
        </div>
      </div>

      {currentNode && !currentBranch && (
        <div className={`play-content-panel ${currentNodeId ? 'visible' : ''}`}>
          <div className="play-content-title">
            {currentNode.title || '未命名节点'}
          </div>
          <div className="play-content-date">{currentNode.date}</div>
          <div className="play-content-body">
            {renderMarkdown(currentNode.content || '暂无内容')}
          </div>
          {currentNode.imageUrl && (
            <img
              src={currentNode.imageUrl}
              alt=""
              className="play-content-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {currentBranch && (
        <div className="play-branch-options">
          {currentBranch.nodeIds.map((nodeId) => {
            const branchNode = nodes.find((n) => n.id === nodeId);
            if (!branchNode) return null;
            return (
              <div
                key={nodeId}
                className="play-branch-option"
                onClick={() => handleBranchSelect(nodeId)}
              >
                <div className="play-branch-option-title">
                  {branchNode.title || '未命名分支'}
                </div>
                <div className="play-branch-option-preview">
                  {branchNode.content
                    ? branchNode.content.replace(/[#*_`]/g, '').slice(0, 60) + '...'
                    : '点击查看此分支的故事'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={progressBarRef}
        className="progress-bar-container"
        onMouseDown={handleProgressMouseDown}
      >
        <div
          ref={progressFillRef}
          className="progress-bar-fill"
          style={{ width: `${localProgressRef.current * 100}%` }}
        />
      </div>
    </div>
  );
};
