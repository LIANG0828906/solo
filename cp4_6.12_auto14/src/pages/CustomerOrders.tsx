import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  Key,
  CircleDot,
  Belt,
  Upload,
  Plus,
  X,
  ArrowLeft,
  Sparkles,
  Check,
  Calendar,
  Palette,
  Type,
  User,
  Mail,
} from 'lucide-react';
import {
  useStore,
  type Order,
  type ProductType,
  type HardwareColor,
  STATUS_LIST,
  STATUS_LABELS,
  STATUS_COLORS,
  PRODUCT_LABELS,
  HARDWARE_LABELS,
  HARDWARE_COLORS,
} from '../store/useStore';

const PRODUCT_ICONS: Record<ProductType, typeof Wallet> = {
  wallet: Wallet,
  cardholder: CreditCard,
  keychain: Key,
  bracelet: CircleDot,
  belt: Belt,
};

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 60%)`;
}

function hashGradient(name: string): string {
  const c1 = hashColor(name);
  const c2 = hashColor(name + 'salt');
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size / 2.8,
        background: hashGradient(name),
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const Icon = PRODUCT_ICONS[order.productType];
  return (
    <div
      onClick={onClick}
      className="card-hover bg-white rounded-xl p-5 shadow-sm border border-[#D2B48C]/40 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F5F0E1, #E8DCC4)' }}
          >
            <Icon size={22} style={{ color: '#8B4513' }} />
          </div>
          <div>
            <div className="font-semibold text-[#3E2723]">
              {PRODUCT_LABELS[order.productType]}
            </div>
            <div className="text-xs text-[#8B7355]">#{order.id}</div>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0"
          style={{ backgroundColor: STATUS_COLORS[order.status] }}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-[#F0E6D2]">
        <Avatar name={order.customerName} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#5D4037] text-sm truncate">
            {order.customerName}
          </div>
          <div className="text-xs text-[#8B7355] truncate">
            {order.customerEmail}
          </div>
        </div>
        <div className="text-right text-xs text-[#8B7355]">
          {order.engravingText && (
            <div className="flex items-center gap-1 justify-end">
              <Sparkles size={12} />
              <span>刻字</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ status }: { status: Order['status'] }) {
  const idx = STATUS_LIST.indexOf(status);
  const pct = ((idx + 1) / STATUS_LIST.length) * 100;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 30);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="h-3 bg-[#F0E6D2] rounded-full overflow-hidden mb-3">
        <div
          className="h-full progress-fill rounded-full"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <div className="flex justify-between gap-1">
        {STATUS_LIST.map((s, i) => (
          <div key={s} className="flex flex-col items-center flex-1">
            <div
              className={`w-3 h-3 rounded-full border-2 ${
                i <= idx ? 'border-[#8B4513]' : 'border-[#D2B48C]'
              }`}
              style={{
                backgroundColor: i <= idx ? STATUS_COLORS[s] : 'transparent',
              }}
            />
            <div
              className={`text-[10px] mt-1 text-center ${
                i <= idx ? 'text-[#5D4037] font-medium' : 'text-[#B8A88A]'
              }`}
            >
              {STATUS_LABELS[s]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const Icon = PRODUCT_ICONS[order.productType];
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#D2B48C]/40 overflow-hidden">
      <div className="bg-gradient-to-r from-[#5D4037] to-[#8B4513] text-white p-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#D4A574] hover:text-white mb-3 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          返回订单列表
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {PRODUCT_LABELS[order.productType]} 定制
            </h2>
            <p className="text-[#D4A574] text-sm">订单号 #{order.id}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[#5D4037] mb-3">
            制作进度
          </h3>
          <ProgressBar status={order.status} />
        </div>

        {order.statusHistory && order.statusHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#5D4037] mb-3">
              状态时间线
            </h3>
            <div className="space-y-2">
              {order.statusHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm bg-[#FAF6EC] rounded-lg p-3"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[h.status] }}
                  >
                    <Check size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[#5D4037]">
                      {STATUS_LABELS[h.status]}
                    </div>
                    <div className="text-xs text-[#8B7355]">
                      {new Date(h.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-[#FAF6EC] rounded-lg p-4">
            <Avatar name={order.customerName} size={48} />
            <div>
              <div className="font-semibold text-[#5D4037]">
                {order.customerName}
              </div>
              <div className="text-sm text-[#8B7355]">{order.customerEmail}</div>
            </div>
          </div>
          <div className="bg-[#FAF6EC] rounded-lg p-4">
            <div className="text-xs text-[#8B7355] mb-1">五金颜色</div>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: HARDWARE_COLORS[order.hardwareColor] }}
              />
              <span className="font-medium text-[#5D4037]">
                {HARDWARE_LABELS[order.hardwareColor]}
              </span>
            </div>
          </div>
          {order.engravingText && (
            <div className="bg-[#FAF6EC] rounded-lg p-4">
              <div className="text-xs text-[#8B7355] mb-1">刻字内容</div>
              <div className="font-medium text-[#5D4037]">
                {order.engravingText}
              </div>
            </div>
          )}
          {order.preferredDeliveryDate && (
            <div className="bg-[#FAF6EC] rounded-lg p-4">
              <div className="text-xs text-[#8B7355] mb-1">期望交付日期</div>
              <div className="font-medium text-[#5D4037]">
                {order.preferredDeliveryDate}
              </div>
            </div>
          )}
        </div>

        {order.referenceImage && (
          <div>
            <h3 className="text-sm font-semibold text-[#5D4037] mb-2">
              设计参考图
            </h3>
            <img
              src={order.referenceImage}
              alt="参考图"
              className="max-w-md rounded-lg border border-[#D2B48C]/50"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PreferenceCard({
  email,
  onApply,
  visible,
  onClose,
}: {
  email: string;
  onApply: (pref: { hardwareColor: HardwareColor; engravingText: string }) => void;
  visible: boolean;
  onClose: () => void;
}) {
  const { preferences } = useStore();
  const pref = preferences[email];

  if (!visible || !pref) return null;

  const hasAnyPref = pref.hardwareColor || pref.engravingText;
  if (!hasAnyPref) return null;

  return (
    <div className="animate-slide-in-right fixed right-4 top-24 z-50 w-72 bg-[#FFF8E7] border border-[#D2B48C] rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#D2B48C] to-[#8B4513] text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} />
          为您推荐历史偏好
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded p-0.5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-xs text-[#8B7355]">
          您已在本店下单 {pref.orderCount} 次
        </div>
        {pref.hardwareColor && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5D4037]">五金颜色</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white shadow"
                style={{ backgroundColor: HARDWARE_COLORS[pref.hardwareColor as HardwareColor] }}
              />
              <span className="text-[#8B4513] font-medium">
                {HARDWARE_LABELS[pref.hardwareColor as HardwareColor]}
              </span>
            </div>
          </div>
        )}
        {pref.engravingText && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5D4037]">常用刻字</span>
            <span className="text-[#8B4513] font-medium">
              {pref.engravingText}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            onApply({
              hardwareColor: (pref.hardwareColor as HardwareColor) || 'bronze',
              engravingText: pref.engravingText || '',
            });
          }}
          className="w-full mt-2 py-2 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          一键应用偏好
        </button>
      </div>
    </div>
  );
}

function NewOrderForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: (order: Order) => void }) {
  const { createOrder, fetchPreference } = useStore();
  const [productType, setProductType] = useState<ProductType>('wallet');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [engravingText, setEngravingText] = useState('');
  const [hardwareColor, setHardwareColor] = useState<HardwareColor>('bronze');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPrefCard, setShowPrefCard] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailBlurTimeout = useRef<number | null>(null);

  const handleEmailBlur = useCallback(() => {
    if (emailBlurTimeout.current) {
      clearTimeout(emailBlurTimeout.current);
    }
    emailBlurTimeout.current = window.setTimeout(async () => {
      if (customerEmail && customerEmail.includes('@')) {
        const pref = await fetchPreference(customerEmail);
        if (pref && (pref.hardwareColor || pref.engravingText)) {
          setShowPrefCard(true);
        } else {
          setShowPrefCard(false);
        }
      } else {
        setShowPrefCard(false);
      }
    }, 500);
  }, [customerEmail, fetchPreference]);

  const applyPreference = (pref: { hardwareColor: HardwareColor; engravingText: string }) => {
    if (pref.hardwareColor) setHardwareColor(pref.hardwareColor);
    if (pref.engravingText) setEngravingText(pref.engravingText);
    setShowPrefCard(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReferenceImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('请输入您的姓名');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = await createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        productType,
        engravingText: engravingText.trim(),
        hardwareColor,
        preferredDeliveryDate,
        referenceImage,
      });
      onSuccess(newOrder);
    } catch (err) {
      setError((err as Error).message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PreferenceCard
        email={customerEmail}
        onApply={applyPreference}
        visible={showPrefCard}
        onClose={() => setShowPrefCard(false)}
      />

      <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-gradient-to-r from-[#5D4037] to-[#8B4513] text-white p-5 flex items-center justify-between z-10">
            <div>
              <h3 className="text-lg font-bold">提交定制需求</h3>
              <p className="text-[#D4A574] text-sm">匠心打造，独一无二</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <User size={16} />
                您的姓名
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#D2B48C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] bg-[#FAF6EC] text-[#3E2723]"
                placeholder="请输入您的姓名"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <Mail size={16} />
                电子邮箱
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="w-full px-4 py-2.5 border border-[#D2B48C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] bg-[#FAF6EC] text-[#3E2723]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-3">
                <Wallet size={16} />
                皮具类型
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(PRODUCT_LABELS) as ProductType[]).map((type) => {
                  const Icon = PRODUCT_ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProductType(type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${
                        productType === type
                          ? 'border-[#8B4513] bg-[#F5F0E1]'
                          : 'border-[#E8DCC4] bg-white hover:border-[#D2B48C]'
                      }`}
                    >
                      <Icon
                        size={20}
                        style={{ color: productType === type ? '#8B4513' : '#8B7355' }}
                      />
                      <span
                        className={`text-xs font-medium ${
                          productType === type ? 'text-[#5D4037]' : 'text-[#8B7355]'
                        }`}
                      >
                        {PRODUCT_LABELS[type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-3">
                <Palette size={16} />
                五金颜色偏好
              </label>
              <div className="flex gap-4">
                {(Object.keys(HARDWARE_LABELS) as HardwareColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setHardwareColor(color)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                      hardwareColor === color
                        ? 'border-[#8B4513] bg-[#F5F0E1]'
                        : 'border-[#E8DCC4] bg-white hover:border-[#D2B48C]'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: HARDWARE_COLORS[color] }}
                    />
                    <span
                      className={`text-sm font-medium ${
                        hardwareColor === color ? 'text-[#5D4037]' : 'text-[#8B7355]'
                      }`}
                    >
                      {HARDWARE_LABELS[color]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <Type size={16} />
                刻字内容（选填）
              </label>
              <input
                type="text"
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2.5 border border-[#D2B48C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] bg-[#FAF6EC] text-[#3E2723]"
                placeholder="请输入要刻的文字，最多30字"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <Calendar size={16} />
                期望交付日期（选填）
              </label>
              <input
                type="date"
                value={preferredDeliveryDate}
                onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#D2B48C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] bg-[#FAF6EC] text-[#3E2723]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5D4037] mb-2">
                <Upload size={16} />
                设计参考图（选填）
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D2B48C] rounded-lg p-6 text-center cursor-pointer hover:border-[#8B4513] hover:bg-[#FAF6EC] transition-all duration-200"
              >
                {referenceImage ? (
                  <div className="relative">
                    <img
                      src={referenceImage}
                      alt="参考图"
                      className="max-h-32 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReferenceImage(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-[#8B7355]">
                    <Upload size={28} className="mx-auto mb-2" />
                    <p className="text-sm">点击上传参考图片</p>
                    <p className="text-xs mt-1">支持 JPG、PNG 格式</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? '提交中...' : '提交定制需求'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function CustomerOrders() {
  const { orders, fetchOrders, loading } = useStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const selectedOrder = id ? orders.find((o) => o.id === Number(id)) : null;

  const handleOrderClick = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleOrderCreated = (order: Order) => {
    setShowForm(false);
    navigate(`/orders/${order.id}`);
  };

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={handleBack} />;
  }

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#5D4037]">我的订单</h1>
          <p className="text-[#8B7355] text-sm mt-1">
            共 {orders.length} 个订单
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus size={18} />
          提交新订单
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#D2B48C] border-t-[#8B4513] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#D2B48C]/40">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F0E1] flex items-center justify-center">
            <Wallet size={28} style={{ color: '#8B4513' }} />
          </div>
          <h3 className="text-lg font-medium text-[#5D4037] mb-2">
            还没有订单
          </h3>
          <p className="text-[#8B7355] text-sm mb-5">
            点击上方按钮，开启您的专属皮具定制之旅
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus size={18} />
            立即定制
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <NewOrderForm
          onClose={() => setShowForm(false)}
          onSuccess={handleOrderCreated}
        />
      )}
    </div>
  );
}
