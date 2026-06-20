
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
      <div className="h-14 flex items-center justify-between px-3 gap-2 border-b border-white/5 bg-[#0d1117]/90 backdrop-blur-sm">
        <button
          onClick={() => setShowLeftDrawer(true)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition