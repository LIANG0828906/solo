import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore } from '../store/cardStore';
import { getCardById, ELEMENT_COLORS, RARITY_COLORS } from '../utils/cardData';
import type { Card } from '../utils/cardData';
import { GameCard, ElementIcon } from './GameCard';
import { SynthesisAnimation, SynthesisResultModal } from './SynthesisModal';

const rarityLabels: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export function GameBoard() {
  const {
    getOwnedCards,
    leftSlotCardId,
    rightSlotCardId,
    setLeftSlot,
    setRightSlot,
    startSynthesis,
    isSynthesizing,
    synthesisResult,
    clearSynthesisResult,
    goldSynthCount,
    getSynthesisProbability,
  } = useCardStore();

  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [leftFlash, setLeftFlash] = useState(false);
  const [rightFlash, setRightFlash] = useState(false);
  const [showAnim, setShowAnim] = useState(false);

  const ownedCards = getOwnedCards();
  const leftCard = leftSlotCardId ? getCardById(leftSlotCardId) || null : null;
  const rightCard = rightSlotCardId ? getCardById(rightSlotCardId) || null : null;
  const probInfo = getSynthesisProbability();

  const handleCardClick = useCallback((card: Card) => {
    if (isSynthesizing || showAnim) return;

    if (!leftSlotCardId) {
      setLeftSlot(card.id);
      setLeftFlash(true);
      setTimeout(() => setLeftFlash(false), 500);
    } else if (!rightSlotCardId && leftSlotCardId !== card.id) {
      setRightSlot(card.id);
      setRightFlash(true);
      setTimeout(() => setRightFlash(false), 500);
    } else if (leftSlotCardId === card.id) {
      setLeftSlot(null);
    } else if (rightSlotCardId === card.id) {
      setRightSlot(null);
    } else {
      setRightSlot(card.id);
      setRightFlash(true);
      setTimeout(() => setRightFlash(false), 500);
    }
  }, [isSynthesizing, showAnim, leftSlotCardId, rightSlotCardId, setLeftSlot, setRightSlot]);

  const handleFlip = useCallback((cardId: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const handleSynthesize = useCallback(() => {
    if (!leftSlotCardId || !rightSlotCardId || isSynthesizing) return;

    setShowAnim(true);
    startSynthesis();
  }, [leftSlotCardId, rightSlotCardId, isSynthesizing, startSynthesis]);

  const handleAnimComplete = useCallback(() => {
    setShowAnim(false);
    setShowResult(true);
  }, []);

  const handleCloseResult = useCallback(() => {
    setShowResult(false);
    clearSynthesisResult();
  }, [clearSynthesisResult]);

  const getSlotElementColor = (card: Card | null) => {
    if (!card) return '#2a2a5a';
    if (card.element === 'composite') return '#a855f7';
    return ELEMENT_COLORS[card.element] || '#666';
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center py-8 px-4">
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="font-display text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent text-center"
      >
        元素融合录
      </motion.h1>
      <motion.p
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-white/60 mb-6 text-sm"
      >
        点击卡牌放入合成槽，探索元素融合的奥秘
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex items-center justify-center gap-6 md:gap-12 mb-8 w-full max-w-xl"
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className={`relative hex-slot w-28 h-32 md:w-32 md:h-36 flex items-center justify-center transition-all duration-300 ${leftFlash ? 'animate-pulse' : ''}`}
            style={{
              background: leftCard
                ? `linear-gradient(135deg, ${getSlotElementColor(leftCard)}40, ${getSlotElementColor(leftCard)}20)`
                : 'linear-gradient(135deg, #1a1a3e, #0a0a2a)',
              boxShadow: leftFlash
                ? `0 0 30px ${getSlotElementColor(leftCard)}`
                : leftCard
                ? `inset 0 0 20px ${getSlotElementColor(leftCard)}40`
                : 'inset 0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            {leftCard ? (
              <div className="hex-slot-inner flex flex-col items-center justify-center">
                <ElementIcon element={leftCard.element} size={40} />
                <span className="text-white text-xs mt-1 font-medium">{leftCard.name}</span>
              </div>
            ) : (
              <span className="text-white/30 text-sm">左槽</span>
            )}
            {leftCard && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: RARITY_COLORS[leftCard.rarity] }}
                onClick={(e) => { e.stopPropagation(); setLeftSlot(null); }}
              >
                ×
              </div>
            )}
          </div>
          <span className="text-xs text-white/50">
            {leftCard ? rarityLabels[leftCard.rarity] : '空'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl md:text-4xl text-white/40">✦</span>
          <button
            onClick={handleSynthesize}
            disabled={!leftSlotCardId || !rightSlotCardId || isSynthesizing || showAnim}
            className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${
              leftSlotCardId && rightSlotCardId && !isSynthesizing && !showAnim
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {isSynthesizing || showAnim ? '合成中...' : '合 成'}
          </button>
          {probInfo.canSynthesize && (
            <span className="text-xs text-white/60">
              成功率：{(probInfo.probability * 100).toFixed(0)}%
              {probInfo.resultCardName && ` → ${probInfo.resultCardName}`}
            </span>
          )}
          {!probInfo.canSynthesize && leftSlotCardId && rightSlotCardId && (
            <span className="text-xs text-red-400">未知配方</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className={`relative hex-slot w-28 h-32 md:w-32 md:h-36 flex items-center justify-center transition-all duration-300 ${rightFlash ? 'animate-pulse' : ''}`}
            style={{
              background: rightCard
                ? `linear-gradient(135deg, ${getSlotElementColor(rightCard)}40, ${getSlotElementColor(rightCard)}20)`
                : 'linear-gradient(135deg, #1a1a3e, #0a0a2a)',
              boxShadow: rightFlash
                ? `0 0 30px ${getSlotElementColor(rightCard)}`
                : rightCard
                ? `inset 0 0 20px ${getSlotElementColor(rightCard)}40`
                : 'inset 0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            {rightCard ? (
              <div className="hex-slot-inner flex flex-col items-center justify-center">
                <ElementIcon element={rightCard.element} size={40} />
                <span className="text-white text-xs mt-1 font-medium">{rightCard.name}</span>
              </div>
            ) : (
              <span className="text-white/30 text-sm">右槽</span>
            )}
            {rightCard && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: RARITY_COLORS[rightCard.rarity] }}
                onClick={(e) => { e.stopPropagation(); setRightSlot(null); }}
              >
                ×
              </div>
            )}
          </div>
          <span className="text-xs text-white/50">
            {rightCard ? rarityLabels[rightCard.rarity] : '空'}
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAnim && leftCard && rightCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <SynthesisAnimation
              leftCard={leftCard}
              rightCard={rightCard}
              onComplete={handleAnimComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SynthesisResultModal
        isOpen={showResult}
        onClose={handleCloseResult}
        result={synthesisResult}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card-grid mb-6"
      >
        {ownedCards.slice(0, 12).map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <GameCard
              card={card}
              isFlipped={flippedCards.has(card.id)}
              onFlip={() => handleFlip(card.id)}
              showQuickAdd
              onQuickAdd={() => handleCardClick(card)}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-white/40"
      >
        <p>点击卡牌查看详情 · 点击右上角 + 按钮放入合成槽</p>
        <p className="mt-1">
          金色保底进度：{goldSynthCount}/100
          <span className="ml-2">（传说卡合成失败累计）</span>
        </p>
      </motion.div>
    </div>
  );
}
