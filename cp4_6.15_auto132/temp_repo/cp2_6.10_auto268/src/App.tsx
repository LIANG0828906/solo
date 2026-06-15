import { useEffect } from 'react';
import { OceanScene } from '@/scene/OceanScene';
import { ControlPanel } from '@/ui/ControlPanel';
import { TideLog } from '@/ui/TideLog';
import { useAudio } from '@/hooks/useAudio';

function App() {
  const { playTideSound } = useAudio();

  useEffect(() => {
    const timer = setTimeout(() => {
      playTideSound();
    }, 1000);
    return () => clearTimeout(timer);
  }, [playTideSound]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-deep-ocean">
      <div className="absolute inset-0 z-0">
        <OceanScene />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="font-display text-4xl text-wave-white tracking-[0.3em] drop-shadow-lg">
          潮汐回响
        </h1>
        <p className="font-body text-sm text-wave-white/60 mt-2 tracking-wider">
          TIDAL ECHO · 编织属于你的海洋旋律
        </p>
      </div>

      <ControlPanel />
      <TideLog />

      <div className="absolute top-6 right-6 z-10">
        <div className="backdrop-blur-xl bg-deep-ocean/40 border border-wave-white/10 rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-aqua-glow animate-pulse" />
          <span className="text-xs text-wave-white/60 font-body">
            60 FPS
          </span>
        </div>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <div className="backdrop-blur-xl bg-deep-ocean/40 border border-wave-white/10 rounded-2xl p-3">
          <div className="text-xs text-wave-white/60 font-body mb-1">操作提示</div>
          <div className="space-y-1 text-[11px] text-wave-white/40 font-body">
            <p>🖱️ 左键拖拽: 旋转视角</p>
            <p>🔍 滚轮: 缩放</p>
            <p>📍 点击海面: 放置浮标</p>
            <p>🎯 拖拽浮标: 调整位置</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
