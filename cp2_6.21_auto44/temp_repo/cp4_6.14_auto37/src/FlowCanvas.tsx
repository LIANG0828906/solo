import { useRef, useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Download, FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useFlowStore, FlowNode, ActionType } from '@/store/flowStore';
import NodeCard from './NodeCard';

const ACTION_COLORS: Record<ActionType, string> = {
  cut: '#3498DB',
  boil: '#E67E22',
  bake: '#E74C3C',
  stew: '#9B59B6',
  mix: '#27AE60',
  steam: '#1ABC9C',
  fry: '#F39C12',
  other: '#95A5A6',
};

export default function FlowCanvas() {
  const {
    nodes,
    scale,
    offsetX,
    offsetY,
    selectedNodeId,
    editingNodeId,
    setScale,
    setOffset,
    setSelectedNode,
    setEditingNode,
    updateNode,
    removeNode,
    insertNodeAfter,
    moveNode,
  } = useFlowStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showInsertMenu, setShowInsertMenu] = useState<string | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(scale + delta);
    },
    [scale, setScale]
  );

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-node-card]')) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
    },
    [offsetX, offsetY]
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setOffset(panStart.current.ox + dx, panStart.current.oy + dy);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, setOffset]);

  const handleNodeDragStop = useCallback(
    (id: string, dx: number, dy: number) => {
      moveNode(id, dx / scale, dy / scale);
    },
    [scale, moveNode]
  );

  const handleNodeDelete = useCallback(
    (id: string) => {
      removeNode(id);
    },
    [removeNode]
  );

  const handleNodeSelect = useCallback(
    (id: string) => {
      setSelectedNode(id);
    },
    [setSelectedNode]
  );

  const handleNodeEdit = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        setEditingNode(id);
        setEditText(node.description);
      }
    },
    [nodes, setEditingNode]
  );

  const handleEditSave = useCallback(
    (id: string) => {
      updateNode(id, { description: editText });
      setEditingNode(null);
      setEditText('');
    },
    [editText, updateNode, setEditingNode]
  );

  const handleInsertNode = useCallback(
    (afterId: string) => {
      const afterNode = nodes.find((n) => n.id === afterId);
      if (!afterNode) return;
      const newNode: FlowNode = {
        id: uuidv4(),
        stepNumber: afterNode.stepNumber + 1,
        description: '新步骤',
        ingredients: [],
        tools: [],
        duration: '',
        actionType: 'other',
        x: afterNode.x,
        y: afterNode.y + 140,
        isNew: true,
      };
      insertNodeAfter(afterId, newNode);
      setShowInsertMenu(null);
    },
    [nodes, insertNodeAfter]
  );

  const handleExportPNG = useCallback(async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      width: 1920,
      height: 1080,
      scale: 2,
      backgroundColor: '#FFF8E1',
    });
    const link = document.createElement('a');
    link.download = 'recipe-flow.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      width: 1920,
      height: 1080,
      scale: 2,
      backgroundColor: '#FFF8E1',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'px', [1920, 1080]);
    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    pdf.save('recipe-flow.pdf');
  }, []);

  const handlePreview = useCallback(async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      width: 1920,
      height: 1080,
      scale: 1,
      backgroundColor: '#FFF8E1',
    });
    setPreviewUrl(canvas.toDataURL('image/png'));
    setShowPreview(true);
  }, []);

  const renderConnections = () => {
    const sorted = [...nodes].sort((a, b) => a.stepNumber - b.stepNumber);
    const lines: JSX.Element[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const x1 = from.x + 100;
      const y1 = from.y + 80;
      const x2 = to.x + 100;
      const y2 = to.y;
      const color = ACTION_COLORS[from.actionType];
      const midY = (y1 + y2) / 2;

      lines.push(
        <g key={`line-${from.id}-${to.id}`}>
          <path
            d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            className="flow-line"
          />
          <polygon
            points={`${x2},${y2} ${x2 - 6},${y2 - 10} ${x2 + 6},${y2 - 10}`}
            fill={color}
            style={{ opacity: 0, animation: 'fadeIn 0.4s ease 0.2s forwards' }}
          />
        </g>
      );
    }

    return lines;
  };

  return (
    <div className="flex flex-col h-full bg-warm-50">
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm border-b border-warm-100">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-warm-50 transition-colors btn-press"
            onClick={() => setScale(scale - 0.1)}
            title="缩小"
          >
            <ZoomOut size={18} className="text-warm-600" />
          </button>
          <span className="text-xs text-warm-600 min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            className="p-2 rounded-lg hover:bg-warm-50 transition-colors btn-press"
            onClick={() => setScale(scale + 0.1)}
            title="放大"
          >
            <ZoomIn size={18} className="text-warm-600" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-warm-50 transition-colors btn-press"
            onClick={() => { setScale(1); setOffset(0, 0); }}
            title="重置视图"
          >
            <Maximize2 size={18} className="text-warm-600" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-500 text-white text-sm btn-press hover:bg-warm-600 transition-colors"
            onClick={handlePreview}
            disabled={nodes.length === 0}
          >
            <FileText size={14} />
            预览
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-sm btn-press hover:bg-warm-200 transition-colors"
            onClick={handleExportPNG}
            disabled={nodes.length === 0}
          >
            <Download size={14} />
            PNG
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-sm btn-press hover:bg-warm-200 transition-colors"
            onClick={handleExportPDF}
            disabled={nodes.length === 0}
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing canvas-grid relative"
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onClick={() => {
          setSelectedNode(null);
          setEditingNode(null);
          setShowInsertMenu(null);
        }}
      >
        <div
          ref={exportRef}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: '0 0',
            position: 'relative',
            width: '4000px',
            height: '4000px',
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4000px',
              height: '4000px',
              pointerEvents: 'none',
            }}
          >
            {renderConnections()}
          </svg>

          {nodes.map((node) => (
            <div key={node.id} data-node-card>
              <NodeCard
                node={node}
                onDelete={handleNodeDelete}
                onEdit={handleNodeEdit}
                onDragStop={(dx, dy) => handleNodeDragStop(node.id, dx, dy)}
                onSelect={handleNodeSelect}
              />

              {selectedNodeId === node.id && editingNodeId !== node.id && (
                <button
                  className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-warm-500 text-white shadow-md hover:bg-warm-600 transition-colors btn-press z-10"
                  style={{
                    left: node.x + 100 - 12,
                    top: node.y + 80 + 4,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInsertMenu(showInsertMenu === node.id ? null : node.id);
                  }}
                >
                  <Plus size={14} />
                </button>
              )}

              {showInsertMenu === node.id && (
                <div
                  className="absolute bg-white rounded-lg shadow-lg border border-warm-200 p-2 z-20"
                  style={{
                    left: node.x + 120,
                    top: node.y + 80,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-warm-50 text-sm text-warm-700 w-full transition-colors"
                    onClick={() => handleInsertNode(node.id)}
                  >
                    <Plus size={14} />
                    在此步骤后插入
                  </button>
                </div>
              )}

              {editingNodeId === node.id && (
                <div
                  className="absolute bg-white rounded-[14px] shadow-card-drag p-3 z-50 w-[220px]"
                  style={{
                    left: node.x - 10,
                    top: node.y - 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <textarea
                    className="w-full border border-warm-300 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-warm-400 outline-none"
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave(node.id);
                      }
                      if (e.key === 'Escape') {
                        setEditingNode(null);
                        setEditText('');
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 bg-warm-500 text-white rounded-lg py-1 text-sm btn-press hover:bg-warm-600"
                      onClick={() => handleEditSave(node.id)}
                    >
                      保存
                    </button>
                    <button
                      className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-1 text-sm btn-press hover:bg-gray-200"
                      onClick={() => {
                        setEditingNode(null);
                        setEditText('');
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-5xl mb-4">🍳</p>
              <p className="text-warm-600 text-lg font-medium">输入食谱开始生成流程图</p>
              <p className="text-warm-400 text-sm mt-1">支持拖拽、编辑和导出</p>
            </div>
          </div>
        )}
      </div>

      {showPreview && previewUrl && (
        <div className="export-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-warm-700">导出预览</h3>
              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 bg-warm-500 text-white rounded-lg text-sm btn-press hover:bg-warm-600"
                  onClick={handleExportPNG}
                >
                  下载PNG
                </button>
                <button
                  className="px-4 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-sm btn-press hover:bg-warm-200"
                  onClick={handleExportPDF}
                >
                  下载PDF
                </button>
                <button
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm btn-press hover:bg-gray-200"
                  onClick={() => setShowPreview(false)}
                >
                  关闭
                </button>
              </div>
            </div>
            <img src={previewUrl} alt="预览" className="max-w-full max-h-[70vh] rounded-lg border border-warm-200" />
          </div>
        </div>
      )}
    </div>
  );
}
