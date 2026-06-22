import { useState, useEffect } from 'react';
import GeneratorPanel from '@/components/GeneratorPanel';
import EditorPanel from '@/components/EditorPanel';
import ExportBar from '@/components/ExportBar';
import CardEditorOverlay from '@/components/CardEditorOverlay';
import { Menu, X } from 'lucide-react';
import { useCardStore } from '@/store/cards';

export default function App() {
  const isEditorOpen = useCardStore((s) => s.isEditorOpen);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 layout-desktop flex overflow-hidden">
        <div
          className="panel-left flex flex-col overflow-hidden"
          style={{
            width: isMobile ? '100%' : '60%',
            backgroundColor: '#f5f5f5',
            paddingBottom: isMobile ? 72 : 88,
          }}
        >
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: '#6c63ff', boxShadow: '0 4px 10px rgba(108,99,255,0.3)' }}
              >
                卡
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ letterSpacing: 0.3 }}>知识卡片批量生成器</h1>
                <p className="text-xs" style={{ color: '#888' }}>输入关键词 · 一键生成 · 批量导出</p>
              </div>
            </div>
            {isMobile && (
              <button
                className="btn-secondary flex items-center gap-1 text-sm"
                onClick={() => setMobileRightOpen((v) => !v)}
              >
                {mobileRightOpen ? <X size={16} /> : <Menu size={16} />}
                {mobileRightOpen ? '收起' : '生成'}
              </button>
            )}
          </div>
          <EditorPanel />
        </div>

        <div
          className="panel-right flex flex-col overflow-hidden border-l"
          style={{
            width: isMobile ? '100%' : '40%',
            backgroundColor: '#ffffff',
            borderColor: 'rgba(0,0,0,0.06)',
            display: isMobile && !mobileRightOpen ? 'none' : 'flex',
            paddingBottom: isMobile ? 72 : 0,
            position: isMobile ? 'absolute' : 'relative',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 30,
            boxShadow: isMobile && mobileRightOpen ? '-4px 0 16px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <GeneratorPanel />
        </div>
      </div>

      <ExportBar />
      {isEditorOpen && <CardEditorOverlay />}
    </div>
  );
}
