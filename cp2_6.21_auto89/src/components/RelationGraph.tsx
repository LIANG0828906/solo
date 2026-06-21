import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Circle, Line, Text, Group, Arrow, Rect } from 'react-konva';
import Konva from 'konva';
import { GraphNode, GraphEdge } from '../utils/dataTransform';
import { MemberData, RelationData, EventData } from '../services/api';

interface RelationGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  onNodeDragEnd: (memberId: string, x: number, y: number) => void;
  onCreateRelation: (fromId: string, toId: string) => void;
  onUpdateRelationControl: (relationId: string, cx: number, cy: number) => void;
  onContextMenuRelation: (relationId: string, x: number, y: number) => void;
  width: number;
  height: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: { name: string; years: string; role?: string | null };
}

const RelationGraph: React.FC<RelationGraphProps> = ({
  nodes,
  edges,
  selectedMemberId,
  onSelectMember,
  onNodeDragEnd,
  onCreateRelation,
  onUpdateRelationControl,
  onContextMenuRelation,
  width,
  height,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: { name: '', years: '' } });
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = new Set(nodes.map((n) => n.id));
    setAnimatingNodes(ids);
    const timer = setTimeout(() => setAnimatingNodes(new Set()), 500);
    return () => clearTimeout(timer);
  }, [nodes.length]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.3, Math.min(newScale, 3));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageScale, stagePos]);

  const handleStageMouseMove = useCallback(() => {
    if (isDraggingNew) {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (pos) {
        const transformed = {
          x: (pos.x - stagePos.x) / stageScale,
          y: (pos.y - stagePos.y) / stageScale,
        };
        setDragPos(transformed);
      }
    }
  }, [isDraggingNew, stageScale, stagePos]);

  const handleStageMouseUp = useCallback(() => {
    if (isDraggingNew && dragStart && dragPos) {
      const hitNode = nodes.find((n) => {
        if (n.id === dragStart.nodeId) return false;
        const dx = n.x - dragPos.x;
        const dy = n.y - dragPos.y;
        return Math.sqrt(dx * dx + dy * dy) < n.radius + 10;
      });
      if (hitNode) {
        onCreateRelation(dragStart.nodeId, hitNode.id);
      }
    }
    setIsDraggingNew(false);
    setDragStart(null);
    setDragPos(null);
  }, [isDraggingNew, dragStart, dragPos, nodes, onCreateRelation]);

  const getEdgeStyle = (type: string) => {
    switch (type) {
      case '父子':
      case '父女':
      case '母子':
      case '母女':
        return { stroke: '#95A5A6', strokeWidth: 3, dash: null as number[] | null };
      case '夫妻':
        return { stroke: '#E74C3C', strokeWidth: 2.5, dash: null as number[] | null };
      case '兄弟姐妹':
        return { stroke: '#1ABC9C', strokeWidth: 2, dash: [8, 4] as number[] };
      default:
        return { stroke: '#7F8C8D', strokeWidth: 2, dash: null as number[] | null };
    }
  };

  const renderEdge = (edge: GraphEdge) => {
    if (edge.points.length < 3) return null;
    const style = getEdgeStyle(edge.type);
    const isCouple = edge.type === '夫妻';
    const isParent = edge.type === '父子' || edge.type === '父女' || edge.type === '母子' || edge.type === '母女';
    const fromNode = nodes.find((n) => n.id === edge.fromId);
    const toNode = nodes.find((n) => n.id === edge.toId);
    if (!fromNode || !toNode) return null;

    const [p1, pc, p2] = edge.points;

    return (
      <Group key={edge.id}>
        <Line
          points={[p1.x, p1.y, pc.x, pc.y, p2.x, p2.y]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash || undefined}
          tension={0.5}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            const absPos = stageRef.current?.getPointerPosition();
            if (absPos) {
              onContextMenuRelation(edge.id, absPos.x, absPos.y);
            }
          }}
        />
        {isCouple && (
          <Group x={pc.x} y={pc.y}>
            <Circle radius={8} fill="#E74C3C" />
            <Text
              text="❤"
              fontSize={12}
              fill="#fff"
              x={-6}
              y={-7}
            />
          </Group>
        )}
        {isParent && (
          <Arrow
            points={[pc.x, pc.y, p2.x, p2.y]}
            stroke={style.stroke}
            strokeWidth={2}
            pointerLength={8}
            pointerWidth={8}
            fill={style.stroke}
          />
        )}
        <Circle
          x={pc.x}
          y={pc.y}
          radius={6}
          fill="#3498DB"
          opacity={0.8}
          draggable
          onDragEnd={(e) => {
            onUpdateRelationControl(edge.id, e.target.x(), e.target.y());
          }}
        />
      </Group>
    );
  };

  const renderNode = (node: GraphNode) => {
    const isSelected = node.id === selectedMemberId;
    const isHovered = node.id === hoveredNodeId;
    const isAnimating = animatingNodes.has(node.id);

    const displayRadius = node.radius;
    const yearText = node.deathYear
      ? `${node.birthYear} - ${node.deathYear}`
      : `${node.birthYear} - 至今`;

    return (
      <Group
        key={node.id}
        x={node.x}
        y={node.y}
        draggable
        onClick={() => onSelectMember(node.id)}
        onTap={() => onSelectMember(node.id)}
        onMouseEnter={(e) => {
          const stageEl = e.target.getStage();
          if (stageEl) stageEl.container().style.cursor = 'pointer';
          const stage = stageRef.current;
          if (stage) {
            const absPos = stage.getPointerPosition();
            if (absPos) {
              setTooltip({
                visible: true,
                x: absPos.x + 15,
                y: absPos.y - 10,
                content: { name: node.fullName, years: yearText, role: node.role },
              });
            }
          }
          setHoveredNodeId(node.id);
        }}
        onMouseLeave={(e) => {
          const stageEl = e.target.getStage();
          if (stageEl) stageEl.container().style.cursor = 'default';
          setTooltip({ ...tooltip, visible: false });
          setHoveredNodeId(null);
        }}
        onDragStart={() => {
          const dist = Math.sqrt(2);
        }}
        onDragEnd={(e) => {
          onNodeDragEnd(node.id, e.target.x(), e.target.y());
        }}
      >
        <Circle
          radius={displayRadius + (isSelected ? 4 : isHovered ? 2 : 0)}
          fill="transparent"
          stroke={isSelected ? '#1ABC9C' : isHovered ? '#3498DB' : 'transparent'}
          strokeWidth={isSelected || isHovered ? 3 : 0}
          opacity={isAnimating ? 0 : 1}
        />
        <Circle
          radius={displayRadius}
          fill={node.color}
          stroke="#2C3E50"
          strokeWidth={2}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={isSelected ? 15 : 5}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.5}
          opacity={isAnimating ? 0 : 1}
        />
        <Text
          text={node.label}
          fontSize={Math.max(12, displayRadius * 0.6)}
          fill="#fff"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          x={-displayRadius}
          y={-displayRadius * 0.4}
          width={displayRadius * 2}
          opacity={isAnimating ? 0 : 1}
        />
        <Text
          text={node.role || ''}
          fontSize={10}
          fill="#ECF0F1"
          align="center"
          x={-displayRadius}
          y={displayRadius + 4}
          width={displayRadius * 2}
          opacity={isAnimating ? 0 : 1}
        />
        {isSelected && (
          <Circle
            radius={displayRadius + 8}
            stroke="#F1C40F"
            strokeWidth={2}
            dash={[4, 4]}
            opacity={0.8}
          />
        )}
      </Group>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onContentClick={() => onSelectMember(null)}
        draggable={!isDraggingNew}
        onDragEnd={(e) => {
          if (!isDraggingNew) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)' }}
      >
        <Layer>
          {edges.map(renderEdge)}
          {isDraggingNew && dragStart && dragPos && (
            <Line
              points={[dragStart.x, dragStart.y, dragPos.x, dragPos.y]}
              stroke="#3498DB"
              strokeWidth={2}
              dash={[6, 4]}
              opacity={0.8}
            />
          )}
          {nodes.map(renderNode)}
        </Layer>
      </Stage>
      {tooltip.visible && (
        <div
          className="tooltip-container"
          style={{ left: tooltip.x, top: tooltip.y, pointerEvents: 'none' }}
        >
          <div className="tooltip-name">{tooltip.content.name}</div>
          <div className="tooltip-detail">{tooltip.content.years}</div>
          {tooltip.content.role && <div className="tooltip-detail">{tooltip.content.role}</div>}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 11, color: '#95A5A6' }}>
        拖拽节点移动 | 滚轮缩放 | 空白处拖动平移 | 按住节点拖出创建连线
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 5,
          height: '100%',
          background: '#3498DB',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default RelationGraph;
