import React from 'react';
import GalleryCanvas from './components/GalleryCanvas';
import ControlBar from './components/ControlBar';
import ArtworkModal from './components/ArtworkModal';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-full">
      <GalleryCanvas />
      <ControlBar />
      <ArtworkModal />
      <div
        className="fixed bottom-4 left-4 text-xs text-gray-500 z-30 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg"
      >
        <p>WASD 移动 | Shift 加速 | 鼠标拖拽 旋转视角 | C 重置视角</p>
      </div>
    </div>
  );
};

export default App;
