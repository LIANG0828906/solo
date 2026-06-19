import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore } from '../store/cardStore';
import { ELEMENT_COLORS, RARITY_COLORS } from '../utils/cardData';
import { ElementIcon } from '../components/GameCard';

const rarityLabels: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export function CollectionPage() {
  const { cardList, isCardOwned } = useCardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return cardList;
    const term = searchTerm.toLowerCase();
    return cardList.filter(
      (card) =>
        card.name.toLowerCase().includes(term) ||
        card.description.toLowerCase().includes(term) ||
        rarityLabels[card.rarity]?.includes(term) ||
        card.element.toLowerCase().includes(term)
    );
  }, [cardList, searchTerm]);

  const ownedCount = cardList.filter((c) => isCardOwned(c.id)).length;

  const getFormulaDisplay = (cardId: string): [string, string] => {
    const card = cardList.find((c) => c.id === cardId);
    if (!card?.formula) return ['?', '?'];
    const [a, b] = card.formula;
    const cardA = cardList.find((c) => c.id === a);
    const cardB = cardList.find((c) => c.id === b);
    return [
      isCardOwned(a) ? cardA?.name || '?' : '?',
      isCardOwned(b) ? cardB?.name || '?' : '?',
    ];
  };

  return (
    <div className="relative z-10 min-h-screen py-8 px-4 max-w-5xl mx-auto">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          卡牌图鉴
        </h1>
        <p className="text-white/60 text-sm">
          已收集 <span className="text-amber-400 font-bold">{ownedCount}</span> / {cardList.length}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative max-w-md mx-auto mb-8"
      >
        <input
          type="text"
          placeholder="搜索卡牌名称、描述、稀有度..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full py-3 px-5 pl-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={searchTerm}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="masonry-collection"
        >
          {filteredCards.map((card, index) => {
            const owned = isCardOwned(card.id);
            const rarityColor = RARITY_COLORS[card.rarity];
            const elementColor =
              card.element === 'composite'
                ? 'linear-gradient(135deg, #ff4d2e, #2e9bff, #c8a24e, #8b5cf6)'
                : ELEMENT_COLORS[card.element] || '#666';

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                layout
                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                  owned ? 'animate-breathe' : ''
                }`}
                style={{
                  border: `2px solid ${owned ? rarityColor : '#333'}`,
                  boxShadow: owned ? `0 0 15px ${rarityColor}30` : 'none',
                }}
                onClick={() => {
                  if (!owned) {
                    setSelectedCardId(card.id);
                  }
                }}
              >
                <div
                  className="p-4 relative"
                  style={{
                    background: owned
                      ? `linear-gradient(135deg, #1a1a3e 0%, #0a0a2a 100%)`
                      : 'linear-gradient(135deg, #151525 0%, #0a0a15 100%)',
                  }}
                >
                  {!owned && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10" />
                  )}

                  <div className="relative z-0 flex items-center gap-3 mb-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: owned
                          ? `radial-gradient(circle, ${typeof elementColor === 'string' ? elementColor + '40' : '#8884'} 0%, transparent 70%)`
                          : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      {owned ? (
                        <ElementIcon element={card.element} size={32} />
                      ) : (
                        <svg width={32} height={32} viewBox="0 0 64 64" className="opacity-30">
                          <rect
                            x="16"
                            y="12"
                            width="32"
                            height="40"
                            rx="6"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                          />
                          <text
                            x="32"
                            y="40"
                            textAnchor="middle"
                            fill="white"
                            fontSize="16"
                            opacity="0.5"
                          >
                            ?
                          </text>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-display font-bold truncate ${
                          owned ? 'text-white' : 'text-white/30'
                        }`}
                      >
                        {owned ? card.name : '???'}
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                        style={{
                          backgroundColor: owned ? `${rarityColor}25` : 'rgba(255,255,255,0.05)',
                          color: owned ? rarityColor : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {rarityLabels[card.rarity]}
                      </div>
                    </div>
                  </div>

                  {owned ? (
                    <div className="flex justify-around text-sm mb-2">
                      <div className="text-center">
                        <div className="text-red-400 font-bold">{card.attack}</div>
                        <div className="text-white/40 text-xs">攻击</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">{card.defense}</div>
                        <div className="text-white/40 text-xs">防御</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-white/20 text-xs py-1">
                      点击查看配方
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filteredCards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-white/40"
        >
          <p className="text-4xl mb-4">🔍</p>
          <p>没有找到匹配的卡牌</p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedCardId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedCardId(null)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative glass-bg rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const card = cardList.find((c) => c.id === selectedCardId);
                if (!card) return null;
                const formula = getFormulaDisplay(card.id);
                const rarityColor = RARITY_COLORS[card.rarity];

                return (
                  <>
                    <h3 className="font-display text-xl font-bold text-center mb-4 text-white/80">
                      合成配方
                    </h3>

                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div
                        className="w-16 h-20 rounded-xl flex items-center justify-center"
                        style={{
                          border: `2px solid ${
                            formula[0] !== '?' ? '#666' : '#333'
                          }`,
                          background:
                            formula[0] !== '?'
                              ? 'linear-gradient(135deg, #1a1a3e, #0a0a2a)'
                              : '#111',
                        }}
                      >
                        {formula[0] !== '?' ? (
                          <span className="text-white text-sm font-medium">
                            {formula[0]}
                          </span>
                        ) : (
                          <span className="text-white/30 text-2xl">?</span>
                        )}
                      </div>

                      <span className="text-white/40 text-2xl">+</span>

                      <div
                        className="w-16 h-20 rounded-xl flex items-center justify-center"
                        style={{
                          border: `2px solid ${
                            formula[1] !== '?' ? '#666' : '#333'
                          }`,
                          background:
                            formula[1] !== '?'
                              ? 'linear-gradient(135deg, #1a1a3e, #0a0a2a)'
                              : '#111',
                        }}
                      >
                        {formula[1] !== '?' ? (
                          <span className="text-white text-sm font-medium">
                            {formula[1]}
                          </span>
                        ) : (
                          <span className="text-white/30 text-2xl">?</span>
                        )}
                      </div>

                      <span className="text-white/40 text-2xl">=</span>

                      <div
                        className="w-16 h-20 rounded-xl flex items-center justify-center"
                        style={{
                          border: `2px dashed ${rarityColor}80`,
                          background: 'rgba(0,0,0,0.3)',
                        }}
                      >
                        <span className="text-white/50 text-2xl">?</span>
                      </div>
                    </div>

                    <div
                      className="text-center text-sm mb-4 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: `${rarityColor}15`, color: rarityColor }}
                    >
                      {rarityLabels[card.rarity]}品质
                    </div>

                    <p className="text-white/50 text-center text-sm mb-4">
                      {formula[0] === '?' || formula[1] === '?'
                        ? '收集更多卡牌来解锁完整配方！'
                        : '尝试用这两张卡牌进行合成吧！'}
                    </p>

                    <button
                      onClick={() => setSelectedCardId(null)}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
                    >
                      关闭
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
