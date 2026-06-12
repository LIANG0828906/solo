import { useEffect, useState, useMemo } from 'react';
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
  User,
  Sparkles,
  Check,
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
      className="rounded-full flex items-center justify-center text-white font-bold shadow-md"
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
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
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

        {order.statusHistory.length > 0 && (
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
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
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
}: {
  email: string;
  onApply: (pref: { hardwareColor: HardwareColor; engravingText: string }) => void;
}) {
  const { fetchPreference, preferences } = useStore();
  const [show, setShow] = useState(false);
  const pref = preferences[email];

  useEffect(() => {
    if (!email) return;
    fetchPreference(email).then((p) => {
      if (p) setShow(true);
    });
  }, [email, fetchPreference]);

  if (!show || !pref) return null;

  return (
    <div className="animate-slide-in-right fixed right-4 top-24 z-50 w-72 bg-[#FFF8E7] border border-[#D2B48C] rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#D2B48C] to-[#8B4513] text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} />
          为您推荐历史偏好
        </div>
        <button
          onClick={() => setShow(false)}
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
                style={{ backgroundColor: HARDWARE_COLORS[pref.hardwareColor] }}
              />
              <span className="text-[#8B4513] font-medium">
                {HARDWARE_LABELS[pref.hardwareColor]}
              </span>
            </div>
          </div>
        )}
        {pref.engravingText && (
          <div className="flex items-center justify