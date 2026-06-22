import React, { useState, useEffect, useCallback } from 'react';
import { X, Gift } from 'lucide-react';
import type { Season, Flower, WeatherEvent } from '@/types';
import { SEASON_LABELS, SEASON_COLORS, RARITY_COLORS, RARITY_LABELS } from '@/types';
import { useGardenStore } from '@/store/gardenStore';
import { useShake, playSound } from '@/utils/animations';

interface BlindBoxProps {
  season: Season;
  disabled?: boolean;
}

export const BlindBoxButton: React.FC<BlindBoxProps> = ({ season, disabled }) => {
  const { openBox, isOpeningBox } = useGardenStore();
  const { shake, style, isShaking } = useShake(8, 600);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (disabled || isOpeningBox) return;
    shake();
    playSound('click');
    openBox(season);
  };

  const seasonColor = SEASON_COLORS[season];
  const label = SEASON_LABELS[season];

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || isOpeningBox}
      className={`
        relative group flex flex-col items-center justify-center
        w-24 h-28 md:w-28 md:h-32 rounded-2xl
        transition-all duration-300 ease-out
        ${disabled || isOpeningBox ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${isShaking ? '' : ''}
      `}
      style={{
        ...style,
        backgroundColor: `${seasonColor}33`,
        boxShadow: isHovered && !disabled
          ? `0 20px 40px ${seasonColor}66, 0 8px 20px ${seasonColor}44`
          : `0 8px 20px ${seasonColor}33`,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${seasonColor}22, transparent)`,
        }}
      />

      <div
        className={`relative z-10 transition-transform duration-300 ${isHovered && !disabled ? 'scale-110 -translate-y-1' : ''}`}
      >
        <Gift
          size={48}
          className="transition-colors duration-300"
          style={{ color: seasonColor }}
        />
      </div>

      <span
        className="relative z-10 mt-2 text-sm font-bold"
        style={{ color: '#2d5016' }}
      >
        {label}
      </span>

      <div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping"
        style={{ backgroundColor: seasonColor, opacity: 0.5 }}
      />
    </button>
  );
};

interface BoxResultModalProps {
  isOpen: boolean;
  flower: Flower | null;
  weatherEvent: WeatherEvent;
  onClose: () => void;
}

export const BoxResultModal: React.FC<BoxResultModalProps> = ({ isOpen, flower, weatherEvent, onClose }) => {
  const [showContent, setShowContent] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(false);
      setShowFlower(false);
      setShowCard(false);

      const timers = [
        setTimeout(() => setShowContent(true), 300),
        setTimeout(() => {
          setShowFlower(true);
          playSound('success');
        }, 800),
        setTimeout(() => setShowCard(true), 1200),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen, flower]);

  if (!isOpen || !flower) return null;

  const weatherNames: Record<string, string> = {
    spring_rain: '春雨绵绵',
    summer_thunder: '夏雷阵阵',
    autumn_wind: '秋风送爽',
    winter_snow: '冬雪皑皑',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`relative max-w-sm w-full transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors z-10"
        >
          <X size={28} />
        </button>

        <div
          className={`
            relative rounded-3xl overflow-hidden
            bg-gradient-to-br from-white/95 to-green-50/95
            backdrop-blur-xl shadow-2xl
            transition-all duration-700
            ${showCard ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 0%, ${flower.color}, transparent 60%)`,
            }}
          />

          <div className="relative p-8 text-center">
            <div
              className={`
                mx-auto mb-6 transition-all duration-700
                ${showFlower ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'}
              `}
              style={{
                animation: showFlower ? 'float 3s ease-in-out infinite' : 'none',
              }}
            >
              <div
                className="text-9xl select-none"
                style={{
                  filter: `drop-shadow(0 0 30px ${flower.color})`,
                }}
              >
                {flower.emoji}
              </div>
            </div>

            <div
              className={`
                space-y-3 transition-all duration-500 delay-300
                ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <h2
                className="text-3xl font-bold"
                style={{ color: flower.color }}
              >
                {flower.name}
              </h2>

              <div className="flex items-center justify-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: RARITY_COLORS[flower.rarity] }}
                >
                  {RARITY_LABELS[flower.rarity]}
                </span>
                {flower.isMagic && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r from-amber-400 to-orange-500">
                    ✨ 魔法
                  </span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                {flower.description}
              </p>

              {weatherEvent && (
                <div
                  className="mt-4 p-4 rounded-2xl text-white"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <p className="font-medium">
                    🌦️ 触发天气事件：{weatherNames[weatherEvent] || weatherEvent}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${flower.color}, ${flower.color}cc)`,
                boxShadow: `0 8px 20px ${flower.color}66`,
              }}
            >
              收下这朵花 🌸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
