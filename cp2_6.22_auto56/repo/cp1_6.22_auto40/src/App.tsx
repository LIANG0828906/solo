import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneEditor from '@/modules/SceneEditor';
import ViewAnalysis from '@/modules/ViewAnalysis';
import UIOverlay from '@/components/UIOverlay';
import { useSceneStore } from '@/store/useSceneStore';
import '@/styles/global.css';

export default function App() {
  const [occludedIds, setOccludedIds] = useState<Set<string>>(new Set());
  const currentSceneId = useSceneStore((s) => s.currentSceneId);
  const currentScene = useSceneStore((s) => s.getCurrentScene());

  const handleOcclusionUpdate = useCallback((ids: Set<string>) => {
    setOccludedIds(ids);
  }, []);

  if (!currentSceneId || !currentScene) {
    return (
      <div className="w-full h-screen bg-exhibit-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">3D虚拟展览空间布局模拟器</h1>
          <p className="text-gray-400 mb-8">请从右侧面板选择或创建一个场景开始</p>
          <div className="animate-pulse">
            <div className="w-16 h-16 mx-auto border-4 border-exhibit-highlight border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <UIOverlay />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-exhibit-bg relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          展览空间模拟器
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          当前场景: {currentScene.name}
        </p>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-exhibit-secondary/60 backdrop-blur-md rounded-xl px-6 py-2 border border-white/10">
          <p className="text-gray-300 text-sm">
            展品数量: <span className="text-white font-medium">{currentScene.exhibits.length}</span>
            {' | '}
            路径点数: <span className="text-white font-medium">{currentScene.path.length}</span>
          </p>
        </div>
      </div>

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [10, 8, 10], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => {
            useSceneStore.getState().setSelectedExhibitId(null);
          }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 20, 50]} />

          <SceneEditor occludedIds={occludedIds} />
          <ViewAnalysis onOcclusionUpdate={handleOcclusionUpdate} />
        </Canvas>
      </div>

      <UIOverlay />

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="bg-exhibit-secondary/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
          <p className="text-gray-400 text-xs space-y-1">
            <div>🖱️ 左键拖拽: 选择/移动展品</div>
            <div>🖱️ 右键拖拽: 旋转视角</div>
            <div>🖱️ 滚轮: 缩放视图</div>
          </p>
        </div>
      </div>
    </div>
  );
}
