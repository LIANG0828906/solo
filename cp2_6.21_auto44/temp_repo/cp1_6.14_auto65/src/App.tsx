import { useEffect, useState } from 'react';
import { SceneContainer } from './scene/SceneContainer';
import { ControlPanel } from './ui/ControlPanel';
import { InfoPanel } from './ui/InfoPanel';
import { usePhysicsStore } from './store/usePhysicsStore';
import { generateRandomColor } from './utils/hsl';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const addBody = usePhysicsStore((s) => s.addBody);
  const isReplaying = usePhysicsStore((s) => s.isReplaying);
  const isRecording = usePhysicsStore((s) => s.isRecording);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      const defaultBodies: {
        type: 'box' | 'sphere' | 'cylinder';
        pos: [number, number, number];
        mass: number;
        restitution: number;
      }[] = [
        { type: 'sphere', pos: [-2.5, 6, 0], mass: 1.5, restitution: 0.8 },
        { type: 'box', pos: [0, 7, -1], mass: 1, restitution: 0.6 },
        { type: 'cylinder', pos: [2.5, 6.5, 1], mass: 2, restitution: 0.5 },
      ];

      defaultBodies.forEach((b, i) => {
        setTimeout(() => {
          addBody(
            b.type,
            [b.pos[0], b.pos[1], b.pos[2]],
            b.mass,
            b.restitution,
            generateRandomColor()
          );
        }, i * 300);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [addBody]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: isLoading ? 0 : 1,
        }}
      >
        <SceneContainer />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0e27] via-[#1a0a2e] to-[#0f0820] z-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-2 border-t-cyan-400 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">3D物理沙盒正在加载</h2>
            <p className="text-cyan-400/60 text-sm font-mono-sans">
              Initializing Physics Engine...
            </p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <InfoPanel />
          <ControlPanel />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isRecording && (
              <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">录制中</span>
              </div>
            )}
            {isReplaying && (
              <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">回放中</span>
              </div>
            )}
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-xl text-xs text-center">
            <p className="text-cyan-300/70">
              <span className="text-cyan-400 font-medium">左键拖拽</span> 旋转视角 ·
              <span className="text-cyan-400 font-medium ml-1">右键拖拽</span> 平移 ·
              <span className="text-cyan-400 font-medium ml-1">滚轮</span> 缩放 ·
              <span className="text-cyan-400 font-medium ml-1">点击物体</span> 查看参数
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
