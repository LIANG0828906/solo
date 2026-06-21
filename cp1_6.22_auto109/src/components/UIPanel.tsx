import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Fragment,
  HistoryState,
  MATERIALS,
  MaterialConfig,
  MaterialVariant,
  FragmentType,
  BASE_FRAGMENT_SIZE,
} from '@/utils/collageEngine';
import styles from './UIPanel.module.css';

interface UIPanelProps {
  fragments: Fragment[];
  selectedIds: string[];
  history: HistoryState[];
  historyIndex: number;
  editingFragmentId: string | null;
  onFragmentUpdate: (id: string, changes: Partial<Fragment>) => void;
  onZIndexChange: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onCloseEditPanel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onJumpToHistory: (index: number) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onAlignHorizontal: () => void;
  onAlignVertical: () => void;
  onDelete: () => void;
  isExporting: boolean;
  showExportToast: boolean;
}

const UIPanel: React.FC<UIPanelProps> = ({
  fragments,
  selectedIds,
  history,
  historyIndex,
  editingFragmentId,
  onFragmentUpdate,
  onZIndexChange,
  onCloseEditPanel,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onJumpToHistory,
  onGroup,
  onUngroup,
  onAlignHorizontal,
  onAlignVertical,
  onDelete,
  isExporting,
  showExportToast,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [materialPanelExpanded, setMaterialPanelExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const editingFragment = editingFragmentId 
    ? fragments.find(f => f.id === editingFragmentId) 
    : null;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.main-canvas')) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          setContextMenu({ x: e.clientX, y: e.clientY });
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedIds]);

  const handleDragStart = (e: React.DragEvent, type: FragmentType, variant: MaterialVariant) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type,
      color: variant.color,
      texture: variant.texture,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderMaterialCard = (type: FragmentType, variant: MaterialVariant, index: number) => (
    <div
      key={`${type}-${index}`}
      className={styles.materialCard}
      draggable
      onDragStart={(e) => handleDragStart(e, type, variant)}
      title={`${type} - ${variant.texture}`}
    >
      <svg viewBox="-35 -35 70 70" width="50" height="50">
        {type === 'circle' && (
          <circle cx="0" cy="0" r="30" fill={variant.color} stroke="rgba(74, 59, 50, 0.4)" strokeWidth="2" />
        )}
        {type === 'triangle' && (
          <polygon
            points="0,-30 25.98,15 -25.98,15"
            fill={variant.color}
            stroke="rgba(74, 59, 50, 0.4)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {type === 'polygon' && (
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
              const r = 30 * (0.8 + Math.sin(i * 2.5) * 0.2);
              return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
            }).join(' ')}
            fill={variant.color}
            stroke="rgba(74, 59, 50, 0.4)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );

  const actionLabels: Record<string, string> = {
    add: '添加',
    move: '移动',
    rotate: '旋转',
    scale: '缩放',
    delete: '删除',
    group: '组合',
    ungroup: '解散',
    clear: '清空',
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.title}>✂️ 手绘拼贴画</span>
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={styles.toolbarButton}
            onClick={onUndo}
            disabled={historyIndex <= 0}
            title="撤销 (Ctrl+Z)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            className={styles.toolbarButton}
            onClick={onRedo}
            disabled={historyIndex >= history.length - 1}
            title="重做 (Ctrl+Y)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </button>
          <button
            className={styles.toolbarButton}
            onClick={onClear}
            disabled={fragments.length === 0}
            title="清空画布"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            className={`${styles.toolbarButton} ${styles.exportButton}`}
            onClick={onExport}
            disabled={fragments.length === 0 || isExporting}
            title="导出PNG"
          >
            {isExporting ? (
              <svg className={styles.spinner} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={`${styles.materialPanel} ${isMobile ? styles.mobile : ''} ${materialPanelExpanded ? styles.expanded : ''}`}>
        <div 
          className={styles.materialHeader}
          onClick={() => isMobile && setMaterialPanelExpanded(!materialPanelExpanded)}
        >
          <span>素材库</span>
          {isMobile && (
            <svg 
              className={`${styles.expandIcon} ${materialPanelExpanded ? styles.rotated : ''}`}
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
        <div className={styles.materialContent}>
          {MATERIALS.map((material: MaterialConfig) => (
            <div key={material.type} className={styles.materialSection}>
              <div className={styles.materialSectionTitle}>
                {material.type === 'circle' && '圆形'}
                {material.type === 'triangle' && '三角形'}
                {material.type === 'polygon' && '多边形'}
              </div>
              <div className={styles.materialGrid}>
                {material.variants.map((variant, i) => renderMaterialCard(material.type, variant, i))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingFragment && (
        <div className={styles.editPanelOverlay} onClick={onCloseEditPanel}>
          <div className={styles.editPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editPanelHeader}>
              <span>编辑碎片</span>
              <button className={styles.closeButton} onClick={onCloseEditPanel}>×</button>
            </div>
            
            <div className={styles.editPanelContent}>
              <div className={styles.controlGroup}>
                <label>旋转: {Math.round(editingFragment.rotation)}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={editingFragment.rotation}
                  onChange={(e) => onFragmentUpdate(editingFragment.id, { rotation: Number(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderMarks}>
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
              </div>

              <div className={styles.controlGroup}>
                <label>缩放: {editingFragment.scale.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={editingFragment.scale}
                  onChange={(e) => onFragmentUpdate(editingFragment.id, { scale: Number(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.sliderMarks}>
                  <span>0.5x</span>
                  <span>1.25x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <div className={styles.controlGroup}>
                <label>层级调整</label>
                <div className={styles.zIndexButtons}>
                  <button 
                    className={styles.zIndexButton}
                    onClick={() => onZIndexChange(editingFragment.id, 'top')}
                    title="置顶"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    置顶
                  </button>
                  <button 
                    className={styles.zIndexButton}
                    onClick={() => onZIndexChange(editingFragment.id, 'up')}
                    title="上移一层"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    上移
                  </button>
                  <button 
                    className={styles.zIndexButton}
                    onClick={() => onZIndexChange(editingFragment.id, 'down')}
                    title="下移一层"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                    下移
                  </button>
                  <button 
                    className={styles.zIndexButton}
                    onClick={() => onZIndexChange(editingFragment.id, 'bottom')}
                    title="置底"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                    置底
                  </button>
                </div>
              </div>

              <button 
                className={styles.deleteButton}
                onClick={onDelete}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                删除碎片
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className={styles.contextMenuItem} onClick={() => { onGroup(); setContextMenu(null); }}>
            组合
          </button>
          <button className={styles.contextMenuItem} onClick={() => { onUngroup(); setContextMenu(null); }}>
            解散组合
          </button>
          <div className={styles.contextMenuDivider} />
          <button className={styles.contextMenuItem} onClick={() => { onAlignHorizontal(); setContextMenu(null); }}>
            水平对齐
          </button>
          <button className={styles.contextMenuItem} onClick={() => { onAlignVertical(); setContextMenu(null); }}>
            垂直对齐
          </button>
        </div>
      )}

      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <span>历史记录</span>
          <span className={styles.timelineCount}>{history.length} 步</span>
        </div>
        <div className={styles.timelineContent}>
          {history.map((state, index) => (
            <div
              key={state.id}
              className={`${styles.timelineItem} ${index === historyIndex ? styles.active : ''}`}
              onClick={() => onJumpToHistory(index)}
              title={`${actionLabels[state.actionType] || '操作'} - ${new Date(state.timestamp).toLocaleTimeString()}`}
            >
              <img src={state.thumbnail} alt="" className={styles.timelineThumbnail} />
              <span className={styles.timelineLabel}>{actionLabels[state.actionType] || '操作'}</span>
              {index === historyIndex && <div className={styles.timelineIndicator} />}
            </div>
          ))}
          {history.length === 0 && (
            <div className={styles.timelineEmpty}>
              拖拽碎片到画布开始创作吧！
            </div>
          )}
        </div>
      </div>

      {showExportToast && (
        <div className={styles.exportToast}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          图片已保存到下载目录
        </div>
      )}
    </>
  );
};

export default UIPanel;
