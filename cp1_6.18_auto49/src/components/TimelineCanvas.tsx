import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { TimelineNode, Branch } from '../types';
import { useTimelineStore } from '../store/timelineStore';

const NODE_VERTICAL_SPACING = 180;
const NODE_RADIUS = 12;
const BRANCH_OFFSET_X = 120;
const TIMELINE_WIDTH = 4;
const TOP_PADDING = 100;

interface NodePosition {
  node: TimelineNode;
  x: number;
  y: number;
}

export const TimelineCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  const {
    nodes,
    branches,
    selectedNodeId,
    selectNode,
    createBranch,
  } = useTimelineStore();

  const mainNodes = useMemo(
    () => nodes.filter((n) => !n.isBranch).sort((a, b) => a.order - b.order),
    [nodes]
  );

  const getNodePositions = useCallback(
    (canvasWidth: number, _canvasHeight: number): NodePosition[] => {
      const centerX = canvasWidth / 2;
      const positions: NodePosition[] = [];

      mainNodes.forEach((node, index) => {
        positions.push({
          node,
          x: centerX,
          y: TOP_PADDING + index * NODE_VERTICAL_SPACING,
        });

        const branch = branches.find((b) => b.parentId === node.id);
        if (branch) {
          branch.nodeIds.forEach((branchNodeId, branchIdx) => {
            const branchNode = nodes.find((n) => n.id === branchNodeId);
            if (branchNode) {
              positions.push({
                node: branchNode,
                x: centerX + BRANCH_OFFSET_X,
                y: TOP_PADDING + (index + 0.5) * NODE_VERTICAL_SPACING + branchIdx * NODE_VERTICAL_SPACING * 0.6,
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
    let maxY = TOP_PADDING;
    mainNodes.forEach((node, index) => {
      const branch = branches.find((b) => b.parentId === node.id);
      if (branch) {
        maxY = Math.max(
          maxY,
          TOP_PADDING + (index + 0.5) * NODE_VERTICAL_SPACING + (branch.nodeIds.length - 1) * NODE_VERTICAL_SPACING * 0.6
        );
      }
      maxY = Math.max(maxY, TOP_PADDING + index * NODE_VERTICAL_SPACING);
    });
    return maxY + TOP_PADDING;
  }, [mainNodes, branches]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(rect.height, getTotalHeight());

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const positions = getNodePositions(width, height);
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
        ctx.lineWidth = TIMELINE_WIDTH;
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
      const isSelected = selectedNodeId === node.id;
      const baseColor = node.edited ? '#6BCB77' : '#FF6B6B';

      if (isSelected) {
        const pulse = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, NODE_RADIUS + 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78, 205, 196, ${0.2 + pulse * 0.2})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = node.isBranch ? '#FF6B6B' : baseColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, NODE_RADIUS + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [mainNodes, branches, selectedNodeId, getNodePositions, getTotalHeight]);

  useEffect(() => {
    const animate = () => {
      timeRef.current += 1 / 60;
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const positions = getNodePositions(rect.width, rect.height);

      for (const { node, x, y } of positions) {
        const dist = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
        if (dist <= NODE_RADIUS + 8) {
          selectNode(node.id);
          return;
        }
      }

      selectNode(null);
    },
    [getNodePositions, selectNode]
  );

  const renderEventCard = (nodePos: NodePosition, index: number) => {
    const { node, y } = nodePos;
    const isLeft = index % 2 === 0;
    const isBranch = node.isBranch;
    const isSelected = selectedNodeId === node.id;

    const style: React.CSSProperties = {
      top: y - 60,
    };

    return (
      <div
        key={node.id}
        className={`event-card ${isBranch ? 'branch' : isLeft ? 'left' : 'right'} ${isSelected ? 'selected' : ''}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          selectNode(node.id);
        }}
      >
        <div className="event-card-title">
          {node.title || '未命名节点'}
        </div>
        <div className="event-card-date">{node.date}</div>
        {node.imageUrl && (
          <img
            src={node.imageUrl}
            alt=""
            className="event-card-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        {node.content && (
          <div className="event-card-preview">
            {node.content.replace(/[#*_`]/g, '').slice(0, 80)}
            {node.content.length > 80 ? '...' : ''}
          </div>
        )}
      </div>
    );
  };

  const renderBranchHint = (branch: Branch, parentPos: NodePosition) => {
    const hasBranchNodes = branch.nodeIds.length > 0;
    if (hasBranchNodes) return null;

    return (
      <div
        key={`hint-${branch.parentId}`}
        className="branch-create-hint"
        style={{
          left: `calc(50% + ${BRANCH_OFFSET_X - 40}px)`,
          top: parentPos.y - 12,
        }}
        onClick={(e) => {
          e.stopPropagation();
          createBranch(branch.parentId);
        }}
      >
        点击添加分支
      </div>
    );
  };

  return (
    <div className="timeline-wrapper">
      <div className="timeline-canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="timeline-canvas"
          onClick={handleCanvasClick}
        />

        {(() => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return null;
          const positions = getNodePositions(rect.width, rect.height);
          const mainPositions = positions.filter((p) => !p.node.isBranch);
          const allPositions = positions;

          return (
            <>
              {mainPositions.map((pos, idx) => renderEventCard(pos, idx))}
              {positions
                .filter((p) => p.node.isBranch)
                .map((pos) => renderEventCard(pos, 0))}
              {branches.map((branch) => {
                const parentPos = allPositions.find(
                  (p) => p.node.id === branch.parentId
                );
                if (!parentPos) return null;
                return renderBranchHint(branch, parentPos);
              })}
            </>
          );
        })()}

        {mainNodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">暂无节点</div>
            <div className="empty-state-hint">
              点击左侧「添加节点」开始创建你的故事
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
