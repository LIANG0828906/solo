import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Send, User, DollarSign } from 'lucide-react';
import { useStore } from '../store';
import ConditionBar from '../components/ConditionBar';
import { SkeletonPriceCard } from '../components/Skeleton';
import '../index.css';

export default function DetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { instruments, favorites, toggleFavorite, addBid, addNotification } = useStore();

  const instrument = instruments.find((i) => i.id === id);
  const isFavorite = favorites.includes(id);

  const [priceLoading, setPriceLoading] = useState(true);
  const [buyerName, setBuyerName] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    setPriceLoading(true);
    const timer = setTimeout(() => setPriceLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [id]);

  if (!instrument) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-xl font-medium text-gray-700 mb-4">商品不存在</h3>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2"
          style={{ backgroundColor: '#FF9800' }}
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>
      </div>
    );
  }

  const estimatedPrice = instrument.estimatedPrice || Math.round(instrument.expectedPrice * 0.95);
  const minPrice = Math.round(estimatedPrice * 0.85);
  const maxPrice = Math.round(estimatedPrice * 1.15);
  const minValidBid = Math.round(instrument.expectedPrice * 0.6);

  const validateBid = () => {
    const amount = Number(bidAmount);
    if (!buyerName.trim()) {
      setBidError('请输入您的姓名');
      return false;
    }
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      setBidError('请输入有效的出价金额');
      return false;
    }
    if (amount < minValidBid) {
      setBidError(`出价不能低于期望售价的60% (¥${minValidBid})`);
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      return false;
    }
    setBidError('');
    return true;
  };

  const handleSubmitBid = () => {
    if (!validateBid()) return;
    addBid({
      instrumentId: instrument.id,
      instrumentName: `${instrument.brand} ${instrument.model}`,
      buyerName: buyerName.trim(),
      amount: Number(bidAmount),
    });
    addNotification({ type: 'success', message: '出价提交成功！卖家会尽快审核' });
    setBuyerName('');
    setBidAmount('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <button
          onClick={() => toggleFavorite(id)}
          className="p-3 rounded-full transition-all hover:scale-110"
          style={{
            backgroundColor: isFavorite ? 'rgba(255, 215, 0, 0.15)' : '#f3f4f6',
          }}
        >
          <Star
            className="w-6 h-6 transition-all"
            style={{
              fill: isFavorite ? '#FFD700' : 'none',
              color: isFavorite ? '#FFD700' : '#6B7280',
            }}
          />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:flex-shrink-0">
            <div
              className="w-full overflow-hidden"
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '12px',
              }}
            >
              <img
                src={instrument.image}
                alt={`${instrument.brand} ${instrument.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {instrument.brand} {instrument.model}
              </h1>
              <p className="text-gray-500">{instrument.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="品牌" value={instrument.brand} />
              <InfoRow label="型号" value={instrument.model} />
              <InfoRow label="购买年份" value={`${instrument.purchaseYear}年`} />
              <InfoRow label="使用年限" value={`${instrument.yearsUsed}年`} />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">成色评分</p>
              <ConditionBar condition={instrument.condition} showLabel height="10px" />
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">期望售价</p>
              <p className="text-3xl font-bold" style={{ color: '#FF9800' }}>
                ¥{instrument.expectedPrice.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">商品描述</p>
              <p className="text-gray-700 leading-relaxed">{instrument.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {priceLoading ? (
          <SkeletonPriceCard />
        ) : (
          <div
            className="rounded-xl p-6 relative"
            style={{
              background: '#FFF3E0',
              borderLeft: '4px solid #FF9800',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">平台估价</h3>
                <p className="text-4xl font-bold" style={{ color: '#E65100' }}>
                  ¥{estimatedPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  建议价格浮动范围：<span className="font-medium">±15%</span>
                </p>
                <p className="text-sm" style={{ color: '#EF6C00' }}>
                  约 ¥{minPrice.toLocaleString()} ~ ¥{maxPrice.toLocaleString()}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 152, 0, 0.15)' }}
              >
                <DollarSign className="w-7 h-7" style={{ color: '#FF9800' }} />
              </div>
            </div>
            <div className="pt-4 border-t border-orange-200/50">
              <p className="text-sm text-gray-600">
                <span className="font-medium" style={{ color: '#E65100' }}>估价依据：</span>
                基于同型号乐器近期成交数据 {instrument.yearsUsed} 年使用年限、
                {instrument.condition}/10 成色评分、当前市场供需情况综合评估。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-5xl mx-auto">
        <h3 className="text-lg font-bold mb-4">出价购买</h3>

        <div
          className={`space-y-4 ${shaking ? 'animate-shake' : ''}`}
          style={shaking ? { animation: 'shake 0.3s ease-in-out' } : undefined}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              您的姓名
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="请输入您的姓名"
              className="w-full px-4 py-3 rounded-lg text-gray-800 border-2 border-transparent focus:border-orange-400 focus:outline-none transition-colors"
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              出价金额 (元)
            </label>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => {
                setBidAmount(e.target.value);
                setBidError('');
              }}
              placeholder={`最低出价 ¥${minValidBid.toLocaleString()}`}
              className={`w-full px-4 py-3 rounded-lg text-gray-800 border-2 focus:outline-none transition-colors ${
                bidError ? 'border-red-400' : 'border-transparent focus:border-orange-400'
              }`}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            />
          </div>

          {bidError && (
            <p className="text-red-500 text-sm font-medium animate-pulse">
              ⚠ {bidError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              className="flex-1 py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              style={{ backgroundColor: '#FF9800' }}
            >
              <Send className="w-5 h-5" />
              联系卖家 / 出价
            </button>
            <button
              onClick={handleSubmitBid}
              className="flex-1 sm:flex-none px-8 py-4 rounded-xl font-bold text-base border-2 transition-all hover:bg-orange-50"
              style={{
                borderColor: '#FF9800',
                color: '#FF9800',
              }}
            >
              提交出价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
