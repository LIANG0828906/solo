import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arrow } from 'react-konva';
import Konva from 'konva';
import { Node, Edge, HistoryStateManager, LayoutNodePosition } from './model';
import { walkerLayout } from './layout';

interface MindMapCanvasProps {
  model: HistoryStateManager;
  onStateChange: () => void;
}

const EDGE_COLORS = ['#ff6b6b', '#4fc3f7', '#81c784', '#ba68c8', '#ffb74d', '#4db6ac'];

const getEdgeColor = (level: number): string => {
  return EDGE_COLORS[Math.min(level, EDGE_COLORS.length - 1)];
};

const parseMarkdownText = (text: string): { segments: Array<{ text: string; bold: boolean; italic: boolean }>; lines: number } => {
  const lines = text.split('\n').slice(0, 3);
  const segments: Array<{ text: string; bold: boolean; italic: boolean }> = [];
  lines.forEach((line, idx) => {
    if (idx > 0) segments.push({ text: '\n', bold: false, italic: false });
    let remaining = line;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/^\*(.+?)\*(?!\*)/);
      if (boldMatch) {
        segments.push({ text: boldMatch[1], bold: true, italic: false });
        remaining = remaining.slice(boldMatch[0].length);
      } else if (italicMatch) {
        segments.push({ text: italicMatch[1], bold: false, italic: true });
        remaining = remaining.slice(italicMatch[0].length);
      } else {
        const nextBold = remaining.indexOf('**');
        const nextItalic = remaining.indexOf('*');
        const nextSpecials = [nextBold, nextItalic].filter(n => n > 0);
        const endIdx = nextSpecials.length > 0 ? Math.min(...nextSpecials) : remaining.length;
        segments.push({
          text: remaining.slice(0, endIdx),
          bold: false,
          italic: false,
        });
        remaining = remaining.slice(endIdx);
      }
    }
  });
  if (text.split('\n').length > 3) {
    const lastSeg = segments[segments.length - 1];
    if (lastSeg && !lastSeg.text.endsWith('...')) {
      lastSeg.text = lastSeg.text.replace(/.$/, '...');
    }
  }
  return { segments, lines: Math.min(lines.length, 3) };
};

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onStartConnect: (id: string, x: number, y: number) => void;
  onToggleCollapse: (id: string) => void;
  editingId: string | null;
  editText: string;
  onEditTextChange: (text: string) => void;
  onEditTextConfirm: () => void;
  onEditTextCancel: () => void;
  stageRef: React.RefObject<Konva.Stage>;
  containerRef: React.RefObject<HTMLDivElement>;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  scale,
  onSelect,
  onDeselect,
  onDragStart,
  onDragEnd,
  onDragMove,
  onDoubleClick,
  onStartConnect,
  onToggleCollapse,
  editingId,
  editText,
  onEditTextChange,
  onEditTextConfirm,
  onEditTextCancel,
  stageRef,
  containerRef,
}) => {
  const [hovered, setHovered] = useState(false);
  const [connectorHovered, setConnectorHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const { segments } = useMemo(() => parseMarkdownText(node.text), [node.text]);
  const fontSize = node.level === 0 ? 18 : 14;
  const fontWeight = node.level === 0 ? 'bold' : 'normal';

  const borderColor = isSelected ? '#ff7f50' : '#4a5b8a';
  const shadowColor = isSelected ? 'rgba(255, 127, 80, 0.4)' : 'rgba(0, 0, 0, 0.3)';
  const shadowBlur = isSelected ? 12 : 6;

  const scaleAnim = visible ? 1.0 : 0.8;

  const handleTextRender = () => {
    const yStart = node.height / 2 - (Math.min(node.text.split('\n').length, 3) * (fontSize + 4)) / 2;
    let currentY = yStart;
    let lineHeight = fontSize + 4;
    const result: React.ReactNode[] = [];
    let currentLineStart = 0;
    segments.forEach((seg, i) => {
      if (seg.text === '\n') {
        currentY += lineHeight;
        currentLineStart = i + 1;
        return;
      }
    });
    currentY = yStart;
    let xOffset = 0;
    let lineSegments: typeof segments = [];
    segments.forEach((seg, i) => {
      if (seg.text === '\n') {
        let totalWidth = 0;
        lineSegments.forEach(s => {
          totalWidth += s.text.length * (fontSize * 0.55);
        });
        let lineX = -totalWidth / 2;
        lineSegments.forEach((s, j) => {
          const w = s.text.length * (fontSize * 0.55);
          result.push(
            <Text
              key={`line-${currentY}-${j}`}
              x={lineX}
              y={currentY - fontSize / 2}
              text={s.text}
              fontSize={fontSize}
              fontStyle={`${s.bold ? 'bold ' : ''}${s.italic ? 'italic' : ''}`.trim() || 'normal'}
              fill="#e0e0e0"
              width={w}
              align="center"
            />
          );
          lineX += w;
        });
        currentY += lineHeight;
        lineSegments = [];
        xOffset = 0;
      } else {
        lineSegments.push(seg);
      }
    });
    if (lineSegments.length > 0) {
      let totalWidth = 0;
      lineSegments.forEach(s => {
        totalWidth += s.text.length * (fontSize * 0.55);
      });
      let lineX = -totalWidth / 2;
      lineSegments.forEach((s, j) => {
        const w = s.text.length * (fontSize * 0.55);
        result.push(
          <Text
            key={`line-${currentY}-${j}`}
            x={lineX}
            y={currentY - fontSize / 2}
            text={s.text}
            fontSize={fontSize}
            fontStyle={`${s.bold ? 'bold ' : ''}${s.italic ? 'italic' : ''}`.trim() || 'normal'}
            fill="#e0e0e0"
            width={w}
            align="center"
          />
        );
        lineX += w;
      });
    }
    return result;
  };

  const isEditing = editingId === node.id;

  return (
    <Group
      ref={groupRef}
      x={node.x + node.width / 2}
      y={node.y + node.height / 2}
      scaleX={scaleAnim}
      scaleY={scaleAnim}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(node.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(node.id);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onDoubleClick(node.id);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStart(node.id);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        const tgt = e.target;
        const parent = tgt.getParent();
        if (parent) {
          onDragEnd(tgt.id(), tgt.x() - parent.width() / 2, tgt.y() - parent.height() / 2);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConnectorHovered(false);
      }}
    >
      <Rect
        x={-node.width / 2}
        y={-node.height / 2}
        width={node.width}
        height={node.height}
        cornerRadius={14}
        fill="#2d2d44"
        stroke={borderColor}
        strokeWidth={2}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOffsetX={0}
        shadowOffsetY={isSelected ? 0 : 3}
        shadowOpacity={isSelected ? 1 : 0.5}
      />
      <Group>{handleTextRender()}</Group>
      {node.children.length > 0 && (
        <Circle
          x={node.width / 2 - 8}
          y={-node.height / 2 + 8}
          radius={8}
          fill={node.collapsed ? '#3b82f6' : '#4a5b8a'}
          stroke="#e0e0e0"
          strokeWidth={1}
          onClick={(e) => {
            e.cancelBubble = true;
            onToggleCollapse(node.id);
          }}
        />
      )}
      <Circle
        x={0}
        y={node.height / 2}
        radius={5 / scale}
        fill={connectorHovered ? '#f97316' : '#3b82f6'}
        stroke="#ffffff"
        strokeWidth={1}
        onMouseEnter={() => setConnectorHovered(true)}
        onMouseLeave={() => setConnectorHovered(false)}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          const absPos = e.target.getAbsolutePosition();
          onStartConnect(node.id, absPos.x, absPos.y);
        }}
      />
    </Group>
  );
};

interface EdgeComponentProps {
  edge: Edge;
  sourceNode: Node;
  targetNode: Node;
  selected: boolean;
  scale: number;
  onClick: (id: string) => void;
}

const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  sourceNode,
  targetNode,
  selected,
  scale,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const color = getEdgeColor(Math.min(targetNode.level, EDGE_COLORS.length - 1));

  const sx = sourceNode.x + sourceNode.width / 2;
  const sy = sourceNode.y + sourceNode.height / 2;
  const tx = targetNode.x + targetNode.width / 2;
  const ty = targetNode.y + targetNode.height / 2;

  const exitX = sourceNode.x + sourceNode.width;
  const exitY = sourceNode.y + sourceNode.height / 2;
  const entryX = targetNode.x;
  const entryY = targetNode.y + targetNode.height / 2;

  const dx = Math.max(Math.abs(exitX - entryX) * 0.5, 40);
  const c1x = exitX + dx;
  const c1y = exitY;
  const c2x = entryX - dx;
  const c2y = entryY;

  const lineWidth = (hovered || selected ? 2.5 : 1.5) / scale;

  return (
    <Group>
      <Line
        points={[exitX, exitY, c1x, c1y, c2x, c2y, entryX, entryY]}
        stroke={selected ? '#ff7f50' : color}
        strokeWidth={lineWidth * 3}
        bezier
        lineCap="round"
        lineJoin="round"
        opacity={0}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick(edge.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <Line
        points={[exitX, exitY, c1x, c1y, c2x, c2y, entryX, entryY]}
        stroke={selected ? '#ff7f50' : color}
        strokeWidth={lineWidth}
        bezier
        lineCap="round"
        lineJoin="round"
      />
      <Arrow
        points={[c2x, c2y, entryX, entryY]}
        stroke={selected ? '#ff7f50' : color}
        fill={selected ? '#ff7f50' : color}
        strokeWidth={lineWidth}
        pointerLength={12 / scale}
        pointerWidth={10 / scale}
      />
    </Group>
  );
};

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ model, onStateChange }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  const isConfirmingRef = useRef(false);
  const isCancellingRef = useRef(false);
  onStateChangeRef.current = onStateChange;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [originalEditText, setOriginalEditText] = useState('');
  const [editInputPos, setEditInputPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [connecting, setConnecting] = useState<{ sourceId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [animatingNodes, setAnimatingNodes] = useState<Map<string, { fromX: number; fromY: number; toX: number; toY: number }>>(new Map());
  const [animStart, setAnimStart] = useState(0);
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const refreshData = useCallback(() => {
    const visibleNodes = model.getVisibleNodes();
    setNodes(visibleNodes);
    setEdges(model.getEdges());
    onStateChangeRef.current && onStateChangeRef.current();
  }, [model]);

  useEffect(() => {
    const unsubscribe = model.subscribe(() => {
      refreshData();
      setHasUnsavedChanges(true);
    });
    refreshData();
    return unsubscribe;
  }, [model, refreshData]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (editingNodeId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingNodeId]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, Node>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const oldScale = scale;
    const step = e.evt.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2.0, oldScale + step));
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      setScale(newScale);
      return;
    }
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.x(newPos.x);
    stage.y(newPos.y);
    setScale(newScale);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Layer') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  const handleStageDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Layer') {
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const worldPos = {
        x: (pos.x - stage.x()) / scale,
        y: (pos.y - stage.y()) / scale,
      };
      model.createRootNode(worldPos.x - 100, worldPos.y - 30);
    }
  };

  const handleNodeSelect = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const handleNodeDeselect = () => {
    setSelectedNodeId(null);
  };

  const handleNodeDragStart = (id: string) => {
  };

  const handleNodeDragEnd = (id: string, x: number, y: number) => {
    model.updateNodePositionDirect(id, x, y);
    model.pushSnapshot();
    refreshData();
  };

  const handleNodeDragMove = (id: string, x: number, y: number) => {
  };

  const handleNodeDoubleClick = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;
    setEditingNodeId(id);
    setEditText(node.text);
    setOriginalEditText(node.text);
    const stage = stageRef.current;
    if (!stage) return;
    const scaleVal = scale;
    const s = stage;
    const screenX = s.x() + node.x * scaleVal + s.container().getBoundingClientRect().left - document.documentElement.scrollLeft;
    const screenY = s.y() + node.y * scaleVal + s.container().getBoundingClientRect().top - document.documentElement.scrollTop;
    setEditInputPos({
      x: screenX + 10,
      y: screenY + node.height * scaleVal / 2 - 16,
      width: node.width * scaleVal - 20,
      height: 32,
    });
  };

  const handleEditTextConfirm = () => {
    if (editingNodeId && !isConfirmingRef.current) {
      isConfirmingRef.current = true;
      model.updateNodeText(editingNodeId, editText);
      setEditingNodeId(null);
      setEditText('');
      setOriginalEditText('');
      setTimeout(() => {
        isConfirmingRef.current = false;
      }, 0);
    }
  };

  const handleEditTextCancel = () => {
    isCancellingRef.current = true;
    setEditingNodeId(null);
    setEditText(originalEditText);
    setOriginalEditText('');
    setTimeout(() => {
      isCancellingRef.current = false;
    }, 0);
  };

  const handleStartConnect = (sourceId: string, x: number, y: number) => {
    setConnecting({ sourceId, x, y });
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) setMousePos(pos);
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (pos) setMousePos(pos);
    if (connecting) {
      setConnecting({ ...connecting });
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!connecting) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) {
      setConnecting(null);
      return;
    }
    const worldPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };
    let targetId: string | null = null;
    for (const node of nodes) {
      if (node.id === connecting.sourceId) continue;
      if (
        worldPos.x >= node.x &&
        worldPos.x <= node.x + node.width &&
        worldPos.y >= node.y &&
        worldPos.y <= node.y + node.height
      ) {
        targetId = node.id;
        break;
      }
    }
    if (targetId) {
      model.addEdge(connecting.sourceId, targetId);
    }
    setConnecting(null);
  };

  const handleEdgeClick = (id: string) => {
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };

  const handleToggleCollapse = (id: string) => {
    model.toggleCollapse(id);
  };

  const runAutoLayout = () => {
    model.pushSnapshot();
    const allNodes = model.getNodes();
    const positions = walkerLayout.calculate(allNodes);
    const fromPositions = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
    const toPositions = new Map(positions.map(p => [p.id, { x: p.x, y: p.y }]));
    const animMap = new Map<string, { fromX: number; fromY: number; toX: number; toY: number }>();
    nodes.forEach(n => {
      const from = fromPositions.get(n.id) || { x: n.x, y: n.y };
      const to = toPositions.get(n.id) || { x: n.x, y: n.y };
      animMap.set(n.id, { fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
    });
    setAnimatingNodes(animMap);
    setAnimStart(performance.now());
    const duration = 300;
    const animate = () => {
      const now = performance.now();
      const progress = Math.min((now - animStart) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const intermediatePositions: LayoutNodePosition[] = [];
      animMap.forEach((v, k) => {
        intermediatePositions.push({
          id: k,
          x: v.fromX + (v.toX - v.fromX) * eased,
          y: v.fromY + (v.toY - v.fromY) * eased,
        });
      });
      model.updateNodePositions(intermediatePositions);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        model.updateNodePositions(positions);
        setAnimatingNodes(new Map());
      }
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEditTextConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleEditTextCancel();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        model.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        model.redo();
        return;
      }
      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault();
        model.createChildNode(selectedNodeId);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !editingNodeId) {
        if (selectedNodeId) {
          e.preventDefault();
          model.deleteNode(selectedNodeId);
          setSelectedNodeId(null);
        } else if (selectedEdgeId) {
          e.preventDefault();
          model.deleteEdge(selectedEdgeId);
          setSelectedEdgeId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, selectedNodeId, selectedEdgeId, model]);

  const exportJSON = () => {
    const data = model.exportToJSON();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  };

  const exportPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldX = stage.x();
    const oldY = stage.y();
    const oldScale = scale;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });
    const padding = 50;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const physicalW = 1920;
    const physicalH = 1080;
    const pixelRatio = 2;
    const logicalW = physicalW / pixelRatio;
    const logicalH = physicalH / pixelRatio;
    const fitScale = Math.min(logicalW / contentW, logicalH / contentH, 1);
    stage.x(padding - minX * fitScale + (logicalW - contentW * fitScale) / 2);
    stage.y(padding - minY * fitScale + (logicalH - contentH * fitScale) / 2);
    setScale(fitScale);
    const layer = stage.getLayers()[0];
    if (layer) {
      const bg = new Konva.Rect({
        x: -10000,
        y: -10000,
        width: 30000,
        height: 30000,
        fill: 'white',
      });
      layer.add(bg as any);
      bg.moveToBottom();
      setTimeout(() => {
        const url = stage.toDataURL({
          width: logicalW,
          height: logicalH,
          mimeType: 'image/png',
          pixelRatio: pixelRatio,
        });
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap_${Date.now()}.png`;
        a.click();
        bg.destroy();
        stage.x(oldX);
        stage.y(oldY);
        setScale(oldScale);
      }, 50);
    }
  };

  const triggerImport = () => {
    if (hasUnsavedChanges) {
      setShowImportWarning(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const doImport = () => {
    setShowImportWarning(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        model.importFromJSON(data);
        setHasUnsavedChanges(false);
        setTimeout(() => runAutoLayout(), 100);
      } catch (err) {
        alert('JSON 文件解析失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addNewNode = () => {
    if (selectedNodeId) {
      model.createChildNode(selectedNodeId);
    } else {
      const stage = stageRef.current;
      if (!stage) return;
      const cx = (stageSize.width / 2 - stage.x()) / scale - 100;
      const cy = (stageSize.height / 2 - stage.y()) / scale - 30;
      model.createRootNode(cx, cy);
    }
  };

  const undo = () => model.undo();
  const redo = () => model.redo();

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(nodes.map(n => n.id));
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, nodes]);

  const tempLine = connecting ? (() => {
    const source = nodeMap.get(connecting.sourceId);
    if (!source) return null;
    const worldMouse = {
      x: (mousePos.x - (stageRef.current?.x() || 0)) / scale,
      y: (mousePos.y - (stageRef.current?.y() || 0)) / scale,
    };
    const sx = source.x + source.width;
    const sy = source.y + source.height / 2;
    const tx = worldMouse.x;
    const ty = worldMouse.y;
    const dx = Math.max(Math.abs(sx - tx) * 0.3, 30);
    return (
      <Line
        points={[sx, sy, sx + dx, sy, tx - dx, ty, tx, ty]}
        stroke="#ff7f50"
        strokeWidth={2}
        bezier
        dash={[8, 4]}
      />
    );
  })() : null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div
        style={{
          width: 64,
          background: '#252538',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 4,
          borderRight: '1px solid #3b3b5c',
        }}
      >
        {[
          { icon: '+', label: '新建节点', onClick: addNewNode, title: '新建节点 (Tab)' },
          { icon: '💾', label: '保存JSON', onClick: exportJSON, title: '导出JSON' },
          { icon: '📁', label: '导入JSON', onClick: triggerImport, title: '导入JSON' },
          { icon: '↩', label: '撤销', onClick: undo, title: '撤销 (Ctrl+Z)' },
          { icon: '↪', label: '重做', onClick: redo, title: '重做 (Ctrl+Shift+Z)' },
        ].map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            title={btn.title}
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: '#ffffff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 200ms ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3b3b5c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {btn.icon}
          </button>
        ))}
        <div style={{ height: 16 }} />
        <button
          onClick={exportPNG}
          title="导出PNG"
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: '#ffffff',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 200ms ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3b3b5c')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          🖼
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onDblClick={handleStageDblClick}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          draggable
          onDragStart={(e) => {
            if (e.target !== e.target.getStage()) e.evt.preventDefault();
          }}
          style={{ background: '#1e1e2e', cursor: connecting ? 'crosshair' : 'default' }}
        >
          <Layer scaleX={scale} scaleY={scale}>
            {visibleEdges.map(edge => {
              const s = nodeMap.get(edge.source);
              const t = nodeMap.get(edge.target);
              if (!s || !t) return null;
              return (
                <EdgeComponent
                  key={edge.id}
                  edge={edge}
                  sourceNode={s}
                  targetNode={t}
                  selected={selectedEdgeId === edge.id}
                  scale={scale}
                  onClick={handleEdgeClick}
                />
              );
            })}
            {tempLine}
            {nodes.map(node => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                scale={scale}
                onSelect={handleNodeSelect}
                onDeselect={handleNodeDeselect}
                onDragStart={handleNodeDragStart}
                onDragEnd={handleNodeDragEnd}
                onDragMove={handleNodeDragMove}
                onDoubleClick={handleNodeDoubleClick}
                onStartConnect={handleStartConnect}
                onToggleCollapse={handleToggleCollapse}
                editingId={editingNodeId}
                editText={editText}
                onEditTextChange={setEditText}
                onEditTextConfirm={handleEditTextConfirm}
                onEditTextCancel={handleEditTextCancel}
                stageRef={stageRef}
                containerRef={containerRef}
              />
            ))}
          </Layer>
        </Stage>
        <button
          onClick={runAutoLayout}
          title="自动布局"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            transition: 'background-color 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
        >
          ⚡ 自动布局
        </button>
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: 'rgba(37, 37, 56, 0.9)',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            color: '#e0e0e0',
            border: '1px solid #3b3b5c',
          }}
        >
          {Math.round(scale * 100)}%
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(37, 37, 56, 0.9)',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            color: '#9ca3af',
            border: '1px solid #3b3b5c',
            lineHeight: 1.8,
          }}
        >
          <div>双击空白: 创建根节点</div>
          <div>选中节点+Tab: 创建子节点</div>
          <div>滚轮: 缩放 | 拖拽空白: 平移</div>
          <div>拖拽连接点: 创建连线 | Del: 删除</div>
        </div>
        {editingNodeId && (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={(e) => {
              if (!isCancellingRef.current) {
                handleEditTextConfirm();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleEditTextConfirm();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleEditTextCancel();
              }
            }}
            style={{
              position: 'fixed',
              left: editInputPos.x,
              top: editInputPos.y,
              width: editInputPos.width,
              height: editInputPos.height,
              padding: '4px 8px',
              border: '2px solid #3b82f6',
              borderRadius: 6,
              background: '#2d2d44',
              color: '#e0e0e0',
              fontSize: 14,
              outline: 'none',
              zIndex: 1000,
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
            }}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {showImportWarning && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={() => setShowImportWarning(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#252538',
                padding: 24,
                borderRadius: 12,
                border: '1px solid #3b3b5c',
                minWidth: 340,
              }}
            >
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>⚠️ 提示</h3>
              <p style={{ marginBottom: 20, color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>
                当前画布有未保存的内容，导入将覆盖现有数据，是否继续？
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowImportWarning(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #3b3b5c',
                    background: 'transparent',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={doImport}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#ff7f50',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  继续导入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
