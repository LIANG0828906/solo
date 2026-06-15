import { useState } from 'react';
import { Calendar, Package, User as UserIcon } from 'lucide-react';
import type { Order, Instrument, OrderStatus } from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types';
import { cn } from '@/lib/utils';
import { updateOrderStatus } from '../api/client';

interface Props {
  order: Order & { instrument?: Instrument };
  counterpartNickname?: string;
  role: 'owner' | 'renter';
  onStatusChange?: () => void;
}

export default function OrderCard({ order, counterpartNickname, role, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      setLoading(true);
      await updateOrderStatus(order.id, status);
      onStatusChange?.();
    } catch (err) {
      console.error('更新订单状态失败', err);
    } finally {
      setLoading(false);
    }
  };

  const isStartDateNotReached = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(order.startDate);
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const renderActionButtons = () => {
    if (role === 'owner') {
      if (order.status === 'pending') {
        return (
          <>
            <button
              onClick={() => handleStatusChange('confirmed')}
              disabled={loading}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? '处理中...' : '确认'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? '处理中...' : '拒绝'}
            </button>
          </>
        );
      }
      if (order.status === 'confirmed') {
        return (
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? '处理中...' : '标记完成'}
          </button>
        );
      }
    }

    if (role === 'renter') {
      if (order.status === 'pending') {
        return (
          <button
            onClick={() => handleStatusChange('cancelled')}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? '处理中...' : '取消订单'}
          </button>
        );
      }
      if (order.status === 'confirmed' && isStartDateNotReached()) {
        return (
          <button
            onClick={() => handleStatusChange('cancelled')}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? '处理中...' : '取消订单'}
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex">
      <div className={cn('w-1.5 shrink-0', ORDER_STATUS_COLORS[order.status])} />

      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {order.instrument?.images?.[0] ? (
              <img
                src={order.instrument.images[0]}
                alt={order.instrument.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">
                {order.instrument?.name || `乐器 #${order.instrumentId}`}
              </h4>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <UserIcon className="w-3.5 h-3.5" />
                {role === 'owner' ? '租用者' : '发布者'}：{counterpartNickname || '未知'}
              </div>
            </div>
          </div>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium text-white',
              ORDER_STATUS_COLORS[order.status]
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            {order.startDate} 至 {order.endDate}（共 {order.totalDays} 天）
          </div>
          <div className="text-sm text-gray-600">
            总租金 <span className="font-semibold text-[#8B5A2B]">¥{order.totalRent}</span>
            <span className="mx-2">+</span>
            押金 <span className="font-semibold text-gray-700">¥{order.deposit}</span>
          </div>
        </div>

        {renderActionButtons() && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            {renderActionButtons()}
          </div>
        )}
      </div>
    </div>
  );
}
