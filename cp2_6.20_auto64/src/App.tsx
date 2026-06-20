
import React, { useState, useEffect } from 'react';
import { MoleculeViewer } from './components/MoleculeViewer';
import { AtomPalette } from './components/AtomPalette';
import { BondToolbar } from './components/BondToolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { PresetMenu } from './components/PresetMenu';
import { DragPreview } from './components/DragPreview';
import { Menu, X, Info } from 'lucide-react';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const DesktopLayout = () => (
    <div className="w-full h-full flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 gap-4 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Molecule Lab</h1>
            <p className="text-[10px] text-gray-500">分子结构3D可视化与组装</p>
          </div>
        </div>
        <BondToolbar />
        <div className="flex items-center gap-2">
          <PresetMenu />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[12%] min-w-[160px] border-r border-white/5 bg-[#0d1117]/50 overflow-hidden">
          <AtomPalette />
        </div>
        <div className="flex-1 relative">
          <MoleculeViewer />
          {showIntro && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl
                         bg-[#1a1f2e]/90 backdrop-blur-md border border-cyan-500/30
                         text-xs text-cyan-300 flex items-center gap-2 animate-pulse"
            >
              <Info size={14} />
              <span>从左侧拖拽原子到场景中开始构建分子</span>
              <button
                onClick={() => setShowIntro(false)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <div className="w-[13%] min-w-[180px] overflow-hidden">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );

  const MobileLayout = () => (
    <div className="w-full h-full flex flex-col relative">
      <div className="h-14 flex items-center justify-between px-3 gap-2 border-b border-white/5 bg-[#0d1117]/90 backdrop-blur-sm z-30">
        <button
          onClick={() => setShowLeftDrawer(true)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Menu size={18} className="text-white" />
        </button>
        <div className="flex-1 flex justify-center">
          <BondToolbar />
        </div>
        <PresetMenu />
      </div>
      <div className="flex-1 relative">
        <MoleculeViewer />
        {showIntro && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg
                       bg-[#1a1f2e]/95 backdrop-blur-md border border-cyan-500/30
                       text-[10px] text-cyan-300 flex items-center gap-1.5 animate-pulse z-20"
          >
            <Info size={12} />
            <span>点击左上角菜单打开原子面板</span>
            <button
              onClick={() => setShowIntro(false)}
              className="ml-1 text-gray-400 hover:text-white"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <button
          onClick={() => setShowBottomDrawer(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl
                     bg-[#1a1f2e]/90 backdrop-blur-md border border-white/10
                     text-xs text-white hover:brightness-110 active:scale-95 transition-all z-20"
        >
          查看属性面板
        </button>
      </div>

      {showLeftDrawer && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeftDrawer(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 w-[75%] max-w-[280px]
                       bg-[#0d1117]/95 backdrop-blur-md border-r border-white/10
                       shadow-2xl"
            style={{
              animation: 'slideInLeft 0.3s ease-out',
            }}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-cyan-400">原子元素</h2>
              <button
                onClick={() => setShowLeftDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)] overflow-hidden">
              <AtomPalette />
            </div>
          </div>
        </div>
      )}

      {showBottomDrawer && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBottomDrawer(false)} />
          <div
            className="absolute left-0 right-0 bottom-0 max-h-[70%]
                       bg-[#0d1117]/95 backdrop-blur-md border-t border-white/10
                       shadow-2xl rounded-t-2xl"
            style={{
              animation: 'slideInBottom 0.4s ease-out',
            }}
          >
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-cyan-400">属性面板</h2>
              <button
                onClick={() => setShowBottomDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-hidden">
              <PropertyPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full text-white overflow-hidden">
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      <DragPreview />
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInBottom {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bondUnderline {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
