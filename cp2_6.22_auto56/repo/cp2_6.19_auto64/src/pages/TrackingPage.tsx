import { useState, useMemo } from 'react';
import { BarChart3, Droplets, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { UsageChart } from '@/components/UsageChart';
import { UsageSlider, QuickUsageButtons } from '@/components/UsageSlider';
import { useProducts, useUsageLogs, useStore } from '@/store/useStore';
import { getProductStatus, get7DayAverageUsage } from '@/utils/productUtils';
import { getTypeColor } from '@/utils/colorUtils';
import type { Product } from '@/types';

interface UsageRecord {
  productId: string;
  amount: number;
}

export const TrackingPage = () => {
  const products = useProducts();
  const usageLogs = useUsageLogs();
  const addUsageLog = useStore((state) => state.addUsageLog);

  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [usageAmounts, setUsageAmounts] = useState<Record<string, number>>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeProducts = useMemo(() => {
    return products.filter((p) => getProductStatus(p) === '进行中');
  }, [products]);

  const toggleProduct = (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      if (!usageAmounts[productId]) {
        const avgUsage = get7DayAverageUsage(productId, usageLogs);
        setUsageAmounts((prev) => ({
          ...prev,
          [productId]: avgUsage > 0 ? Math.round(avgUsage * 2) / 2 : 2,
        }));
      }
    }
  };

  const toggleSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const updateAmount = (productId: string, amount: number) => {
    setUsageAmounts((prev) => ({ ...prev, [productId]: amount }));
  };

  const handleQuickAdd = (product: Product) => {
    const avgUsage = get7DayAverageUsage(product.id, usageLogs);
    const defaultAmount = avgUsage > 0 ? Math.round(avgUsage * 2) / 2 : 2;
    addUsageLog(product.id, defaultAmount);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleBatchSubmit = () => {
    const records: UsageRecord[] = selectedProducts
      .filter((id) => usageAmounts[id] > 0)
      .map((id) => ({
        productId: id,
        amount: usageAmounts[id],
      }));

    records.forEach((record) => {
      addUsageLog(record.productId, record.amount);
    });

    setSelectedProducts([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const allSelected = activeProducts.length > 0 && selectedProducts.length === activeProducts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(activeProducts.map((p) => p.id));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">使用追踪</h1>
        <p className="text-gray-500">
          记录每日护肤品使用量，追踪使用习惯
        </p>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-800">近7天使用频率</h3>
        </div>
        <UsageChart usageLogs={usageLogs} height={250} showAmount={false} />
        <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {usageLogs.filter((log) => {
                const today = new Date();
                const logDate = new Date(log.date);
                return logDate.toDateString() === today.toDateString();
              }).length}
            </p>
            <p className="text-sm text-gray-500">今日已记录</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {new Set(usageLogs.slice(0, 50).map((log) => log.productId)).size}
            </p>
            <p className="text-sm text-gray-500">使用产品数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {usageLogs.length}
            </p>
            <p className="text-sm text-gray-500">总记录次数</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800">今日使用记录</h3>
          </div>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
        </div>

        {activeProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-primary" />
            </div>
            <p className="text-gray-500">还没有正在使用的产品</p>
            <p className="text-sm text-gray-400 mt-1">先去库存页面添加吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProducts.map((product) => {
              const isExpanded = expandedProduct === product.id;
              const isSelected = selectedProducts.includes(product.id);
              const amount = usageAmounts[product.id] || 2;
              const typeColor = getTypeColor(product.type);

              return (
                <div
                  key={product.id}
                  className={`border-2 rounded-xl transition-all duration-200 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-gray-100'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleProduct(product.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(product.id);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: typeColor }}
                    >
                      {product.type.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(product);
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      + 快速记录
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-9 space-y-4 pt-4 border-t border-gray-100">
                        <QuickUsageButtons
                          value={amount}
                          onChange={(v) => updateAmount(product.id, v)}
                        />
                        <UsageSlider
                          value={amount}
                          onChange={(v) => updateAmount(product.id, v)}
                          min={0.5}
                          max={20}
                          step={0.5}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleBatchSubmit}
              className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              批量记录 {selectedProducts.length} 件产品
            </button>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-lg animate-scaleIn flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">记录成功！</span>
        </div>
      )}
    </div>
  );
};
