import { useEffect, useRef, useState } from 'react';
import Card from './Card';
import { useCardStore } from '@/store/cards';
import { Move, Wand2, ImageIcon } from 'lucide-react';

export default function EditorPanel() {
  const cards = useCardStore((s) => s.cards);
  const reorderCards = useCardStore((s) => s.reorderCards);
  const isExporting = useCardStore((s) => s.isExporting);
  const currentExportIndex = useCardStore((s) => s.currentExportIndex);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onPointerDown = (idx: number, e: React.MouseEvent | React.TouchEvent) => {
    if (isExporting) return;
    setDragIdx(idx);
    setIsDragging(true);
    const pos = 'touches' in e ? e.touches[0] : e;
    setPointer({ x: pos.clientX, y: pos.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const pos = 'touches' in e ? e.touches[0] : e;
      setPointer({ x: pos.clientX, y: pos.clientY });
      if (listRef.current && dragIdx !== null) {
        const scrollLeft = listRef.current.scrollLeft;
        const x = pos.clientX - listRef.current.getBoundingClientRect().left + scrollLeft;
        let found: number | null = null;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const left = el.offsetLeft - scrollLeft;
          const right = left + el.offsetWidth;
          const relX = x - scrollLeft + 0;
          const center = left + el.offsetWidth / 2;
          if (Math.abs(relX - (left + el.offsetWidth / 2)) < el.offsetWidth) {
            if (found === null || Math.abs(relX - center) < Math.abs(relX - (left + cardRefs.current[found]!.offsetWidth / 2))) {
              found = i;
            }
          }
        });
        if (found !== null && found !== overIdx && found !== dragIdx) {
          setOverIdx(found);
        }
      }
    };

    const handleUp = () => {
      if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
        reorderCards(dragIdx, overIdx);
      }
      setDragIdx(null);
      setOverIdx(null);
      setIsDragging(false);
      setPointer(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragIdx, overIdx, reorderCards]);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(212,175,55,0.12))',
          }}
        >
          <Wand2 size={40} style={{ color: '#6c63ff' }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#444' }}>还没有生成卡片</h3>
        <p className="text-sm max-w-xs mb-6" style={{ color: '#888', lineHeight: 1.7 }}>
          在右侧面板输入关键词，选择主题模板与卡片数量，点击「生成」按钮即可自动创建卡片
        </p>
        <div className="flex flex-wrap gap-3 justify-center max-w-md">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: '#fff' }}>
            <Move size={14} style={{ color: '#6c63ff' }} />
            <span style={{ color: '#555' }}>拖拽排序</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: '#fff' }}>
            <ImageIcon size={14} style={{ color: '#d4af37' }} />
            <span style={{ color: '#555' }}>图文编辑</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: '#fff' }}>
            <Wand2 size={14} style={{ color: '#ff7043' }} />
            <span style={{ color: '#555' }}>批量导出</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {isDragging && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            left: pointer ? pointer.x - 120 : -9999,
            top: pointer ? pointer.y - 160 : -9999,
            transform: 'rotate(-3deg) scale(0.95)',
            transition: 'transform 0.08s ease-out',
          }}
        >
          {dragIdx !== null && cards[dragIdx] && (
            <Card
              card={cards[dragIdx]}
              index={dragIdx}
              isExporting={false}
              isCurrentExport={false}
              exportIndex={-1}
              dragging
            />
          )}
        </div>
      )}

      <div
        ref={listRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ padding: '24px 20px 32px 24px' }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            minHeight: '100%',
            position: 'relative',
          }}
        >
          {cards.map((card, idx) => (
            <div
              key={card.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              onMouseDown={(e) => onPointerDown(idx, e)}
              onTouchStart={(e) => onPointerDown(idx, e)}
              style={{
                flexShrink: 0,
                position: 'relative',
                opacity: dragIdx === idx && isDragging ? 0.3 : 1,
                animationDelay: `${Math.min(idx * 40, 400)}ms`,
                touchAction: 'none',
              }}
            >
              <Card
                card={card}
                index={idx}
                isExporting={isExporting}
                isCurrentExport={currentExportIndex === idx}
                exportIndex={idx}
                dragOver={overIdx === idx && dragIdx !== idx}
              />
              <div
                className="absolute -top-2 -right-2 z-[1] w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: '#6c63ff',
                  boxShadow: '0 2px 6px rgba(108,99,255,0.4)',
                }}
              >
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {cards.length > 0 && (
        <div className="absolute top-3 right-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#888' }}>
          <Move size={12} />
          <span>拖拽卡片可调整顺序</span>
        </div>
      )}
    </div>
  );
}
