import { useState, useCallback } from 'react';
import type { Vertex, PolygonStyles } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_VERTEX_COLOR, DEFAULT_STROKE_COLOR } from './types';
import { exportSVG } from './exportSVG';

interface SidebarProps {
  vertices: Vertex[];
  selectedVertexIndex: number | null;
  styles: PolygonStyles;
  onSelectVertex: (index: number | null) => void;
  onAddVertex: () => void;
  onDeleteVertex: (index: number) => void;
  onUpdateVertexColor: (index: number, color: string) => void;
  onUpdateVertexStrokeColor: (index: number, strokeColor: string) => void;
  onUpdateVertexPosition: (index: number, x: number, y: number) => void;
}

export default function Sidebar({
  vertices,
  selectedVertexIndex,
  styles,
  onSelectVertex,
  onAddVertex,
  onDeleteVertex,
  onUpdateVertexColor,
  onUpdateVertexStrokeColor,
  onUpdateVertexPosition,
}: SidebarProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedSVG, setExportedSVG] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedVertex = selectedVertexIndex !== null ? vertices[selectedVertexIndex] : null;

  const handleExportSVG = useCallback(() => {
    const svg = exportSVG(vertices, styles, CANVAS_WIDTH, CANVAS_HEIGHT);
    setExportedSVG(svg);
    setShowExportModal(true);
    setCopied(false);
  }, [vertices, styles]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportedSVG);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [exportedSVG]);

  const handleCloseModal = useCallback(() => {
    setShowExportModal(false);
    setExportedSVG('');
  }, []);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedVertexIndex !== null) {
        onUpdateVertexColor(selectedVertexIndex, e.target.value);
      }
    },
    [selectedVertexIndex, onUpdateVertexColor]
  );

  const handleStrokeColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedVertexIndex !== null) {
        onUpdateVertexStrokeColor(selectedVertexIndex, e.target.value);
      }
    },
    [selectedVertexIndex, onUpdateVertexStrokeColor]
  );

  const handleXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedVertexIndex !== null && selectedVertex) {
        const value = parseFloat(e.target.value) || 0;
        onUpdateVertexPosition(selectedVertexIndex, Math.max(0, Math.min(CANVAS_WIDTH, value)), selectedVertex.y);
      }
    },
    [selectedVertexIndex, selectedVertex, onUpdateVertexPosition]
  );

  const handleYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedVertexIndex !== null && selectedVertex) {
        const value = parseFloat(e.target.value) || 0;
        onUpdateVertexPosition(selectedVertexIndex, selectedVertex.x, Math.max(0, Math.min(CANVAS_HEIGHT, value)));
      }
    },
    [selectedVertexIndex, selectedVertex, onUpdateVertexPosition]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedVertexIndex !== null) {
      onDeleteVertex(selectedVertexIndex);
      onSelectVertex(null);
    }
  }, [selectedVertexIndex, onDeleteVertex, onSelectVertex]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">多边形编辑器</h2>
      </div>

      <div className="sidebar-content">
        <div className="section">
          <h3 className="section-title">顶点列表</h3>
          <div className="vertex-count">
            当前顶点数：{vertices.filter((v) => !v.isDeleting).length}
          </div>
          <div className="vertex-list">
            {vertices.filter((v) => !v.isDeleting).map((vertex, idx) => (
              <div
                key={vertex.id}
                className={`vertex-item ${selectedVertexIndex === vertices.indexOf(vertex) ? 'selected' : ''}`}
                onClick={() => onSelectVertex(vertices.indexOf(vertex))}
              >
                <span
                  className="vertex-dot"
                  style={{ backgroundColor: vertex.color, borderColor: vertex.strokeColor }}
                />
                <span className="vertex-label">顶点 {idx + 1}</span>
                <span className="vertex-coords">
                  ({Math.round(vertex.x)}, {Math.round(vertex.y)})
                </span>
              </div>
            ))}
            {vertices.filter((v) => !v.isDeleting).length === 0 && (
              <div className="empty-hint">点击画布添加顶点</div>
            )}
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">顶点操作</h3>
          <div className="button-group">
            <button className="btn btn-primary" onClick={onAddVertex}>
              添加顶点
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
              disabled={selectedVertexIndex === null}
            >
              删除选中顶点
            </button>
          </div>
        </div>

        {selectedVertex && (
          <div className="section">
            <h3 className="section-title">选中顶点属性</h3>
            <div className="property-group">
              <label className="property-label">X 坐标</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedVertex.x)}
                onChange={handleXChange}
                min={0}
                max={CANVAS_WIDTH}
              />
            </div>
            <div className="property-group">
              <label className="property-label">Y 坐标</label>
              <input
                type="number"
                className="property-input"
                value={Math.round(selectedVertex.y)}
                onChange={handleYChange}
                min={0}
                max={CANVAS_HEIGHT}
              />
            </div>
            <div className="property-group">
              <label className="property-label">填充颜色</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-input"
                  value={selectedVertex.color}
                  onChange={handleColorChange}
                />
                <input
                  type="text"
                  className="color-text-input"
                  value={selectedVertex.color}
                  onChange={handleColorChange}
                />
              </div>
            </div>
            <div className="property-group">
              <label className="property-label">描边颜色</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-input"
                  value={selectedVertex.strokeColor}
                  onChange={handleStrokeColorChange}
                />
                <input
                  type="text"
                  className="color-text-input"
                  value={selectedVertex.strokeColor}
                  onChange={handleStrokeColorChange}
                />
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <h3 className="section-title">导出</h3>
          <button className="btn btn-primary btn-export" onClick={handleExportSVG}>
            导出 SVG
          </button>
        </div>

        <div className="section tips-section">
          <h3 className="section-title">操作提示</h3>
          <ul className="tips-list">
            <li>点击画布空白处添加顶点</li>
            <li>拖拽顶点调整位置</li>
            <li>双击顶点删除</li>
            <li>点击顶点选中后可编辑属性</li>
          </ul>
        </div>
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">导出 SVG 代码</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre className="code-block">{exportedSVG}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleCopyToClipboard}>
                {copied ? '已复制！' : '复制到剪贴板'}
              </button>
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
