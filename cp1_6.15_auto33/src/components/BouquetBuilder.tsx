import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, X, ShoppingCart, AlertCircle } from 'lucide-react';
import type { Flower, BouquetItem } from '@/types';
import { useFlowerStore } from '@/store/useFlowerStore';

interface BouquetBuilderProps {
  flowers: Flower[];
}

export default function BouquetBuilder({ flowers }: BouquetBuilderProps) {
  const navigate = useNavigate();
  const { bouquetItems, addBouquetItem, removeBouquetItem, updateBouquetQuantity, clearBouquet, getTotalPrice } = useFlowerStore();
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const totalPrice = getTotalPrice();
  const totalItems = bouquetItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddFlower = useCallback((flower: Flower) => {
    const existing = bouquetItems.find((item) => item.flowerId === flower.id);
    const currentQty = existing?.quantity || 0;

    if (flower.stock <= 0) {
      setStockWarning(`${flower.name} 已售罄`);
      setTimeout(() => setStockWarning(null), 2000);
      return;
    }
    if (currentQty >= flower.stock) {
      setStockWarning(`${flower.name} 库存不足，当前仅剩 ${flower.stock} 朵`);
      setTimeout(() => setStockWarning(null), 2000);
      return;
    }

    addBouquetItem(flower);
    setAnimatingId(flower.id);
    setTimeout(() => setAnimatingId(null), 600);
  }, [bouquetItems, addBouquetItem]);

  const handleQuantityChange = useCallback((flowerId: string, delta: number) => {
    const item = bouquetItems.find((i) => i.flowerId === flowerId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeBouquetItem(flowerId);
      return;
    }
    if (newQty > item.flower.stock) {
      setStockWarning(`${item.flower.name} 库存不足，当前仅剩 ${item.flower.stock} 朵`);
      setTimeout(() => setStockWarning(null), 2000);
      return;
    }
    updateBouquetQuantity(flowerId, newQty);
  }, [bouquetItems, removeBouquetItem, updateBouquetQuantity]);

  const availableFlowers = flowers.filter((f) => f.stock > 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      <div className="lg:w-[35%] space-y-3 overflow-y-auto max-h-[70vh] pr-2">
        <h3 className="font-display text-xl text-gray-800 sticky top-0 bg-cream-50 py-2 z-10">
          选择花材
        </h3>
        {availableFlowers.map((flower) => {
          const inBouquet = bouquetItems.find((i) => i.flowerId === flower.id);
          return (
            <div
              key={flower.id}
              className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm
                         hover:shadow-flower transition-all duration-300 cursor-pointer
                         ${animatingId === flower.id ? 'animate-bounce-soft' : ''}
                         ${inBouquet ? 'ring-2 ring-rose-300' : ''}`}
              onClick={() => handleAddFlower(flower)}
            >
              <img
                src={flower.image}
                alt={flower.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{flower.name}</p>
                <p className="text-rose-500 text-sm font-semibold">¥{flower.price}/朵</p>
                <p className="text-xs text-gray-400">库存 {flower.stock}</p>
              </div>
              <button className="p-1.5 bg-rose-50 rounded-full text-rose-500 hover:bg-rose-100 transition-colors flex-shrink-0">
                <Plus size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="lg:w-[35%] bg-white rounded-2xl shadow-flower p-6">
        <h3 className="font-display text-xl text-gray-800 mb-4">构建预览</h3>
        {bouquetItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <ShoppingCart size={48} className="mb-3" />
            <p className="font-display">点击左侧花材添加</p>
            <p className="text-sm">开始创建你的花束</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bouquetItems.map((item) => (
              <div
                key={item.flowerId}
                className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl animate-fade-in-up"
              >
                <img
                  src={item.flower.image}
                  alt={item.flower.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{item.flower.name}</p>
                  <p className="text-xs text-gray-400">¥{item.flower.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.flowerId, -1); }}
                    className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.flowerId, 1); }}
                    className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeBouquetItem(item.flowerId); }}
                  className="p-1 text-gray-300 hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <div className="border-t border-rose-100 pt-4 mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>花材种类</span>
                <span className="font-semibold text-gray-700">{bouquetItems.length} 种</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                <span>总计数量</span>
                <span className="font-semibold text-gray-700">{totalItems} 朵</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-[30%] space-y-4">
        <div className="bg-white rounded-2xl shadow-flower p-6 sticky top-4">
          <h3 className="font-display text-xl text-gray-800 mb-4">花束总价</h3>
          <div className="text-center py-4">
            <span className="text-4xl font-display font-bold text-rose-500">¥{totalPrice}</span>
            <p className="text-gray-400 text-sm mt-1">
              {totalItems > 0 ? `共 ${totalItems} 朵花材` : '尚未添加花材'}
            </p>
          </div>

          {stockWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 animate-fade-in-up">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 text-sm">{stockWarning}</p>
            </div>
          )}

          <div className="space-y-3 mt-4">
            <button
              onClick={() => {
                if (bouquetItems.length === 0) return;
                navigate('/order');
              }}
              disabled={bouquetItems.length === 0}
              className={`w-full py-3 rounded-full font-medium text-white transition-all duration-300
                ${
                  bouquetItems.length === 0
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 active:scale-95'
                }`}
            >
              去下单 →
            </button>
            {bouquetItems.length > 0 && (
              <button
                onClick={clearBouquet}
                className="w-full py-2 rounded-full text-sm text-gray-400 hover:text-rose-500 transition-colors"
              >
                清空花束
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
