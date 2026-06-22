import React, { useState } from 'react';
import { useGameStore } from './GameStore';
import type { EventCardType } from './types';

const CARD_INFO: Record<EventCardType, { name: string; icon: string; desc: string; bg: string }> = {
  advance2_clear: { name: '冲锋', icon: '⚔', desc: '前进2格并清空目标格', bg: 'from-red-500 to-red-700' },
  retreat3_collision: { name: '回旋', icon: '↻', desc: '后退3格并触发碰撞', bg: 'from-blue-500 to-blue-700' },
  teleport_ally: { name: '传送', icon: '✧', desc: '传送至己方棋子位置', bg: 'from-purple-500 to-purple-700' },
};

export default function EventCard() {
  const { currentPlayerIndex, players, phase, useEventCard } = useGameStore();
  const [flippingCard, setFlippingCard] = useState<number | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const cards = currentPlayer?.eventCards || [];
  const canUse = phase === 'waiting';

  const handleCardClick = (cardType: EventCardType, index: number) => {
    if (!canUse) return;
    setFlippingCard(index);
    setTimeout(() => {
      useEventCard(cardType);
      setFlippingCard(null);
    }, 400);
  };

  const getRotation = (index: number, total: number) => {
    const center = (total - 1) / 2;
    return (index - center) * 8;
  };

  const getYOffset = (index: number, total: number) => {
    const center = (total - 1) / 2;
    return Math.abs(index - center) * 6;
  };

  return (
    <div className="flex items-end justify-center gap-2 relative h-36">
      {cards.slice(0, 3).map((card, index) => {
        const info = CARD_INFO[card];
        const rotation = getRotation(index, cards.length);
        const yOffset = getYOffset(index, cards.length);
        const isFlipping = flippingCard === index;

        return (
          <div
            key={`${card}-${index}`}
            className={`relative w-20 h-28 cursor-pointer transition-all duration-300 ${canUse ? 'hover:-translate-y-3 hover:z-20' : 'opacity-80 cursor-not-allowed'}`}
            style={{
              transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
              perspective: '1000px',
            }}
            onClick={() => handleCardClick(card, index)}
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${isFlipping ? 'rotate-y-180' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.bg} shadow-lg border-2 border-yellow-400/50 p-2 flex flex-col items-center justify-between`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-3xl text-white drop-shadow-lg">{info.icon}</div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm drop-shadow">{info.name}</div>
                  <div className="text-white/80 text-[10px] mt-0.5">{info.desc}</div>
                </div>
                <div className="absolute top-1 left-2 text-white/50 text-xs font-mono">{index + 1}</div>
                <div className="absolute top-1 right-2 text-white/50 text-xs">♠</div>
              </div>
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg border-2 border-yellow-600/50 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-4xl text-yellow-500/70">✦</div>
                <div className="absolute inset-2 border border-yellow-500/30 rounded-lg" />
                <div className="absolute inset-3 border border-yellow-500/20 rounded-md" />
              </div>
            </div>
          </div>
        );
      })}
      {canUse && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-yellow-300 text-xs font-bold bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
          点击卡牌使用
        </div>
      )}
    </div>
  );
}
