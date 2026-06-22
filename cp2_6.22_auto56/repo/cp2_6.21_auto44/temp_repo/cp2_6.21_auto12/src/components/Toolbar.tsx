// ============================================================
// Toolbar.tsx - 顶部工具栏组件
// 调用关系:
//   数据流向: useStore(layers, palette) → 传递给导出函数
//   用户交互: 汉堡菜单 → 切换响应式抽屉显示
//   用户交互: 导出按钮 → exportIllustration(layers, palette)
//   依赖调用: exportIllustration → svgExporter.ts
// ============================================================
import { useState, useEffect } from 'react';
import { Menu, Paintbrush } from 'lucide-react';
import { useStore } from '@/shared/store';
import { exportIllustration } from '@/utils/svgExporter';

interface ToolbarProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
}

export default function Toolbar({ leftPanelOpen, setLeftPanelOpen }: ToolbarProps) {
  const layers = useStore((s) => s.layers);
  const palette = useStore((s) => s.palette);

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      height: '56px',
      background: 'rgba(30,30,46,0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '200px' }}>
        {isMobile && (
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paintbrush size={20} color="#ffffff" style={{ marginRight: '10px' }} />
        <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 500 }}>矢量插画编辑器</span>
      </div>

      <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => exportIllustration(layers, palette)}
          style={{
            background: '#4285f4',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3367d6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4285f4')}
        >
          导出SVG
        </button>
      </div>
    </div>
  );
}
