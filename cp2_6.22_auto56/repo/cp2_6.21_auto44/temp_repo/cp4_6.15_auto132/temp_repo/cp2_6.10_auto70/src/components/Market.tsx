import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Tag, ArrowLeft, Check } from 'lucide-react';
import { usePawnStore } from '../store/pawnStore';
import { getItemIcon } from './ItemIcons';
import { calculateDeadPawnPrice } from '../utils/valuation';
import type { PawnItem } from '../types';

const Market: React.FC = () => {
  const { deadPawnItems, marketItems, moveToMarket, sellItem, balance } = usePawnStore();
  const [activeTab, setActiveTab] = useState<'dead' | 'market'>('dead');
  const [selectedPrice, setSelectedPrice] = useState<Record<string, number>>({});
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const handleMoveToMarket = (itemId: string) => {
    const price = selectedPrice[itemId] || calculateDeadPawnPrice(
      deadPawnItems.find(i => i.id === itemId)?.pawnAmount || 0
    );
    moveToMarket(itemId, price);
    setSelectedPrice(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  const handleBuy = (itemId: string) => {
    const item = marketItems.find(i => i.id === itemId);
    if (!item || !item.marketPrice) return;
    
    if (balance < item.marketPrice) {
      alert('余额不足！');
      return;
    }

    setPurchasedId(itemId);
    setTimeout(() => {
      sellItem(itemId);
      setPurchasedId(null);
    }, 1000);
  };

  const renderDeadPawnItem = (item: PawnItem) => {
    const ItemIcon = getItemIcon(item.itemType);
    const suggestedPrice = calculateDeadPawnPrice(item.pawnAmount);
    const currentPrice = selectedPrice[item.id] || suggestedPrice;

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#f5e6c8] border-2 border-[#c04040] rounded-lg p-4 relative"
      >
        <div className="absolute -top-2 -right-2 w-12 h-12">
          <div className="w-full h-full border-2 border-[#c04040] rounded-full flex items-center justify-center bg-[#f5e6c8] transform rotate-12">
            <span className="text-[#c04040] font-brush text-xs font-bold">死当</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-16 h-16 bg-white rounded flex items-center justify-center border border-[#8b5e3c] flex-shrink-0">
            <ItemIcon size={50} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#2a1f18] truncate">{item.itemName}</h3>
            <p className="text-xs text-[#8b5e3c] truncate">{item.description}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="px-2 py-0.5 bg-[#e8d5a3] rounded text-[#8b5e3c]">
                原当本：{item.pawnAmount}文
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-dashed border-[#8b5e3c]">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-[#c04040]" />
            <span className="text-sm text-[#8b5e3c]">设置售价：</span>
            <input
              type="range"
              min={Math.round(item.pawnAmount * 1.4)}
              max={Math.round(item.pawnAmount * 2.0)}
              value={currentPrice}
              onChange={(e) => setSelectedPrice(prev => ({
                ...prev,
                [item.id]: parseInt(e.target.value)
              }))}
              className="flex-1 accent-[#c04040]"
            />
            <span className="text-lg font-bold text-[#c04040] w-16 text-right">
              {currentPrice}文
            </span>
          </div>
          <div className="text-xs text-[#8b5e3c] mb-2">
            建议售价范围：{Math.round(item.pawnAmount * 1.4)} - {Math.round(item.pawnAmount * 2.0)}文
          </div>
          <button
            onClick={() => handleMoveToMarket(item.id)}
            className="w-full py-2 bg-[#c04040] text-white rounded font-bold text-sm hover:bg-[#a03030] transition-colors"
          >
            上架估衣市
          </button>
        </div>
      </motion.div>
    );
  };

  const renderMarketItem = (item: PawnItem) => {
    const ItemIcon = getItemIcon(item.itemType);
    const isPurchased = purchasedId === item.id;

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
        whileHover={{ rotate: -5, scale: 1.05, boxShadow: '0 10px 30px rgba(139, 94, 60, 0.4)' }}
        transition={{ duration: 0.2 }}
        className="bg-[#f5e6c8] border-2 border-[#c04040] rounded-lg p-4 relative cursor-pointer"
      >
        <AnimatePresence>
          {isPurchased && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#50a860] bg-opacity-90 rounded-lg flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center text-white"
              >
                <Check className="w-12 h-12 mx-auto mb-2" />
                <div className="font-bold">银货两讫</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border border-[#8b5e3c] mb-3 shadow-inner"
          >
            <ItemIcon size={80} />
          </motion.div>

          <h3 className="font-bold text-[#2a1f18] text-center">{item.itemName}</h3>
          <p className="text-xs text-[#8b5e3c] text-center mt-1 line-clamp-2">
            {item.description}
          </p>

          <div className="flex gap-1 mt-2 flex-wrap justify-center">
            <span className="px-2 py-0.5 bg-[#e8d5a3] rounded text-xs text-[#8b5e3c]">
              {item.era}代
            </span>
            <span className="px-2 py-0.5 bg-[#e8d5a3] rounded text-xs text-[#8b5e3c]">
              {item.material}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-dashed border-[#8b5e3c] w-full">
            <div className="text-center mb-2">
              <div className="text-xs text-[#8b5e3c]">售价</div>
              <div className="text-2xl font-bold text-[#c04040] font-brush">
                {item.marketPrice}文
              </div>
            </div>
            <button
              onClick={() => handleBuy(item.id)}
              disabled={isPurchased}
              className="w-full py-2 bg-[#8b5e3c] text-white rounded font-bold text-sm hover:bg-[#6b4226] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              立即购买
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full bg-[#e8d5a3] flex flex-col">
      <div className="bg-[#8b5e3c] p-4">
        <h2 className="text-2xl font-brush font-bold text-[#f5e6c8] text-center mb-3">
          估衣市
        </h2>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('dead')}
            className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${
              activeTab === 'dead'
                ? 'bg-[#c04040] text-white'
                : 'bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3]'
            }`}
          >
            死当物品 ({deadPawnItems.length})
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-2 rounded font-bold text-sm transition-colors ${
              activeTab === 'market'
                ? 'bg-[#c04040] text-white'
                : 'bg-[#f5e6c8] text-[#8b5e3c] hover:bg-[#e8d5a3]'
            }`}
          >
            市场在售 ({marketItems.length})
          </button>
        </div>

        <div className="flex items-center justify-between text-[#f5e6c8] text-sm">
          <span>掌柜余额</span>
          <span className="font-bold text-[#d4af37] text-lg">{balance}文</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'dead' && (
            <motion.div
              key="dead"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {deadPawnItems.length === 0 ? (
                <div className="text-center py-12 text-[#8b5e3c]">
                  <div className="text-4xl mb-2">📦</div>
                  <p>暂无比死当物品</p>
                  <p className="text-sm opacity-70 mt-1">当物品逾期30天后会自动标记为死当</p>
                </div>
              ) : (
                deadPawnItems.map(renderDeadPawnItem)
              )}
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-4"
            >
              {marketItems.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-[#8b5e3c]">
                  <div className="text-4xl mb-2">🏪</div>
                  <p>市场暂无商品</p>
                  <p className="text-sm opacity-70 mt-1">请先将死当物品上架</p>
                </div>
              ) : (
                marketItems.map(renderMarketItem)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeTab === 'dead' && deadPawnItems.length > 0 && (
        <div className="p-4 bg-[#f5e6c8] border-t border-[#8b5e3c]">
          <div className="flex items-start gap-2 text-xs text-[#8b5e3c]">
            <ArrowLeft className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              死当物品可重新标价后上架估衣市出售，售价建议在原当本基础上加价40%-100%。
              拖动滑块调整价格后点击"上架估衣市"即可发布。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
