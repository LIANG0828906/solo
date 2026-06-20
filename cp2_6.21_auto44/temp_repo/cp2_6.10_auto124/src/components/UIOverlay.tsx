import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, BrushType } from '../store/useStore';
import { getStrokeData, BRUSH_CONFIG, STROKES_DATA } from '../utils/data';

const BRUSH_TYPES: { type: BrushType; name: string; description: string }[] = [
  { type: 'jianhao', name: '兼毫', description: '软硬适中' },
  { type: 'langhao', name: '狼毫', description: '刚劲有力' },
  { type: 'yanghao', name: '羊毫', description: '柔软丰腴' },
];

function BrushSelector() {
  const { brushType, setBrushType, canWrite } = useStore();

  return (
    <div className="mb-6">
      <h3 className="font-title text-lg mb-3 text-[#4a3b32]">笔类型</h3>
      <div className="flex gap-2">
        {BRUSH_TYPES.map((brush) => (
          <button
            key={brush.type}
            className={`btn-brush flex-1 flex flex-col items-center py-3 ${brushType === brush.type ? 'active' : ''}`}
            onClick={() => canWrite && setBrushType(brush.type)}
            disabled={!canWrite}
          >
            <span className="font-bold">{brush.name}</span>
            <span className="text-xs opacity-70">{brush.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreHistory() {
  const { scoreHistory, setCurrentStrokeIndex } = useStore();
  const reversedHistory = [...scoreHistory].reverse();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h3 className="font-title text-lg mb-3 text-[#4a3b32]">评分历史</h3>
      <div className="max-h-48 overflow-y-auto">
        {reversedHistory.length === 0 ? (
          <p className="text-center text-[#a0845c] opacity-60 py-4">暂无练习记录</p>
        ) : (
          reversedHistory.map((record, index) => (
            <motion.div
              key={`${record.timestamp}-${index}`}
              className="history-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setCurrentStrokeIndex(record.strokeIndex)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#4a3b32]">{record.strokeName}</span>
                  <span className="text-xs text-[#a0845c] ml-2">{formatTime(record.timestamp)}</span>
                </div>
                <span
                  className={`font-title text-xl ${
                    record.score >= 85 ? 'text-green-600' : record.score >= 60 ? 'text-[#a0845c]' : 'text-[#cc3333]'
                  }`}
                >
                  {record.score}
                </span>
              </div>
              <p className="text-sm text-[#6b5b4f] mt-1 line-clamp-1">{record.suggestion}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function OriginalTextDisplay() {
  const { isAnimating, currentStrokeIndex } = useStore();
  const [displayedText, setDisplayedText] = useState('');
  const strokeData = getStrokeData(currentStrokeIndex);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    const text = strokeData.originalText;
    let index = 0;

    const typewriter = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typewriter);
      }
    }, 150);

    return () => clearInterval(typewriter);
  }, [isAnimating, currentStrokeIndex, strokeData.originalText]);

  if (!isAnimating && displayedText === '') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="paper-texture px-8 py-4 max-w-lg text-center">
          <p className="typewriter-text font-title text-xl text-[#a0845c] leading-relaxed">
            {displayedText}
          </p>
          <p className="text-sm text-[#8b7355] mt-2">
            「{strokeData.name}」· {strokeData.description}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FlipCard() {
  const { showCardBack, setShowCardBack, currentScore, currentSuggestion, currentStrokeIndex, isAnimating } = useStore();
  const strokeData = getStrokeData(currentStrokeIndex);

  const handleClick = () => {
    if (currentScore !== null) {
      setShowCardBack(!showCardBack);
    }
  };

  return (
    <div className="perspective-1000">
      <motion.div
        className="relative w-full h-32 cursor-pointer"
        onClick={handleClick}
        animate={{ rotateY: showCardBack ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'ease-in-out' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute inset-0 paper-texture p-4 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center">
            <p className="font-title text-5xl text-[#1a1a1a] opacity-70">{strokeData.character}</p>
            <p className="text-sm text-[#a0845c] mt-1">
              {strokeData.name} · {strokeData.description}
            </p>
            {isAnimating && (
              <p className="text-xs text-[#8b7355] mt-2 animate-pulse">动画播放中...</p>
            )}
            {currentScore !== null && !showCardBack && (
              <p className="text-xs text-[#a0845c] mt-2">点击查看评分</p>
            )}
          </div>
        </div>

        <div
          className="absolute inset-0 paper-texture p-4 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {currentScore !== null ? (
            <div className="flex items-center gap-4">
              <div
                className="score-circle"
                style={{ '--score-percent': `${currentScore}%` } as React.CSSProperties}
              >
                <span>{currentScore}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#6b5b4f] line-clamp-2">{currentSuggestion}</p>
                <p className="text-xs text-[#a0845c] mt-2">点击返回范字</p>
              </div>
            </div>
          ) : (
            <p className="text-[#a0845c] text-center">完成临摹后显示评分</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function NavigationArrows() {
  const { currentStrokeIndex, nextStroke, prevStroke, isAnimating } = useStore();
  const strokeData = getStrokeData(currentStrokeIndex);

  return (
    <div className="flex items-center justify-center gap-4 my-4">
      <button
        className="btn-arrow"
        onClick={prevStroke}
        disabled={currentStrokeIndex === 0 || isAnimating}
      >
        ‹
      </button>
      <div className="text-center min-w-[120px]">
        <p className="font-title text-lg text-[#4a3b32]">
          {currentStrokeIndex + 1} / {STROKES_DATA.length}
        </p>
        <p className="text-xs text-[#a0845c]">{strokeData.description}</p>
      </div>
      <button
        className="btn-arrow"
        onClick={nextStroke}
        disabled={currentStrokeIndex === STROKES_DATA.length - 1 || isAnimating}
      >
        ›
      </button>
    </div>
  );
}

function StatusIndicator() {
  const { isAnimating, canWrite, isWriting } = useStore();

  if (isAnimating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="paper-texture px-6 py-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#b0a090] animate-pulse" />
          <span className="text-[#a0845c]">请先观察笔势意境...</span>
        </div>
      </motion.div>
    );
  }

  if (canWrite) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="paper-texture px-6 py-3 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWriting ? 'bg-[#cc3333] animate-pulse' : 'bg-[#5a8c5a]'}`} />
          <span className="text-[#a0845c]">
            {isWriting ? '正在书写...' : '可以开始临摹了'}
          </span>
        </div>
      </motion.div>
    );
  }

  return null;
}

function ControlPanel() {
  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-72 z-10 hidden md:block">
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="paper-texture p-6"
      >
        <h2 className="font-title text-2xl text-[#4a3b32] mb-4 text-center">墨池笔阵</h2>

        <NavigationArrows />
        <FlipCard />

        <div className="my-6 border-t border-[#d4c9b8]" />

        <BrushSelector />

        <div className="my-4 border-t border-[#d4c9b8]" />

        <ScoreHistory />
      </motion.div>
    </div>
  );
}

function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <motion.div
        initial={false}
        animate={{ y: isOpen ? 0 : 'calc(100% - 60px)' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-0 left-0 right-0 z-30 paper-texture rounded-t-2xl"
        style={{ height: '60%', borderRadius: '16px 16px 0 0' }}
      >
        <div
          className="flex items-center justify-center py-3 cursor-pointer border-b border-[#d4c9b8]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-12 h-1 rounded-full bg-[#d4c9b8]" />
        </div>

        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
          <NavigationArrows />
          <FlipCard />
          <div className="my-4 border-t border-[#d4c9b8]" />
          <BrushSelector />
          <div className="my-4 border-t border-[#d4c9b8]" />
          <ScoreHistory />
        </div>
      </motion.div>
    </div>
  );
}

function StrokeLegend() {
  const { currentStrokeIndex } = useStore();

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="paper-texture p-4"
      >
        <h3 className="font-title text-lg mb-3 text-[#4a3b32] text-center">七势</h3>
        <div className="space-y-2">
          {STROKES_DATA.map((stroke, index) => (
            <motion.div
              key={stroke.name}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                index === currentStrokeIndex
                  ? 'bg-[#a0845c] text-white'
                  : 'hover:bg-[#f5e6d3] text-[#6b5b4f]'
              }`}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                const { setCurrentStrokeIndex, isAnimating } = useStore.getState();
                if (!isAnimating) setCurrentStrokeIndex(index);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-title text-xl">{stroke.character}</span>
                <div>
                  <p className="text-sm font-bold">{stroke.name}</p>
                  <p className="text-xs opacity-70">{stroke.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function UIOverlay() {
  const { currentScore, deviationAreas } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="pointer-events-auto">
        <OriginalTextDisplay />
        <StatusIndicator />
        <ControlPanel />
        <MobileDrawer />
        <StrokeLegend />
      </div>

      <AnimatePresence>
        {currentScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="paper-texture px-8 py-6 text-center"
            >
              <p className="font-title text-sm text-[#a0845c] mb-2">本次评分</p>
              <div
                className="score-circle mx-auto mb-4"
                style={{ '--score-percent': `${currentScore}%` } as React.CSSProperties}
              >
                <span>{currentScore}</span>
              </div>
              {deviationAreas.length > 0 && (
                <p className="text-sm text-[#cc3333]">
                  发现 {deviationAreas.length} 处偏差，请留意朱砂红标记
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-10 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="paper-texture px-4 py-2"
        >
          <h1 className="font-title text-2xl text-[#4a3b32]">墨池笔阵 · 兰亭临摹</h1>
          <p className="text-xs text-[#a0845c]">鼠标滚轮缩放 · 拖动临摹</p>
        </motion.div>
      </div>
    </div>
  );
}
