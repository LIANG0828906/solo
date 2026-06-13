import { useState, useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Instrument } from '../types';
import { cn } from '@/lib/utils';
import apiClient from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Props {
  instrument: Instrument;
  isLoggedIn: boolean;
}

export default function RentalForm({ instrument, isLoggedIn }: Props) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const { totalDays, totalRent } = useMemo(() => {
    if (!startDate || !endDate) return { totalDays: 0, totalRent: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) return { totalDays: 0, totalRent: 0 };
    return { totalDays: days, totalRent: days * instrument.dailyRate };
  }, [startDate, endDate, instrument.dailyRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/instrument/${instrument.id}` } });
      return;
    }

    if (!startDate || !endDate) {
      setError('请选择租赁起止日期');
      return;
    }

    if (totalDays <= 0) {
      setError('结束日期必须晚于或等于开始日期');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await apiClient.post('/orders', {
        instrumentId: instrument.id,
        startDate,
        endDate,
      });
      if (data.success !== false) {
        navigate('/profile');
      } else {
        setError(data.error || '提交订单失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '提交订单失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">请先登录后再提交租赁订单</p>
        <button
          onClick={() => navigate('/login', { state: { from: `/instrument/${instrument.id}` } })}
          className="px-6 py-2.5 bg-[#4CAF50] hover:bg-[#2E7D32] text-white rounded-lg font-medium transition-colors"
        >
          去登录
        </button>
      </div>
    );
  }

  const isDisabled = instrument.status !== 'available';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">租赁信息</h3>

      {isDisabled && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
          该乐器当前已被租出，暂不可租赁
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="inline w-4 h-4 mr-1" />
            开始日期
          </label>
          <input
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isDisabled || submitting}
            className={cn(
              'w-full px-3 py-2.5 border border-gray-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400',
              'disabled:bg-gray-100 disabled:cursor-not-allowed'
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="inline w-4 h-4 mr-1" />
            结束日期
          </label>
          <input
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isDisabled || submitting}
            className={cn(
              'w-full px-3 py-2.5 border border-gray-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400',
              'disabled:bg-gray-100 disabled:cursor-not-allowed'
            )}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>日租金</span>
          <span>¥{instrument.dailyRate}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>租赁天数</span>
          <span>{totalDays > 0 ? `${totalDays} 天` : '-'}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>押金</span>
          <span>¥{instrument.deposit}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-medium text-gray-900">租金合计</span>
          <span className="text-xl font-bold text-[#8B5A2B]">
            {totalDays > 0 ? `¥${totalRent}` : '-'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled || submitting || totalDays <= 0}
        className={cn(
          'w-full py-3 rounded-lg font-medium text-white transition-all',
          'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32]',
          'hover:from-[#45a049] hover:to-[#266829]',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#4CAF50] disabled:hover:to-[#2E7D32]'
        )}
      >
        {submitting ? '提交中...' : '提交租赁订单'}
      </button>
    </form>
  );
}
