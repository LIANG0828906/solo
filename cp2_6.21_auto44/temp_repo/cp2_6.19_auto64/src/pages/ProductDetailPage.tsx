import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Droplets,
  Package,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react';
import { UsageSlider, QuickUsageButtons } from '@/components/UsageSlider';
import { UsageChart } from '@/components/UsageChart';
import { useProductById, useProductUsageLogs, useStore } from '@/store/useStore';
import {
  getRemainingPercent,
  getEstimatedFinishDate,
  getEstimatedDaysLeft,
  getProductStatus,
  isLowStock,
  getExpireDate,
} from '@/utils/productUtils';
import { getProgressGradient, getTypeColor } from '@/utils/colorUtils';
import { formatDisplayDate } from '@/utils/dateUtils';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProductById(id || '');
  const usageLogs = useProductUsageLogs(id || '');
  const addUsageLog = useStore((state) => state.addUsageLog);
  const deleteProduct = useStore((state) => state.deleteProduct);

  const [showPanel, setShowPanel] = useState(false);
  const [usageAmount, setUsageAmount] = useState(2);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const remainingPercent = useMemo(() => product ? getRemainingPercent(product) : 0, [product]);
  const estimatedFinish = useMemo(() => product ? getEstimatedFinishDate(product, usageLogs) : null, [product, usageLogs]);
  const daysLeft = useMemo(() => product ? getEstimatedDaysLeft(product, usageLogs) : null, [product, usageLogs]);
  const status = useMemo(() => product ? getProductStatus(product) : '进行中', [product]);
  const lowStock = useMemo(() => product ? isLowStock(product) : false, [product]);
  const progressColor = useMemo(() => getProgressGradient(remainingPercent), [remainingPercent]);
  const typeColor = useMemo(() => product ? getTypeColor(product.type) : '#ccc', [product]);
  const expireDate = useMemo(() => product ? getExpireDate(product) : new Date(), [product]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">产品不存在</h3>
        <button
          onClick={() => navigate('/inventory')}
          className="px-6 py-2 bg-primary text-white rounded-xl mt-4"
        >
          返回库存
        </button>
      </div>
    );
  }

  const handleRecordUsage = () => {
    if (id && usageAmount > 0) {
      addUsageLog(id, usageAmount);
      setShowPanel(false);
      setUsageAmount(2);
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteProduct(id);
      navigate('/inventory');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">产品详情</h1>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 md:p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: typeColor }}
              >
                {product.type}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                status === '进行中' ? 'bg-success/20 text-success' :
                status === '已过期' ? 'bg-warning/20 text-warning' :
                'bg-gray-200 text-gray-500'
              }`}>
                {status}
              </span>
              {lowStock && status === '进行中' && (
                <span className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium bg-warning/20 text-warning animate-pulseSlow">
                  <AlertTriangle className="w-4 h-4" />
                  库存不足
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h2>
            <p className="text-xl text-gray-500">{product.brand}</p>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 rounded-xl text-gray-400 hover:text-warning hover:bg-warning/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">剩余容量</span>
            <span className="text-2xl font-bold text-gray-800">
              {remainingPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${remainingPercent}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>已用 {product.usedAmount.toFixed(1)} ml/g</span>
            <span>总容量 {product.capacity.toFixed(0)} ml/g</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-gray-600">开封日期</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {formatDisplayDate(product.openDate)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-gray-600">过期日期</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {formatDisplayDate(expireDate)}
            </p>
            <p className="text-sm text-gray-500">保质期 {product.shelfLife} 个月</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-5 h-5 text-primary" />
              <span className="text-gray-600">预计用完</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {estimatedFinish ? formatDisplayDate(estimatedFinish) : '暂无数据'}
            </p>
            {daysLeft !== null && (
              <p className="text-sm text-gray-500">还剩约 {daysLeft} 天</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-gray-600">累计使用记录</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {usageLogs.length} 次
            </p>
            <p className="text-sm text-gray-500">
              总用量 {usageLogs.reduce((sum, log) => sum + log.amount, 0).toFixed(1)} ml/g
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPanel(true)}
          disabled={status !== '进行中'}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          记录今日使用
        </button>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 md:p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">近7天使用趋势</h3>
        <UsageChart productId={product.id} usageLogs={usageLogs} height={250} />
      </div>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPanel(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slideUp p-6 pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              记录使用量
            </h3>

            <div className="space-y-6 mb-8">
              <QuickUsageButtons value={usageAmount} onChange={setUsageAmount} />
              <UsageSlider
                value={usageAmount}
                onChange={setUsageAmount}
                min={0.5}
                max={20}
                step={0.5}
              />
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">近7天使用记录</h4>
              <UsageChart productId={product.id} usageLogs={usageLogs} height={150} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPanel(false)}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleRecordUsage}
                className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark active:scale-95 transition-all duration-200 shadow-md"
              >
                确认记录
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 animate-scaleIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除「{product.name}」吗？所有使用记录也会被删除，此操作不可恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-warning text-white font-medium hover:bg-warning/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
