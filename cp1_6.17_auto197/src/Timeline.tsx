import { useMemo, useRef, useState } from 'react';
import { useTimelineStore } from './store';
import { CreativeCard, SortType } from './types';
import Card from './Card';

function sortCards(cards: CreativeCard[], sortType: SortType): CreativeCard[] {
  const sorted = [...cards];
  switch (sortType) {
    case 'newest':
      sorted.sort((a, b) => {
        if (a.createdAt === b.createdAt) return a.order - b.order;
        return b.createdAt.localeCompare(a.createdAt);
      });
      break;
    case 'oldest':
      sorted.sort((a, b) => {
        if (a.createdAt === b.createdAt) return a.order - b.order;
        return a.createdAt.localeCompare(b.createdAt);
      });
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
      break;
  }
  return sorted;
}

function getYearNodeColor(year: number, minYear: number, maxYear: number): string {
  if (minYear === maxYear) return '#9B72AA';
  const ratio = (year - minYear) / (maxYear - minYear);
  const startR = 155, startG = 114, startB = 170;
  const endR = 224, endG = 170, endB = 255;
  const r = Math.round(startR + (endR - startR) * ratio);
  const g = Math.round(startG + (endG - startG) * ratio);
  const b = Math.round(startB + (endB - startB) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function Timeline() {
  const cards = useTimelineStore((state) => state.cards);
  const filteredTypes = useTimelineStore((state) => state.filteredTypes);
  const sortType = useTimelineStore((state) => state.sortType);
  const expandedYears = useTimelineStore((state) => state.expandedYears);
  const toggleYear = useTimelineStore((state) => state.toggleYear);
  const reorderCards = useTimelineStore((state) => state.reorderCards);

  const [dragState, setDragState] = useState<{
    year: number;
    cardId: string;
    fromIndex: number;
    overIndex: number;
  } | null>(null);

  const bounceRefs = useRef<Set<string>>(new Set());

  const { yearsData, minYear, maxYear } = useMemo(() => {
    let filtered = cards;
    if (filteredTypes.length > 0) {
      filtered = cards.filter((c) => filteredTypes.includes(c.type));
    }

    const yearMap = new Map<number, CreativeCard[]>();
    for (const card of filtered) {
      if (!yearMap.has(card.year)) yearMap.set(card.year, []);
      yearMap.get(card.year)!.push(card);
    }

    const years: { year: number; cards: CreativeCard[] }[] = [];
    for (const [year, yearCards] of yearMap.entries()) {
      years.push({ year, cards: sortCards(yearCards, sortType) });
    }
    years.sort((a, b) => a.year - b.year);

    const allYears = Array.from(yearMap.keys());
    const min = allYears.length > 0 ? Math.min(...allYears) : 2020;
    const max = allYears.length > 0 ? Math.max(...allYears) : 2024;

    return { yearsData: years, minYear: min, maxYear: max };
  }, [cards, filteredTypes, sortType]);

  const handleDragStart = (e: React.DragEvent, year: number, cardId: string, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    setDragState({ year, cardId, fromIndex: index, overIndex: index });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState && dragState.overIndex !== index) {
      setDragState({ ...dragState, overIndex: index });
    }
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragState && dragState.fromIndex !== toIndex) {
      reorderCards(dragState.year, dragState.fromIndex, toIndex);
      const yearCards = yearsData.find((y) => y.year === dragState.year)?.cards;
      if (yearCards) {
        const movedCardId = yearCards[dragState.fromIndex]?.id || dragState.cardId;
        bounceRefs.current.add(movedCardId);
        setTimeout(() => bounceRefs.current.delete(movedCardId), 400);
      }
    }
    setDragState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  const isEmpty = yearsData.length === 0;

  if (isEmpty) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          marginRight: '320px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(224, 170, 255, 0.15), rgba(157, 78, 221, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '1px solid rgba(224, 170, 255, 0.2)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" stroke="#E0AAFF" strokeWidth="2" strokeDasharray="4 3" />
            <circle cx="18" cy="18" r="6" fill="#C77DFF" />
            <path d="M18 10V6M18 30V26M10 18H6M30 18H26" stroke="#E0AAFF" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: '20px',
            color: '#E0AAFF',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          暂无符合条件的创作
        </h3>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
          请调整筛选条件后重试
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 'calc(100% - 340px)',
        margin: '0 auto',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: '40px 0 120px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '84px',
            left: '0',
            right: '0',
            height: '3px',
            background: '#BE95C4',
            borderRadius: '2px',
            boxShadow: '0 0 12px rgba(190, 149, 196, 0.4)',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${yearsData.length}, 1fr)`,
            gap: '24px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {yearsData.map(({ year, cards: yearCards }) => {
            const isExpanded = expandedYears.includes(year);
            const nodeColor = getYearNodeColor(year, minYear, maxYear);
            const isDraggingYear = dragState?.year === year;

            return (
              <div
                key={year}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <button
                    onClick={() => toggleYear(year)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: nodeColor,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      boxShadow: `0 0 16px ${nodeColor}60`,
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.14)';
                      e.currentTarget.style.width = '32px';
                      e.currentTarget.style.height = '32px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.width = '28px';
                      e.currentTarget.style.height = '28px';
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '36px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        background: 'rgba(36, 0, 70, 0.95)',
                        color: '#E0AAFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        boxShadow:
                          '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(224, 170, 255, 0.15)',
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                      className="year-label"
                    >
                      {year}年
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginLeft: '6px',
                          fontWeight: 400,
                        }}
                      >
                        {yearCards.length}件作品
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '5px solid rgba(36, 0, 70, 0.95)',
                        }}
                      />
                    </span>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'block',
                      }}
                    />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                    opacity: isExpanded ? 1 : 0,
                    maxHeight: isExpanded ? 'none' : 0,
                    overflow: isExpanded ? 'visible' : 'hidden',
                  }}
                >
                  {isExpanded && (
                    <>
                      <div
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          color: nodeColor,
                          marginBottom: '4px',
                          textShadow: `0 0 20px ${nodeColor}40`,
                        }}
                      >
                        {year}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'minmax(0, 1fr) minmax(0, 1fr)',
                          gap: '16px',
                          width: '100%',
                          maxWidth: '880px',
                          justifyItems: 'center',
                          transition: 'all 0.4s ease-in-out',
                        }}
                        className="cards-grid"
                      >
                        {yearCards.map((card, idx) => {
                          const isThisDragging =
                            isDraggingYear && dragState?.cardId === card.id;
                          const isThisOver =
                            isDraggingYear && dragState?.overIndex === idx && dragState?.fromIndex !== idx;
                          const shouldBounce = bounceRefs.current.has(card.id);

                          return (
                            <div
                              key={card.id}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                transition: 'all 0.4s ease-in-out',
                                animation: shouldBounce
                                  ? 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                  : undefined,
                              }}
                            >
                              <Card
                                card={card}
                                index={idx}
                                draggable={true}
                                onDragStart={(e, _id, _idx) =>
                                  handleDragStart(e, year, _id, _idx)
                                }
                                onDragOver={(e, _idx) => handleDragOver(e, _idx)}
                                onDrop={(e, _idx) => handleDrop(e, _idx)}
                                onDragEnd={handleDragEnd}
                                isDragging={isThisDragging}
                                isDragOver={isThisOver}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '40px',
            padding: '16px 24px',
            background: 'rgba(60, 9, 108, 0.4)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginLeft: '50%',
            transform: 'translateX(-50%)',
            border: '1px solid rgba(224, 170, 255, 0.1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2V14M2 8H14"
              stroke="#C77DFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
            点击年份节点展开/收起 · 拖拽卡片可调整同一年份内的顺序
          </span>
        </div>
      </div>

      <style>{`
        button:hover .year-label,
        button:focus-visible .year-label {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(-4px) !important;
        }
        @media (max-width: 1024px) {
          .cards-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .cards-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          div[style*="max-width: calc(100% - 340px)"] {
            max-width: 100% !important;
            padding: 0 16px !important;
          }
        }
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          div[style*="grid-template-columns: repeat"] {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          div[style*="position: absolute; top: 84px"] {
            display: none !important;
          }
        }
        @media (orientation: landscape) and (max-width: 900px) {
          .cards-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Timeline;
