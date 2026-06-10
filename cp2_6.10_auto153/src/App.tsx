import { useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Dunes } from './components/Dunes';
import { Caravan, type CargoInfo } from './components/Caravan';
import { SandParticles } from './components/SandParticles';
import { useWind } from './hooks/useWind';

function Scene({ onCamelDoubleClick, onCamelHover }: {
  onCamelDoubleClick: (cargo: CargoInfo) => void;
  onCamelHover: (cargo: CargoInfo | null) => void;
}) {
  const wind = useWind(6);

  return (
    <>
      <Sky sunPosition={[100, 80, 100]} turbidity={2} rayleigh={0.5} />
      <fog attach="fog" args={['#d4c4a8', 40, 150]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#ffecd2', '#8b6b3a', 0.5]} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      <Dunes size={200} segments={128} />
      <Caravan count={6} onCamelDoubleClick={onCamelDoubleClick} onCamelHover={onCamelHover} />
      <SandParticles count={4000} wind={wind} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.2}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </>
  );
}

function CameraController() {
  const { camera } = useThree();
  useFrame(() => {
    camera.updateProjectionMatrix();
  });
  return null;
}

export default function App() {
  const [selectedCargo, setSelectedCargo] = useState<CargoInfo | null>(null);
  const [hoveredCargo, setHoveredCargo] = useState<CargoInfo | null>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCamelDoubleClick = (cargo: CargoInfo) => {
    setSelectedCargo(cargo);
  };

  const handleCamelHover = (cargo: CargoInfo | null) => {
    setHoveredCargo(cargo);
  };

  return (
    <div className="w-full h-screen bg-[#d4c4a8] relative overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [15, 12, 15], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#d4c4a8']} />
        <CameraController />
        <Scene onCamelDoubleClick={handleCamelDoubleClick} onCamelHover={handleCamelHover} />
      </Canvas>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute top-6 left-6"
        >
          <h1 className="text-4xl font-bold text-amber-900 drop-shadow-lg" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            丝路驼铃
          </h1>
          <p className="text-amber-800/70 text-sm mt-1">梦回千年·商队西行</p>
        </motion.div>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-6 right-6 text-right"
            >
              <p className="text-amber-900/60 text-sm">🖱️ 拖拽旋转 · 滚轮缩放 · 双击骆驼查看货物</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hoveredCargo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1/2 left-6 transform -translate-y-1/2 pointer-events-none"
            >
              <div
                className="px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm"
                style={{ backgroundColor: hoveredCargo.color + 'cc', color: '#fff' }}
              >
                <p className="font-medium">{hoveredCargo.name}</p>
                <p className="text-xs opacity-80">双击查看详情</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedCargo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto"
              onClick={() => setSelectedCargo(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-amber-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: selectedCargo.color }}
                  >
                    <span className="text-2xl text-white font-bold">
                      {selectedCargo.type === 'persian-silk' ? '锦' : selectedCargo.type === 'tea' ? '茶' : '瓷'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-amber-900 mb-2" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                      {selectedCargo.name}
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: selectedCargo.color }}>
                        {selectedCargo.type === 'persian-silk' ? '织物' : selectedCargo.type === 'tea' ? '饮品' : '器皿'}
                      </span>
                    </div>
                    <p className="text-amber-800/80 leading-relaxed">
                      {selectedCargo.description}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-amber-200 flex justify-between items-center">
                  <p className="text-xs text-amber-600">点击任意处关闭</p>
                  <button
                    onClick={() => setSelectedCargo(null)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-6 flex items-center gap-2 text-amber-900/40 text-xs">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span>60 FPS</span>
      </div>
    </div>
  );
}
