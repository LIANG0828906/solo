import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { cardPool } from '../modules/card/CardData';
import { CardItem } from '../components/CardItem';
import { Card, Rarity } from '../modules/card/CardTypes';
import { calculateDeckStats, MAX_DECK_SIZE } from '../modules/card/CardDeck';
import { ArrowLeft, Plus, Minus, Trash2, Filter, Search, Play } from 'lucide-react';

export const DeckBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { playerDeck, addCardToDeck, removeCardFromDeck, clearDeck, initGame } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');

  const filteredCards = useMemo(() => {
    return cardPool.filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || card.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [searchTerm, rarityFilter]);

  const deckStats = useMemo(() => calculateDeckStats(playerDeck), [playerDeck]);

  const cardCountInDeck = (cardId: string): number => {
    return playerDeck.filter((c) => c.id === cardId).length;
  };

  const handleAddCard = (card: Card) => {
    if (playerDeck.length < MAX_DECK_SIZE) {
      addCardToDeck(card);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    removeCardFromDeck(cardId);
  };

  const handleStartBattle = () => {
    if (playerDeck.length >= 10) {
      initGame();
      navigate('/battle');
    }
  };

  const rarityOptions = [
    { value: 'all', label: '全部', color: '#888' },
    { value: Rarity.COMMON, label: '普通', color: '#888888' },
    { value: Rarity.RARE, label: '稀有', color: '#4a9eff' },
    { value: Rarity.EPIC, label: '史诗', color: '#b34aff' },
    { value: Rarity.LEGENDARY, label: '传说', color: '#ff8c00' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="text-gray-400" size={24} />
          </button>
          <h1 className="text-3xl font-bold text-yellow-400">卡组编辑器</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="p-4 rounded-xl mb-4"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-48">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="搜索卡牌..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white
                               focus:outline-none focus:border-yellow-400/50 transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <div className="flex gap-1">
                    {rarityOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                                   ${rarityFilter === option.value ? 'ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: option.color + '30', color: option.color }}
                        onClick={() => setRarityFilter(option.value as Rarity | 'all')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <h2 className="text-lg font-bold text-white mb-4">
                卡牌池 <span className="text-gray-400 text-sm">({filteredCards.length}张)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCards.map((card) => {
                  const count = cardCountInDeck(card.id);
                  return (
                    <div key={card.id} className="relative group">
                      <CardItem card={card} size="medium" draggable={false} showTooltip={true} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                                    transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center
                                     hover:bg-red-400 transition-colors disabled:opacity-50"
                            onClick={() => handleRemoveCard(card.id)}
                            disabled={count === 0}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-white font-bold w-6 text-center">{count}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center
                                     hover:bg-green-400 transition-colors disabled:opacity-50"
                            onClick={() => handleAddCard(card)}
                            disabled={playerDeck.length >= MAX_DECK_SIZE}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="p-4 rounded-xl sticky top-4"
              style={{
                background: 'rgba(26, 26, 46, 0.9)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-yellow-400">我的卡组</h2>
                <button
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  onClick={clearDeck}
                  title="清空卡组"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">卡牌数量</span>
                  <span className={`font-bold ${playerDeck.length >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {playerDeck.length}/{MAX_DECK_SIZE}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(playerDeck.length / MAX_DECK_SIZE) * 100}%`,
                      background: playerDeck.length >= 20
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : 'linear-gradient(90deg, #eab308, #ca8a04)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均费用</span>
                  <span className="text-blue-400 font-bold">
                    {deckStats.averageCost.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {Object.entries(deckStats.rarityCount).map(([rarity, count]) => {
                  const colors: Record<string, string> = {
                    common: '#888888',
                    rare: '#4a9eff',
                    epic: '#b34aff',
                    legendary: '#ff8c00',
                  };
                  return (
                    <div key={rarity} className="flex-1 text-center">
                      <div
                        className="text-lg font-bold"
                        style={{ color: colors[rarity] }}
                      >
                        {count}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{rarity}</div>
                    </div>
                  );
                })}
              </div>

              <button
                className="w-full py-3 rounded-xl font-bold text-white transition-all
                           hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                           disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                }}
                onClick={handleStartBattle}
                disabled={playerDeck.length < 10}
              >
                <div className="flex items-center justify-center gap-2">
                  <Play size={20} />
                  <span>开始对战</span>
                </div>
              </button>
              {playerDeck.length < 10 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  至少需要10张卡牌才能开始对战
                </p>
              )}
            </div>

            <div
              className="p-4 rounded-xl max-h-96 overflow-y-auto"
              style={{
                background: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <h3 className="text-sm font-bold text-gray-400 mb-3">卡组列表</h3>
              <div className="space-y-2">
                {playerDeck.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    点击卡牌添加到卡组
                  </p>
                ) : (
                  [...playerDeck]
                    .sort((a, b) => a.cost - b.cost)
                    .map((card, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50
                                 hover:bg-gray-700/50 transition-colors group"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: '#4a9eff' }}
                        >
                          {card.cost}
                        </div>
                        <span className="flex-1 text-sm text-white truncate">
                          {card.name}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-red-400
                                   hover:text-red-300 transition-all"
                          onClick={() => handleRemoveCard(card.id)}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
