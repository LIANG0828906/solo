import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import Scene from '@/components/Scene';
import UIPanel from '@/components/UIPanel';
import { useStore } from '@/store';
import { generateHeightMap, getTerrainHeight } from '@/simulator';
import { Wind } from 'lucide-react';

export default function Home() {
  const terrainAmplitude = useStore((state) => state.terrainAmplitude);
  const addTurbine = useStore((state) => state.addTurbine);
  const turbines = useStore((state) => state.turbines);
  const maxTurbines = useStore((state) => state.maxTurbines);

  const heightMap = useMemo(() => {
    return generateHeightMap(101, terrainAmplitude);
  }, [terrainAmplitude]);

  const handleTerrainClick = useCallback(
    (point: THREE.Vector3) => {
      if (turbines.length >= maxTurbines) return;

      const x = Math.max(-95, Math.min(95, point.x));
      const z = Math.max(-95, Math.min(95, point.z));
      const y = getTerrainHeight(heightMap, x, z) + 0.1;

      for (const turbine of turbines) {
        const dx = x - turbine.position[0];
        const dz = z - turbine.position[2];
        if (Math.sqrt(dx * dx + dz * dz) < 15) {
          return;
        }
      }

      addTurbine([x, y, z]);
    },
    [addTurbine, heightMap, turbines, maxTurbines]
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#121212' }}>
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-6 py-4"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,18,0.9) 0%, rgba(18,18,18,0) 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)' }}
          >
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-[14px] font-semibold leading-tight">
              山谷风电布局优化模拟器
            </h1>
            <p className="text-gray-400 text-[10px] leading-tight">
              Wind Farm Layout Optimizer
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-400">
          已放置 <span className="text-green-400 font-semibold">{turbines.length}</span> / {maxTurbines} 台风机
        </div>
      </div>

      <div className="flex-1 flex relative" style={{ minHeight: '600px' }}>
        <div className="relative" style={{ width: '70%' }}>
          <Scene heightMap={heightMap} onTerrainClick={handleTerrainClick} />

          <div
            className="absolute bottom-4 left-4 z-10 text-xs text-gray-400 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(30, 30, 30, 0.7)' }}
          >
            <p>🖱️ 左键拖拽旋转视角 | 滚轮缩放 | 点击地形放置风机 | 拖拽风机调整位置</p>
          </div>
        </div>

        <div style={{ width: '30%', minWidth: '320px' }}>
          <UIPanel heightMap={heightMap} />
        </div>
      </div>
    </div>
  );
}
