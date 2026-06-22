import { useEffect, useMemo, useState, useRef } from 'react';
import { useHiveStore } from '@/store';
import { calculateHoneycombLayout, hexagonPoints, getResponsiveSideLength } from '@/utils/honeycombLayout';
import { Edit3, Trash2 } from 'lucide-react';
import type { Card } from '@/types';

function HexagonCard({
  card,
  cx,
  cy,
  r,
  relationCount,
  onEdit,
  onDelete,
}: {
  card: Card;
  cx: number;
  cy: number;
  r: number;
  relationCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const id = `hex-clip-${card.id.slice(0, 8)}`;
  const displayR = hovered ? r * 1.2 : r;
  const rotation = hovered ? 3 : 0;
  const contentMaxW = r * 1.55;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
      style={{
        cursor: 'pointer',
        transformOrigin: `${cx}px ${cy}px`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <defs>
        <clipPath id={id}>
          <polygon points={hexagonPoints(cx, cy, displayR - 3)} />
        </clipPath>
      </defs>

      <polygon
        points={hexagonPoints(cx, cy, displayR)}
        fill="#FFFFFF"
        stroke="#E0D5C1"
        strokeWidth={2}
        style={{
          transition: 'all 0.3s ease',
          filter: hovered
            ? 'drop-shadow(0 12px 24px rgba(139,69,19,0.2))'
            : 'drop-shadow(0 4px 10px rgba(139,69,19,0.08))',
        }}
      />

      {card.tags.length > 0 && card.tags[0] && (
        <polygon
          points={hexagonPoints(cx, cy, displayR)}
          fill="url(#none)"
          stroke={getTagColor(card.tags[0])}
          strokeWidth={hovered ? 3 : 1.5}
          opacity={hovered ? 0.8 : 0.4}
          style={{ transition: 'all 0.3s ease' }}
        />
      )}

      <g clipPath={`url(#${id})`} style={{ pointerEvents: 'none' }}>
        <foreignObject x={cx - contentMaxW / 2} y={cy - r * 0.85} width={contentMaxW} height={r * 1.7}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 8px',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"Noto Serif SC", serif',
                fontWeight: 700,
                color: '#3E2723',
                fontSize: Math.max(10, Math.min(14, r * 0.13)),
                lineHeight: 1.3,
                marginBottom: r * 0.08,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: '#6D4C41',
                fontSize: Math.max(8, Math.min(10, r * 0.09)),
                lineHeight: 1.5,
                opacity: 0.75,
                display: '-webkit-box',
                WebkitLineClamp: hovered ? 5 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                wordBreak: 'break-word',
              }}
            >
              {card.content}
            </div>
            {hovered && card.tags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '3px',
                  justifyContent: 'center',
                  marginTop: r * 0.08,
                }}
              >
                {card.tags.slice(0, 3).map(t => (
                  <span
                    key={t}
                    style={{
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: Math.max(7, r * 0.08),
                      color: '#5D4037',
                      background: 'linear-gradient(135deg, #FAD7A1, #F0B27A)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </foreignObject>
      </g>

      {relationCount > 0 && (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={cx + r * 0.75}
            cy={cy + r * 0.65}
            r={Math.max(10, r * 0.2)}
            fill="#E67E22"
            style={{ transition: 'all 0.3s ease' }}
          />
          <text
            x={cx + r * 0.75}
            y={cy + r * 0.65 + Math.max(3, r * 0.07)}
            textAnchor="middle"
            fill="#FFF"
            fontSize={Math.max(9, r * 0.16)}
            fontWeight={700}
            fontFamily='"Noto Sans SC", sans-serif'
          >
            {relationCount}
          </text>
        </g>
      )}

      {hovered && (
        <g>
          <g
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={cx - r * 0.75}
              cy={cy - r * 0.65}
              r={14}
              fill="#FFF"
              stroke="#E74C3C"
              strokeWidth={1.5}
            />
            <foreignObject x={cx - r * 0.75 - 8} y={cy - r * 0.65 - 8} width={16} height={16}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#E74C3C' }}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 size={11} />
              </div>
            </foreignObject>
          </g>
          <g
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={cx + r * 0.75}
              cy={cy - r * 0.65}
              r={14}
              fill="#FFF"
              stroke="#E67E22"
              strokeWidth={1.5}
            />
            <foreignObject x={cx + r * 0.75 - 8} y={cy - r * 0.65 - 8} width={16} height={16}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#E67E22' }}
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Edit3 size={11} />
              </div>
            </foreignObject>
          </g>
        </g>
      )}
    </g>
  );
}

function getTagColor(tag: string): string {
  const map: Record<string, string> = {
    '写作': '#E67E22', '小说': '#E67E22', '散文': '#E67E22',
    '设计': '#3498DB', 'UI': '#3498DB', '配色': '#3498DB', '排版': '#3498DB',
    '策划': '#2ECC71', '活动': '#2ECC71', '运营': '#2ECC71', '品牌': '#9B59B6',
  };
  return map[tag] || '#9B59B6';
}

export function CardGrid() {
  const { cards, openEditPanel, deleteCard, cardRelationCounts } = useHiveStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const side = getResponsiveSideLength(size.w);
  const positions = useMemo(
    () => calculateHoneycombLayout(cards.length, size.w, size.h, side),
    [cards.length, size.w, size.h, side]
  );

  const svgW = Math.max(size.w, 800);
  const svgH = Math.max(size.h, 600);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto">
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <pattern id="honeycomb-bg" x="0" y="0" width="104" height="90" patternUnits="userSpaceOnUse">
            <polygon
              points={hexagonPoints(52, 45, 28)}
              fill="none"
              stroke="#E8DCC8"
              strokeWidth="0.8"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#honeycomb-bg)" />

        {cards.map((card, i) => {
          const pos = positions[i];
          if (!pos) return null;
          return (
            <HexagonCard
              key={card.id}
              card={card}
              cx={pos.x}
              cy={pos.y}
              r={side}
              relationCount={cardRelationCounts[card.id] || 0}
              onEdit={() => openEditPanel(card)}
              onDelete={() => {
                if (confirm(`确定删除「${card.title}」？`)) {
                  fetch(`/api/cards/${card.id}`, { method: 'DELETE' }).then(() => deleteCard(card.id));
                }
              }}
            />
          );
        })}

        {cards.length === 0 && (
          <g>
            <polygon
              points={hexagonPoints(svgW / 2, svgH / 2 - 40, 60)}
              fill="none"
              stroke="#E0D5C1"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <text
              x={svgW / 2}
              y={svgH / 2 + 60}
              textAnchor="middle"
              fill="#A1887F"
              fontSize="18"
              fontFamily='"Noto Serif SC", serif'
            >
              蜂巢还空着，点击右上角「+」记录第一份灵感吧
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
