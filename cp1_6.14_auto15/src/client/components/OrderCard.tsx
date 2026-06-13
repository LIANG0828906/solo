import { useState } from 'react';
import { Calendar, Package, User as UserIcon } from 'lucide-react';
import type { Order, Instrument } from '../types';
import { ORDER_STATUS_LABELS } from '../types';
import { cn } from '@/lib/utils';
import apiClient from '../api/client';

interface Props {
  order: Order & { instrument?: Instrument };
  counterpartNickname?: string;
  role: 'owner' | 'renter';
  onStatusChange?: () => void;
}

const statusColorMap: Record<Order['status'], string> = {
  pending: 'bg-orange-500',
  confirmed: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-gray-400',
  rejected: 'bg-red-500',
};

export default function OrderCard({ order, counterpartNickname, role, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: Order['status']) => {
    try {
      setLoading(true);
      await apiClient.patch(`/orders/${order.id}/status`, { status });
      onStatusChange?.();
    } catch (err) {
      console.error('更新订单状态失败', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex">
      <div className={cn('w-1.5 shrink-0', statusColorMap[order.status])} />

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
                {role === 'owner' ? '租用者' : '发布者