import { useRef, useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { useWorkshopStore } from '@/store/workshopStore';
import { Calculus, ELEMENT_COLORS, ELEMENT_NAMES } from '@/types';
import { useAudio } from '@/hooks/useAudio';

interface CalculusCardProps {
  calculus: Calculus;
  onDragStart: (calculus: Calculus) => void;
  onDragEnd: () => void;
}

function CalculusCard({ calculus, onDragStart, onDragEnd }: CalculusCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const { playClickSound } = useAudio();

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(calculus);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', calculus.id);
    
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleMouseDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setShowDetails(true);
      playClickSound();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setShowDetails(false);
  };

  const color = ELEMENT_COLORS[calculus.element];
  const elementName = ELEMENT_NAMES[calculus.element];

  return (
    <div className="relative">
      <div
        className={`calculus-card bamboo-panel p-3 mb-3 ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-14 rounded flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ backgroundColor: color }}
          >
            {elementName}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#2b1e0e] truncate" style={{ fontFamily: 'var(--font-ancient)' }}>
              {calculus.name}
            </div>
            <div className="text-xs text-[#4a3a24] flex gap-2 flex-wrap mt-1">
              <span>坚{calculus.attributes.hardness}</span>
              <span>锐{calculus.attributes.sharpness}</span>
              <span>韵{calculus.attributes.resonance}</span>
            </div>
          </div>

          <button
            className="p-1 hover:bg-[#d4c19f] rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
              playClickSound();
            }}
          >
            <Info size={16} className="text-[#2b1e0e]" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="absolute left-full ml-2 top-0 z-50 scale-in bamboo-panel p-4 w-48">
          <div className="font-bold mb-2 text-[#c0392b]" style={{ fontFamily: 'var(--font-ancient)' }}>
            {calculus.name} 属性
          </div>
          <div className="space-y-2 text-sm">
            {[
              { key: 'hardness', name: '硬度' },
              { key: 'sharpness', name: '锋利度' },
              { key: 'resonance', name: '音律' },
              { key: 'durability', name: '耐久度' },
              { key: 'flexibility', name: '柔韧性' },
            ].map(({ key, name }) => (
              <div key={key}>
                <div className="flex justify-between text-[#2b1e0e] mb-1">
                  <span>{name}</span>
                  <span className="font-mono">{calculus.attributes[key as keyof typeof calculus.attributes]}</span>
                </div>
                <div className="attribute-bar">
                  <div
                    className="attribute-bar-fill"
                    style={{ width: `${calculus.attributes[key as keyof typeof calculus.attributes]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalculusStore() {
  const { availableCalculi, startDrag, endDrag, resetWorkshop, initCalculi } = useWorkshopStore();
  const { playClickSound } = useAudio();

  const groupedCalculi = availableCalculi.reduce((acc, calc) => {
    if (!acc[calc.element]) {
      acc[calc.element] = [];
    }
    acc[calc.element].push(calc);
    return acc;
  }, {} as Record<string, Calculus[]>);

  const elementOrder: Array<'wood' | 'fire' | 'earth' | 'metal' | 'water'> = ['wood', 'fire', 'earth', 'metal', 'water'];

  return (
    <div className="h-full flex flex-col bamboo-panel m-2 overflow-hidden">
      <div className="p-4 border-b-2 border-[#2b1e0e]">
        <h2 className="ancient-title text-xl text-center">算筹仓库</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {elementOrder.map((element) => {
          const calculi = groupedCalculi[element] || [];
          if (calculi.length === 0) return null;

          return (
            <div key={element} className="fade-in">
              <div
                className="text-sm font-bold mb-2 px-2 py-1 rounded"
                style={{
                  backgroundColor: ELEMENT_COLORS[element] + '30',
                  color: ELEMENT_COLORS[element],
                  fontFamily: 'var(--font-ancient)',
                }}
              >
                {ELEMENT_NAMES[element]}属 · {calculi.length}枚
              </div>
              {calculi.map((calculus) => (
                <CalculusCard
                  key={calculus.id}
                  calculus={calculus}
                  onDragStart={startDrag}
                  onDragEnd={endDrag}
                />
              ))}
            </div>
          );
        })}

        {availableCalculi.length === 0 && (
          <div className="text-center text-[#4a3a24] py-8">
            <div className="text-4xl mb-2">📜</div>
            <div>算筹已全部投放</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t-2 border-[#2b1e0e] space-y-2">
        <button
          className="bamboo-btn w-full flex items-center justify-center gap-2"
          onClick={() => {
            resetWorkshop();
            initCalculi();
            playClickSound();
          }}
        >
          <RotateCcw size={16} />
          <span>重置工坊</span>
        </button>
      </div>
    </div>
  );
}
