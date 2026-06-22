import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DesignCanvas from './DesignCanvas';
import ColorPalette from './ColorPalette';
import { DEFAULT_PALETTE } from './designStore';
import type { CellData } from './designStore';
import type { Pattern } from '../types';

export default function DesignPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternName, setPatternName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const pendingGridRef = useRef<CellData[][] | null>(null);
  const pendingThumbRef = useRef<string>('');
  const canvasKeyRef = useRef(0);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const res = await axios.get('/api/patterns');
      setPatterns(res.data);
    } catch (err) {
      console.error('加载图案失败:', err);
    }
  };

  const handleSave = (grid: CellData[][], thumbnail: string) => {
    pendingGridRef.current = grid;
    pendingThumbRef.current = thumbnail;
    setPatternName(selectedPattern?.name || '');
    setShowNameModal(true);
  };

  const confirmSave = async () => {
    if (!patternName.trim()) {
      alert('请输入图案名称');
      return;
    }
    if (!pendingGridRef.current) return;

    const colors = Array.from(new Set(
      pendingGridRef.current.flat().filter(c => c.stitch !== 0).map(c => c.color)
    )).filter(Boolean);
    if (colors.length === 0) {
      alert('图案不能为空，请先绘制一些内容');
      return;
    }

    const finalColors = colors.length >= 3 ? colors : [...colors, ...DEFAULT_PALETTE].slice(0, 12);

    try {
      if (selectedPattern) {
        await axios.put(`/api/patterns/${selectedPattern.id}`, {
          name: patternName,
          grid_data: pendingGridRef.current,
          colors: finalColors,
          thumbnail: pendingThumbRef.current
        });
      } else {
        await axios.post('/api/patterns', {
          name: patternName,
          grid_data: pendingGridRef.current,
          colors: finalColors,
          thumbnail: pendingThumbRef.current
        });
      }
      setShowNameModal(false);
      pendingGridRef.current = null;
      pendingThumbRef.current = '';
      setPatternName('');
      await loadPatterns();
      alert('保存成功！');
    } catch (err: any) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSelectPattern = async (pattern: Pattern) => {
    try {
      const res = await axios.get(`/api/patterns/${pattern.id}`);
      setSelectedPattern(res.data);
      setPatternName(res.data.name);
      canvasKeyRef.current++;
    } catch (err) {
      console.error('加载图案详情失败:', err);
    }
  };

  const handleNewPattern = () => {
    setSelectedPattern(null);
    setPatternName('');
    canvasKeyRef.current++;
  };

  const handleDeletePattern = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个图案吗？')) return;
    try {
      await axios.delete(`/api/patterns/${id}`);
      if (selectedPattern?.id === id) {
        handleNewPattern();
      }
      await loadPatterns();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  return (
    <div className="design-page">
      <h1 className="page-title">图案设计中心</h1>

      <div className="design-layout">
        <div className="design-main">
          <div className="pattern-actions">
            <button className="btn-primary" onClick={handleNewPattern}>
              + 新建图案
            </button>
            {selectedPattern && (
              <span className="current-pattern-name">
                当前编辑: {selectedPattern.name}
              </span>
            )}
          </div>
          <DesignCanvas
            key={canvasKeyRef.current}
            patternId={selectedPattern?.id || null}
            initialGrid={selectedPattern?.grid_data}
            onSave={handleSave}
          />
        </div>

        <div className="design-sidebar">
          <ColorPalette />
          
          <div className="pattern-library card">
            <h3 className="lib-title">图案库</h3>
            <div className="lib-grid">
              {patterns.length === 0 ? (
                <div className="lib-empty">暂无保存的图案</div>
              ) : (
                patterns.map(p => (
                  <div
                    key={p.id}
                    className={`pattern-card ${selectedPattern?.id === p.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPattern(p)}
                  >
                    <div className="pattern-thumb">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} />
                      ) : (
                        <div className="thumb-placeholder">暂无预览</div>
                      )}
                    </div>
                    <div className="pattern-info">
                      <span className="pattern-name">{p.name}</span>
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeletePattern(p.id, e)}
                        title="删除"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showNameModal && (
        <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>
              {selectedPattern ? '更新图案' : '保存新图案'}
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                图案名称
              </label>
              <input
                type="text"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="请输入图案名称"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowNameModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={confirmSave}>
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .design-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .design-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .design-layout {
            grid-template-columns: 1fr;
          }
          .design-sidebar {
            order: 2;
          }
          .design-main {
            order: 1;
          }
        }
        .design-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pattern-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .current-pattern-name {
          color: var(--primary);
          font-weight: 500;
        }
        .design-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .pattern-library {
          padding: 20px;
        }
        .lib-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-dark);
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--border);
        }
        .lib-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .lib-empty {
          grid-column: span 2;
          text-align: center;
          padding: 24px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .pattern-card {
          border: 2px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease-out;
        }
        .pattern-card:hover {
          border-color: var(--secondary);
          box-shadow: var(--shadow-hover);
        }
        .pattern-card.selected {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(139, 115, 85, 0.2);
        }
        .pattern-thumb {
          aspect-ratio: 1;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .pattern-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .thumb-placeholder {
          color: #CCC;
          font-size: 11px;
        }
        .pattern-info {
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--background);
        }
        .pattern-name {
          font-size: 12px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .delete-btn {
          padding: 4px 8px;
          font-size: 12px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .delete-btn:hover {
          opacity: 1;
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}
