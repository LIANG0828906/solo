import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, FileText, Send, AlertCircle } from 'lucide-react';
import type { DeliveryDate, DeliveryTimeSlot } from '@/types';
import { useFlowerStore } from '@/store/useFlowerStore';
import { createOrder } from '@/api/api';

const MAX_NOTES_LENGTH = 200;

function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function isTimeSlotAvailable(date: DeliveryDate, slot: DeliveryTimeSlot): boolean {
  if (date === 'tomorrow') return true;
  const now = new Date();
  const hour = now.getHours();
  if (slot === '9-12') return hour < 12;
  if (slot === '14-18') return hour < 18;
  return true;
}

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

  const availableSlots = useMemo(() => {
    const slots: DeliveryTimeSlot[] = ['9-12', '14-18'];
    return slots.filter((s) => isTimeSlotAvailable(date, s));
  }, [date]);

  const isTodayAvailable = useMemo(() => {
    const now = new Date();
    return now.getHours() < 18;
  }, []);

  const dateLabels: Record<DeliveryDate, string> = {
    today: '今天',
    tomorrow: '明天',
  };
  const timeLabels: Record<DeliveryTimeSlot, string> = {
    '9-12': '9:00 - 12:00',
    '14-18': '14:00 - 18:00',
  };

  const handleDateChange = (d: DeliveryDate) => {
    setDate(d);
    if (d === 'today' && !isTimeSlotAvailable(d, timeSlot)) {
      setTimeSlot(availableSlots[0] || '9-12');
    }
  };

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
    if (!isTimeSlotAvailable(date, timeSlot)) {
      setError('所选配送时段已过，请重新选择');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(bouquetItems, totalPrice, {
        address: sanitizeText(address.trim()),
        date,
        timeSlot,
        notes: sanitizeText(notes.trim()),
      });
      setCurrentOrder(order);
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const notesRemaining = MAX_NOTES_LENGTH - notes.length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
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
          maxLength={200}
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
          {(['today', 'tomorrow'] as DeliveryDate[]).map((d) => {
            const disabled = d === 'today' && !isTodayAvailable;
            return (
              <button
                key={d}
                type="button"
                onClick={() => !disabled && handleDateChange(d)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                  ${disabled
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : date === d
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                      : 'bg-cream-50 text-gray-600 hover:bg-rose-50'
                  }`}
              >
                {dateLabels[d]}
                {disabled && <span className="block text-xs opacity-60">已过配送时段</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
          <Clock size={20} className="text-rose-400" />
          配送时段
        </div>
        <div className="flex gap-3">
          {(['9-12', '14-18'] as DeliveryTimeSlot[]).map((t) => {
            const available = isTimeSlotAvailable(date, t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => available && setTimeSlot(t)}
                disabled={!available}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300
                  ${!available
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                    : timeSlot === t
                      ? 'bg-sage-300 text-gray-800 shadow-md'
                      : 'bg-cream-50 text-gray-600 hover:bg-sage-50'
                  }`}
              >
                {timeLabels[t]}
                {!available && date === 'today' && (
                  <span className="block text-xs opacity-60">已过时段</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 font-display text-lg">
            <FileText size={20} className="text-rose-400" />
            特殊备注
          </div>
          <span className={`text-xs ${notesRemaining < 30 ? 'text-amber-500' : 'text-gray-300'}`}>
            {notesRemaining}/200
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            if (e.target.value.length <= MAX_NOTES_LENGTH) {
              setNotes(e.target.value);
            }
          }}
          placeholder="如需附带贺卡，请填写贺卡文字..."
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
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
