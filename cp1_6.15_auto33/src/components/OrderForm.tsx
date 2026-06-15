import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, FileText, Send } from 'lucide-react';
import type { DeliveryDate, DeliveryTimeSlot } from '@/types';
import { useFlowerStore } from '@/store/useFlowerStore';
import { createOrder } from '@/api/api';

export default function OrderForm() {
  const navigate = useNavigate();
  const { bouquetItems, getTotalPrice, setCurrentOrder } = useFlowerStore();
  const totalPrice = getTotalPrice();

  const [address, setAddress] = useState('');
  const [date, setDate] = useState<DeliveryDate>('today');
  const [timeSlot, setTimeSlot] = useState<DeliveryTimeSlot>('9-12');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('请填写收货地址');
      return;
    }
    if (bouquetItems.length === 0) {
      setError('花束为空，请先添加花材');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(bouquetItems, totalPrice, {
        address: address.trim(),
        date,
        timeSlot,
        notes: notes.trim(),
      });
      setCurrentOrder(order);
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateLabels: Record<DeliveryDate, string> = {
    today: '今天',
    tomorrow: '明天',
  };
  const timeLabels: Record<DeliveryTimeSlot, string> = {
    '9-12': '9:00 - 12:00',
    '14-18': '14:00 - 18:00',
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
          <MapPin size={20} className="text-rose-400" />
          配送地址
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入收货地址"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-cream-50
                     focus:border-rose-400 focus:bg-white focus:outline-none
                     transition-all duration-300 text-gray-700 placeholder-gray-300"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
          <Calendar size={20} className="text-rose-400" />
          配送日期
        </div>
        <div className="flex gap-3">
          {(['today', 'tomorrow'] as DeliveryDate[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                ${
                  date === d
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'bg-cream-50 text-gray-600 hover:bg-rose-50'
                }`}
            >
              {dateLabels[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
          <Clock size={20} className="text-rose-400" />
          配送时段
        </div>
        <div className="flex gap-3">
          {(['9-12', '14-18'] as DeliveryTimeSlot[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeSlot(t)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                ${
                  timeSlot === t
                    ? 'bg-sage-300 text-gray-800 shadow-md'
                    : 'bg-cream-50 text-gray-600 hover:bg-sage-50'
                }`}
            >
              {timeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
          <FileText size={20} className="text-rose-400" />
          特殊备注
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="如需附带贺卡，请填写贺卡文字..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-cream-50
                     focus:border-rose-400 focus:bg-white focus:outline-none
                     transition-all duration-300 text-gray-700 placeholder-gray-300 resize-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-500">花束总价</span>
          <span className="text-2xl font-display font-bold text-rose-500">¥{totalPrice}</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || bouquetItems.length === 0}
          className={`w-full py-4 rounded-full font-display text-lg font-semibold
                     flex items-center justify-center gap-2 transition-all duration-300
                     ${
                       isSubmitting || bouquetItems.length === 0
                         ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                         : 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 active:scale-95'
                     }`}
        >
          <Send size={18} />
          {isSubmitting ? '提交中...' : '提交订单'}
        </button>
      </div>
    </form>
  );
}
