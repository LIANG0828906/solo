import { Routes, Route, Navigate } from 'react-router-dom';
import EditorCanvas from './editor/EditorCanvas';
import ComponentPalette from './editor/ComponentPalette';
import PropertyPanel from './editor/PropertyPanel';
import GalleryPage from './gallery/GalleryPage';
import {
  useEditorStore,
  useThemeColor,
  useBgColor,
  useCanUndo,
  useCanRedo,
} from './store/editorStore';
import { useNavigate } from 'react-router-dom';

function Toolbar() {
  const themeColor = useThemeColor();
  const bgColor = useBgColor();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const {
    undo,
    redo,
    setThemeColor,
    setBgColor,
    selectedIds,
    removeComponents,
  } = useEditorStore();
  const navigate = useNavigate();

  const themePresets = [
    { label: '灰蓝', value: '#2C3E50' },
    { label: '紫', value: '#8E44AD' },
    { label: '绿', value: '#27AE60' },
    { label: '橙', value: '#E67E22' },
  ];

  const bgPresets = [
    { label: '浅灰', value: '#F5F5F5' },
    { label: '白', value: '#FFFFFF' },
    { label: '深色', value: '#2C3E50' },
  ];

  const buttonBaseStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const handleBatchDelete = () => {
    if (selectedIds.length > 0 && window.confirm(`确定要删除选中的 ${selectedIds.length} 个组件吗？`)) {
      removeComponents(selectedIds);
    }
  };

  return (
    <div
      style={{
        height: 56,
        backgroundColor: themeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          PixelPortfolio
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              ...buttonBaseStyle,
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            title="撤销 (Ctrl+Z)"
            onMouseEnter={(e) => {
              if (canUndo) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
          >
            ↶
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              ...buttonBaseStyle,
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            title="重做 (Ctrl+Y)"
            onMouseEnter={(e) => {
              if (canRedo) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
          >
            ↷
          </button>

          {selectedIds.length > 1 && (
            <button
              onClick={handleBatchDelete}
              style={{
                ...buttonBaseStyle,
                backgroundColor: '#E74C3C',
                border: 'none',
                marginLeft: 8,
              }}
              title={`批量删除 (${selectedIds.length}个)`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontSize: 14 }}>主题</span>
          <select
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {themePresets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontSize: 14 }}>背景</span>
          <select
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {bgPresets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => navigate('/gallery')}
          style={{
            backgroundColor: themeColor,
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.6)',
            borderRadius: 6,
            padding: '6px 20px',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          预览
        </button>
      </div>
    </div>
  );
}

function EditorPage() {
  return (
    <>
      <Toolbar />
      <div style={{ paddingTop: 56, display: 'flex', minHeight: '100vh' }}>
        <ComponentPalette />
        <EditorCanvas />
        <PropertyPanel />
      </div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );
}
