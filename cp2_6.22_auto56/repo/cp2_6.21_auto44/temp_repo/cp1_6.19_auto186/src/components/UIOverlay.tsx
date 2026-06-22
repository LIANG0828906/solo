import { useState, useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { MATERIALS } from '../utils/materials';
import { MaterialType, GeometryType } from '../types';
import { Radio, RotateCcw, Square, Circle, Triangle } from 'lucide-react';

const UIOverlay = () => {
  const simulateRays = useSceneStore((state) => state.simulateRays);
  const resetScene = useSceneStore((state) => state.resetScene);
  const selectedId = useSceneStore((state) => state.selectedId);
  const geometries = useSceneStore((state) => state.geometries);
  const activeMaterial = useSceneStore((state) => state.activeMaterial);
  const activeGeometryType = useSceneStore((state) => state.activeGeometryType);
  const setActiveMaterial = useSceneStore((state) => state.setActiveMaterial);
  const setActiveGeometryType = useSceneStore((state) => state.setActiveGeometryType);
  const addGeometry = useSceneStore((state) => state.addGeometry);
  const rt60Data = useSceneStore((state) => state.rt60Data);
  const rayPaths = useSceneStore((state) => state.rayPaths);
  const showPanel = useSceneStore((state) => state.showPanel);
  const setShowPanel = useSceneStore((state) => state.setShowPanel);
  const isSimulating = useSceneStore((state) => state.isSimulating);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedGeometry = geometries.find((g) => g.id === selectedId);

  const handleAddGeometry = () => {
    const newGeo = {
      type: activeGeometryType,
      position: { x: (Math.random() - 0.5) * 6, y: 1, z: (Math.random() - 0.5) * 6 },
      rotation: { x: 0, y: Math.random() * Math.PI, z: 0 },
      size: { x: 2, y: 2, z: 0.3 },
      material: activeMaterial,
    };

    if (activeGeometryType === 'cylinder') {
      newGeo.size = { x: 1, y: 2, z: 1 };
    } else if (activeGeometryType === 'wedge') {
      newGeo.size = { x: 1.5, y: 2, z: 1.5 };
    }

    addGeometry(newGeo);
  };

  const materialOptions = Object.entries(MATERIALS).map(([key, value]) => ({
    value: key as MaterialType,
    label: value.name,
    color: value.color,
  }));

  const geometryOptions: { value: GeometryType; label: string; icon: React.ReactNode }[] = [
    { value: 'wall', label: '墙体', icon: <Square size={16} /> },
    { value: 'cylinder', label: '圆柱', icon: <Circle size={16} /> },
    { value: 'wedge', label: '斜顶', icon: <Triangle size={16} /> },
  ];

  const validPathCount = rayPaths.filter((p) => p.isValid).length;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-12 bg-[#2A2A2A] flex items-center px-4 z-50 border-b border-[#3A3A3A]"
        style={{ transition: 'all 0.2s ease-in-out' }}
      >
        <div className="flex items-center gap-2 mr-6">
          <span className="text-white font-medium text-sm">声学模拟器</span>
        </div>

        <div className="flex items-center gap-1 mr-4">
          {geometryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveGeometryType(opt.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs whitespace-nowrap transition-all duration-200 ${
                activeGeometryType === opt.value
                  ? 'bg-[#3A3A3A] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleAddGeometry}
          className="px-3 py-1.5 bg-[#3A3A3A] text-white rounded text-xs whitespace-nowrap hover:bg-[#4A4A4A] transition-all duration-200 mr-4"
        >
          添加几何体
        </button>

        <div className="flex items-center gap-2 mr-4">
          <span className="text-gray-400 text-xs">材质:</span>
          <div className="flex gap-1">
            {materialOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveMaterial(opt.value)}
                className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                  activeMaterial === opt.value
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-gray-500'
                }`}
                style={{ backgroundColor: opt.color }}
                title={opt.label}
              />
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={simulateRays}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm whitespace-nowrap transition-all duration-200 ${
            isSimulating
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#FF6B35] text-white hover:bg-[#FF8B55]'
          }`}
        >
          <Radio size={16} />
          发射声线
        </button>

        <button
          onClick={resetScene}
          className="flex items-center gap-2 px-3 py-1.5 ml-2 text-gray-400 hover:text-white hover:bg-[#3A3A3A] rounded whitespace-nowrap transition-all duration-200"
        >
          <RotateCcw size={16} />
          重置场景
        </button>

        {isMobile && (
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="ml-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#3A3A3A] rounded transition-all duration-200"
          >
            {showPanel ? '隐藏面板' : '显示面板'}
          </button>
        )}
      </div>

      <div
        className={`fixed left-4 bottom-4 w-60 bg-[#2A2A2A] bg-opacity-90 rounded-lg p-4 z-40 border border-[#3A3A3A] ${
          isMobile && !showPanel ? 'hidden' : ''
        }`}
        style={{ transition: 'all 0.2s ease-in-out' }}
      >
        <h3 className="text-white text-sm font-medium mb-3">场景信息</h3>
        
        <div className="space-y-3">
          <div>
            <div className="text-gray-400 text-xs mb-1">选中物体</div>
            <div className="text-white text-sm">
              {selectedGeometry
                ? `${MATERIALS[selectedGeometry.material].name} ${
                    selectedGeometry.type === 'wall'
                      ? '墙体'
                      : selectedGeometry.type === 'cylinder'
                      ? '圆柱'
                      : '斜顶'
                  }`
                : '未选中'}
            </div>
          </div>

          {selectedGeometry && (
            <div>
              <div className="text-gray-400 text-xs mb-1">位置</div>
              <div className="text-white text-xs font-mono">
                X: {selectedGeometry.position.x.toFixed(2)} Y: {selectedGeometry.position.y.toFixed(2)} Z: {selectedGeometry.position.z.toFixed(2)}
              </div>
            </div>
          )}

          <div className="border-t border-[#3A3A3A] pt-3">
            <div className="text-gray-400 text-xs mb-2">RT60 混响时间</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#FF6B6B]">125Hz</span>
                <span className="text-white font-mono">{rt60Data.low.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#4ECDC4]">500Hz</span>
                <span className="text-white font-mono">{rt60Data.mid.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#45B7D1]">2000Hz</span>
                <span className="text-white font-mono">{rt60Data.high.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3A3A3A] pt-3">
            <div className="text-gray-400 text-xs mb-2">有效声线路径</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-white text-2xl font-bold">{validPathCount}</span>
              <span className="text-gray-500 text-xs">/ {rayPaths.length} 条射线</span>
            </div>
            
            {validPathCount > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {rayPaths
                  .filter((p) => p.isValid)
                  .slice(0, 5)
                  .map((path, idx) => (
                    <div
                      key={path.id}
                      className="text-xs bg-[#1a1a1a] rounded p-2"
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-400">路径 {idx + 1}</span>
                        <span className="text-[#4ECDC4]">
                          接收点 {path.receiverIndex !== undefined ? path.receiverIndex + 1 : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">长度</span>
                        <span className="text-white font-mono">{path.totalLength.toFixed(2)} 单位</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">能量损失</span>
                        <span className="text-[#FF6B6B] font-mono">{path.energyLoss.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">反射次数</span>
                        <span className="text-white font-mono">{path.reflections}</span>
                      </div>
                    </div>
                  ))}
                {validPathCount > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    还有 {validPathCount - 5} 条路径...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-[#3A3A3A] pt-3">
            <div className="text-gray-400 text-xs mb-1">几何体数量</div>
            <div className="text-white text-lg">{geometries.length}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UIOverlay;
