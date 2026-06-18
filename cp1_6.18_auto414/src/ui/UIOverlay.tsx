import { useEffect, useState } from 'react';
import { Check, RotateCcw, Sparkles, Target } from 'lucide-react';
import { useGameStore, type Fragment } from '@/stores/gameStore';

function FragmentThumbnail({ fragment, isSelected }: { fragment: Fragment; isSelected: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-[#00FFAA]/15 border border-[#00FFAA]/50'
          : 'bg-white/5 border border-transparent hover:bg-white/10'
      }`}
      style={{
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative flex-shrink-0 rounded-lg border-2 overflow-hidden"
        style={{
          width: 48,
          height: 48,
          borderColor: fragment.isMatched ? '#00FFAA' : '#3A3A4E',
          background: fragment.isMatched
            ? `linear-gradient(135deg, ${fragment.color} 0%, ${fragment.color}cc 100%)`
            : `linear-gradient(135deg, ${fragment.color}55 0%, ${fragment.color}33 100%)`,
          opacity: fragment.isMatched ? 1 : 0.5,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${fragment.isMatched ? 0.3 : 0.15}) 0%, transparent 60%)`,
          }}
        />
        {fragment.isMatched && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-[#00FFAA] rounded-bl-lg flex items-center justify-center">
            <Check size={10} strokeWidth={3} color="#0B0E1A" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs truncate font-medium"
          style={{
            color: fragment.isMatched ? '#E0E0FF' : '#888899',
          }}
        >
          {fragment.name}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: '#666677' }}>
          {fragment.isMatched ? `匹配度 ${fragment.matchScore}%` : '未匹配'}
        </div>
      </div>
    </div>
  );
}

function FloatingScore() {
  const { floatingScores, removeFloatingScore } = useGameStore();

  return (
    <>
      {floatingScores.map((score) => (
        <div
          key={score.id}
          className="fixed pointer-events-none z-50 font-bold"
          style={{
            left: score.x,
            top: score.y,
            color: '#FFD700',
            fontSize: '24px',
            textShadow: '0 0 10px #FFD700, 0 0 20px #FF8C00',
            animation: 'floatUp 1.5s ease-out forwards',
            transform: 'translate(-50%, -50%)',
          }}
          onAnimationEnd={() => removeFloatingScore(score.id)}
        >
          +{score.value}分
        </div>
      ))}
    </>
  );
}

function CompleteCard() {
  const { isComplete, totalScore, showCompleteCard, resetAll } = useGameStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showCompleteCard) {
      setTimeout(() => setVisible(true), 100);
    } else {
      setVisible(false);
    }
  }, [showCompleteCard]);

  if (!isComplete || !showCompleteCard) return null;

  const percentageScore = Math.min(100, Math.round((totalScore / (8 * 100)) * 100));

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
      style={{
        background: visible ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
        transition: 'background 0.5s ease',
      }}
    >
      <div
        className="pointer-events-auto"
        style={{
          background: '#1A1A2E',
          border: '2px solid #FFD700',
          borderRadius: 12,
          padding: '40px 60px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.3), inset 0 0 40px rgba(255, 215, 0, 0.05)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(30px)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="flex justify-center mb-4">
          <Sparkles size={48} color="#FFD700" strokeWidth={1.5} />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            color: '#FFD700',
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}
        >
          拼合完成！
        </h2>
        <p className="text-sm mb-6" style={{ color: '#888899' }}>
          所有文物碎片已成功拼合
        </p>
        <div className="mb-8">
          <div className="text-xs mb-2" style={{ color: '#666677' }}>
            匹配度总分
          </div>
          <div
            className="text-5xl font-bold"
            style={{
              color: '#FFD700',
              textShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
            }}
          >
            {percentageScore}
            <span className="text-2xl ml-1">分</span>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="px-8 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #2A2A3E 0%, #3A3A4E 100%)',
            color: '#E0E0FF',
            border: '1px solid #FFFFFF20',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3A3A4E 0%, #4A4A5E 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2A2A3E 0%, #3A3A4E 100%)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4A4A5E 0%, #5A5A6E 100%)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3A3A4E 0%, #4A4A5E 100%)';
          }}
        >
          <RotateCcw size={16} />
          重新开始
        </button>
      </div>
    </div>
  );
}

export function UIOverlay() {
  const { fragments, selectedId, progress, totalScore, resetView, autoAlign } = useGameStore();

  return (
    <>
      <div
        className="fixed top-4 left-4 bottom-4 flex flex-col z-20 pointer-events-auto"
        style={{
          width: 280,
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 20,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="mb-5">
          <h1
            className="text-lg font-bold mb-1"
            style={{
              color: '#E0E0FF',
              letterSpacing: '1px',
            }}
          >
            文物拼合台
          </h1>
          <p className="text-xs" style={{ color: '#666677' }}>
            3D交互式文物碎片拼合系统
          </p>
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs flex items-center gap-1.5" style={{ color: '#888899' }}>
              <Target size={12} />
              拼合进度
            </span>
            <span className="text-xs font-bold" style={{ color: '#4ECDC4' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: '#1E2238' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)',
                boxShadow: '0 0 10px rgba(78, 205, 196, 0.4)',
              }}
            />
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <span className="text-xs" style={{ color: '#888899' }}>匹配度总分</span>
          <span className="text-lg font-bold" style={{ color: '#FFD700' }}>{totalScore}</span>
        </div>

        <div className="text-xs mb-2 font-medium" style={{ color: '#888899' }}>
          碎片列表
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
          {fragments.map((f) => (
            <FragmentThumbnail key={f.id} fragment={f} isSelected={selectedId === f.id} />
          ))}
        </div>

        <div className="mt-4 space-y-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={autoAlign}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: '#2A2A3E',
              color: '#E0E0FF',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3A3A4E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2A2A3E';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = '#4A4A5E';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = '#3A3A4E';
            }}
          >
            <Sparkles size={14} />
            自动对齐
          </button>
          <button
            onClick={resetView}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: '#2A2A3E',
              color: '#E0E0FF',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3A3A4E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2A2A3E';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = '#4A4A5E';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = '#3A3A4E';
            }}
          >
            <RotateCcw size={14} />
            重置视角
          </button>
        </div>
      </div>

      <div
        className="fixed bottom-4 left-1/2 z-20 pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '8px 16px',
        }}
      >
        <div className="text-xs" style={{ color: '#666677' }}>
          <span style={{ color: '#888899' }}>左键拖拽</span> 移动 ·{' '}
          <span style={{ color: '#888899' }}>Shift+拖拽</span> 旋转 ·{' '}
          <span style={{ color: '#888899' }}>右键</span> 视角 ·{' '}
          <span style={{ color: '#888899' }}>滚轮</span> 缩放
        </div>
      </div>

      <FloatingScore />
      <CompleteCard />
    </>
  );
}
