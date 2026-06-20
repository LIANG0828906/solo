import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ElementType, PotionInfo, ELEMENTS, findMatchingRecipe } from '../utils/recipes';
import { ParticleSystem } from '../utils/effects';

interface CauldronProps {
  particleSystem: ParticleSystem | null;
  onPotionCreated: (potion: PotionInfo) => void;
}

export const Cauldron: React.FC<CauldronProps> = ({ particleSystem, onPotionCreated }) => {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [successPotion, setSuccessPotion] = useState<PotionInfo | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const cauldronRef = useRef<HTMLDivElement>(null);
  const steamIntervalRef = useRef<number | null>(null);

  const triggerSynthesis = useCallback(
    (potion: PotionInfo) => {
      if (cauldronRef.current && particleSystem) {
        const rect = cauldronRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        particleSystem.addExplosionParticles(centerX, centerY, potion.color);
      }

      setSuccessPotion(potion);
      setShowSuccess(true);
      setElements([]);

      setTimeout(() => {
        setShowSuccess(false);
        onPotionCreated(potion);
      }, 1200);
    },
    [particleSystem, onPotionCreated]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    const elementType = e.dataTransfer.getData('text/plain') as ElementType;
    if (!elementType || elements.length >= 3) return;

    const newElements = [...elements, elementType];
    setElements(newElements);

    if (cauldronRef.current && particleSystem) {
      const rect = cauldronRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const liquidY = rect.top + rect.height * 0.55;
      const elementInfo = ELEMENTS[elementType];
      particleSystem.addSplashParticles(centerX, liquidY, elementInfo.color);
    }

    const match = findMatchingRecipe(newElements);
    if (match) {
      setTimeout(() => triggerSynthesis(match), 400);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (elements.length < 3) {
      setIsHovering(true);
    }
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  useEffect(() => {
    if (!particleSystem || !cauldronRef.current) return;

    steamIntervalRef.current = window.setInterval(() => {
      if (cauldronRef.current) {
        const rect = cauldronRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const topY = rect.top + rect.height * 0.3;
        particleSystem.addSteamParticle(centerX, topY);
      }
    }, 200);

    return () => {
      if (steamIntervalRef.current) {
        clearInterval(steamIntervalRef.current);
      }
    };
  }, [particleSystem]);

  return (
    <div className="cauldron-wrapper">
      <div
        ref={cauldronRef}
        className={`cauldron-container ${isHovering ? 'hovering' : ''} ${showSuccess ? 'synthesizing' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <svg viewBox="0 0 200 200" className="cauldron-svg">
          <defs>
            <linearGradient id="cauldronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a3728" />
              <stop offset="50%" stopColor="#2d1f14" />
              <stop offset="100%" stopColor="#1a120a" />
            </linearGradient>
            <linearGradient id="rimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b4f3d" />
              <stop offset="100%" stopColor="#3d2e23" />
            </linearGradient>
            <radialGradient id="liquidGradient" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(147, 112, 219, 0.8)" />
              <stop offset="100%" stopColor="rgba(75, 0, 130, 0.9)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse cx="100" cy="55" rx="75" ry="18" fill="url(#rimGradient)" />
          <path
            d="M25 55 Q20 130 60 165 Q100 180 140 165 Q180 130 175 55"
            fill="url(#cauldronGradient)"
            stroke="#3d2e23"
            strokeWidth="2"
          />
          <ellipse cx="100" cy="55" rx="60" ry="12" fill="url(#liquidGradient)">
            <animate attributeName="ry" values="12;14;12" dur="2s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="100" cy="165" rx="50" ry="10" fill="#1a120a" opacity="0.5" />

          {elements.length > 0 && (
            <g filter="url(#glow)">
              {elements.map((el, i) => {
                const info = ELEMENTS[el];
                const offsetX = (i - (elements.length - 1) / 2) * 30;
                return (
                  <circle
                    key={i}
                    cx={100 + offsetX}
                    cy={50}
                    r={12}
                    fill={info.color}
                    opacity="0.9"
                    className="cauldron-element"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <animate
                      attributeName="cy"
                      values="48;52;48"
                      dur={`${1.5 + i * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </g>
          )}
        </svg>

        <div className="cauldron-label">炼金坩埚</div>
        <div className="cauldron-hint">
          {elements.length === 0 ? '拖拽元素到此处' : `已放入 ${elements.length}/3 个元素`}
        </div>
      </div>

      {showSuccess && successPotion && (
        <div className="success-popup">
          <div className="success-potion-icon" style={{ '--potion-color': successPotion.color } as React.CSSProperties}>
            🧪
          </div>
          <div className="success-text">合成成功!</div>
          <div className="success-name">{successPotion.name}</div>
          <div className="success-score">+{successPotion.score}</div>
        </div>
      )}
    </div>
  );
};
