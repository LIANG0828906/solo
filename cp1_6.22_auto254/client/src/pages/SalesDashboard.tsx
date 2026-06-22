import React, { useEffect, useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, ShoppingBag, Coffee } from 'lucide-react';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import type { Drink } from '@shared/types';

interface SaleItemForm {
  drinkId: string;
  quantity: number;
}

export const SalesDashboard: React.FC = () => {
  const { drinks, todaySummary, loadDrinks, loadTodaySummary, addSale, loading } = useAppStore();
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([]);
  const [selectedDrink, setSelectedDrink] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [numberKey, setNumberKey] = useState(0);

  useEffect(() => {
    loadDrinks();
    loadTodaySummary();
  }, [loadDrinks, loadTodaySummary]);

  const addItem = () => {
    if (!selectedDrink || parseInt(quantity) <= 0) return;
    setSaleItems((prev) => [...prev, { drinkId: selectedDrink, quantity: parseInt(quantity) }]);
    setSelectedDrink('');
    setQuantity('1');
  };

  const removeItem = (index: number) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: SaleItemForm) => {
    const drink = drinks.find((d) => d.id === item.drinkId);
    if (!drink) return { subtotal: 0, cost: 0, profit: 0 };
    const subtotal = drink.price * item.quantity;
    const unitCost = drink.ingredients.reduce((sum, ing) => {
      const ingredient = useAppStore.getState().ingredients.find((i) => i.id === ing.ingredientId);
      return sum + (ingredient?.purchasePrice || 0) * ing.amount;
    }, 0);
    const cost = unitCost * item.quantity;
    return { subtotal, cost, profit: subtotal - cost };
  };

  const currentOrderTotal = saleItems.reduce((sum, item) => sum + calculateItemTotal(item).subtotal, 0);
  const currentOrderCost = saleItems.reduce((sum, item) => sum + calculateItemTotal(item).cost, 0);
  const currentOrderProfit = currentOrderTotal - currentOrderCost;

  const handleSubmitSale = async () => {
    if (saleItems.length === 0) return;
    try {
      await addSale({ items: saleItems });
      setSaleItems([]);
      setNumberKey((prev) => prev + 1);
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const getDrinkById = (id: string): Drink | undefined => drinks.find((d) => d.id === id);

  const profitRate = todaySummary.totalSales > 0
    ? ((todaySummary.totalProfit / todaySummary.totalSales) * 100).toFixed(1)
    : '0';

  return (
    <div className="h-full flex flex-col">
      <div
        className="p-6 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, #FFF8F0 0%, #FDF3E7 100%)' }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          销售面板
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          快速录入销售订单，实时查看经营数据
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            className="p-4 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'white', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(212, 163, 115, 0.15)' }}
              >
                <DollarSign size={20} style={{ color: 'var(--color-sidebar)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>今日销售额</p>
                <p
                  key={`sales-${numberKey}`}
                  className="text-xl font-bold animate-number-change"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ¥{todaySummary.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', animationDelay: '0.05s' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(231, 111, 81, 0.15)' }}
              >
                <ShoppingBag size={20} style={{ color: 'var(--color-warning)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>订单数</p>
                <p
                  key={`orders-${numberKey}`}
                  className="text-xl font-bold animate-number-change"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {todaySummary.orderCount}
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(124, 154, 115, 0.15)' }}
              >
                <TrendingUp size={20} style={{ color: 'var(--color-classic-tag)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>今日利润</p>
                <p
                  key={`profit-${numberKey}`}
                  className="text-xl font-bold animate-number-change"
                  style={{ color: 'var(--color-classic-tag)' }}
                >
                  ¥{todaySummary.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', animationDelay: '0.15s' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(181, 131, 90, 0.15)' }}
              >
                <Coffee size={20} style={{ color: 'var(--color-chart-line)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>利润率</p>
                <p
                  key={`rate-${numberKey}`}
                  className="text-xl font-bold animate-number-change"
                  style={{ color: 'var(--color-chart-line)' }}
                >
                  {profitRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            录入订单
          </h2>

          <div className="flex gap-3 mb-6">
            <select
              value={selectedDrink}
              onChange={(e) => setSelectedDrink(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none"
              style={{ borderColor: 'var(--color-border)', minHeight: '44px' }}
            >
              <option value="">选择饮品</option>
              {drinks.map((drink) => (
                <option key={drink.id} value={drink.id}>
                  {drink.name} - ¥{drink.price}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 px-4 py-3 rounded-lg border focus:outline-none text-center"
              style={{ borderColor: 'var(--color-border)', minHeight: '44px' }}
            />
            <Button onClick={addItem} disabled={!selectedDrink}>
              <Plus size={18} />
              添加
            </Button>
          </div>

          <div className="space-y-3">
            {saleItems.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl"
                style={{ backgroundColor: 'var(--color-alternate-row)' }}
              >
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  选择饮品并添加到订单
                </p>
              </div>
            ) : (
              saleItems.map((item, index) => {
                const drink = getDrinkById(item.drinkId);
                const totals = calculateItemTotal(item);
                const profitMargin = drink
                  ? (((drink.price - totals.cost / item.quantity) / drink.price) * 100).toFixed(1)
                  : '0';
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl animate-slide-in"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      animationDelay: `${index * 0.03}s`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-card-bg)' }}
                      >
                        <Coffee size={18} style={{ color: 'var(--color-sidebar)' }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {drink?.name}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          数量: {item.quantity} × ¥{drink?.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          ¥{totals.subtotal.toFixed(2)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-classic-tag)' }}>
                          利润 ¥{totals.profit.toFixed(2)} ({profitMargin}%)
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: 'var(--color-warning)' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full md:w-80 p-6 flex flex-col" style={{ backgroundColor: 'var(--color-alternate-row)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            当前订单
          </h2>

          <div className="flex-1">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>商品小计</span>
                <span style={{ color: 'var(--color-text-primary)' }}>¥{currentOrderTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>成本预估</span>
                <span style={{ color: 'var(--color-text-primary)' }}>¥{currentOrderCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    预计利润
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--color-classic-tag)' }}>
                    ¥{currentOrderProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                共 {saleItems.length} 件商品
              </span>
              <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                ¥{currentOrderTotal.toFixed(2)}
              </span>
            </div>
            <Button
              fullWidth
              onClick={handleSubmitSale}
              disabled={saleItems.length === 0 || loading}
            >
              确认收款
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
