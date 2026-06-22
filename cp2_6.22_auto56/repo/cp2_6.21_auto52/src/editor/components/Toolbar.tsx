import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Undo2, Redo2, BarChart3, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ToolbarProps {
  onAddChart: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddChart, onExport }) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    setPan,
    loadTemplate,
    currentTemplateId,
  } = useEditorStore();

  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const templates = [
    { id: 'template-two-column', name: '双栏对比' },
    { id: 'template-timeline', name: '水平时间线' },
    { id: 'template-flow', name: '垂直流程图' },
    { id: 'template-cards', name: '数据卡片' },
    { id: 'template-person', name: '人物介绍' },
  ];

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const ToolButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
  }> = ({ icon, label, onClick, disabled, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        padding: '8px 12px',
        border: 'none',
        backgroundColor: active ? '#d0e4ff' : 'transparent',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: '#333',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = '#e8f0fe';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      style={{
        height: 52,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 4,
        position: 'relative',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16, color: '#333', marginRight: 20 }}>
        Infographic Studio
      </div>

      <div style={{ height: 28, width: 1, backgroundColor: '#e0e0e0', margin: '0 8px' }} />

      <ToolButton
        icon={<Undo2 size={18} />}
        label="撤销"
        onClick={undo}
        disabled={!canUndo}
      />
      <ToolButton
        icon={<Redo2 size={18} />}
        label="重做"
        onClick={redo}
        disabled={!canRedo}
      />

      <div style={{ height: 28, width: 1, backgroundColor: '#e0e0e0', margin: '0 8px' }} />

      <div style={{ position: 'relative' }}>
        <ToolButton
          icon={<BarChart3 size={18} />}
          label="添加图表"
          onClick={onAddChart}
        />
      </div>

      <ToolButton
        icon={<Download size={18} />}
        label="导出"
        onClick={onExport}
      />

      <div style={{ height: 28, width: 1, backgroundColor: '#e0e0e0', margin: '0 8px' }} />

      <div style={{ position: 'relative' }}>
        <ToolButton
          icon={<span style={{ fontSize: 13, fontWeight: 500 }}>📋</span>}
          label={`模板: ${templates.find(t => t.id === currentTemplateId)?.name || '选择'}`}
          onClick={() => setShowTemplateMenu(!showTemplateMenu)}
        />
        {showTemplateMenu && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9 }}
              onClick={() => setShowTemplateMenu(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                backgroundColor: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: 8,
                minWidth: 180,
                zIndex: 10,
              }}
            >
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    loadTemplate(t.id);
                    setShowTemplateMenu(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    backgroundColor: currentTemplateId === t.id ? '#e8f0fe' : 'transparent',
                    fontWeight: currentTemplateId === t.id ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (currentTemplateId !== t.id) {
                      e.currentTarget.style.backgroundColor = '#f5f7fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTemplateId !== t.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <ToolButton
        icon={<ZoomOut size={18} />}
        label=""
        onClick={handleZoomOut}
        disabled={zoom <= 0.5}
      />
      <div style={{ fontSize: 13, color: '#666', minWidth: 50, textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </div>
      <ToolButton
        icon={<ZoomIn size={18} />}
        label=""
        onClick={handleZoomIn}
        disabled={zoom >= 2.0}
      />
      <ToolButton
        icon={<RotateCcw size={18} />}
        label="重置视图"
        onClick={handleResetView}
      />
    </div>
  );
};
