import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Truck, Clock, MapPin } from 'lucide-react';
import type { Order } from '@/types';
import { fetchOrder } from '@/api/api';

const dateLabels: Record<string, string> = { today: '今天', tomorrow: '明天' };
const timeLabels: Record<string, string> = { '9-12': '9:00 - 12:00', '14-18': '14:00 - 18:00' };

export default function OrderSummary() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : '获取订单失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-rose-300 text-lg font-display">加载订单中...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-400 text-lg">{error || '订单不存在'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className="text-center py-6">
        <CheckCircle size={56} className="text-sage-300 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-gray-800">订单提交成功！</h2>
        <p className="text-gray-400 mt-2">订单编号</p>
        <p className="text-3xl font-display font-bold text-rose-500 mt-1 tracking-wider">
          {order.id}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-4">
        <h3 className="font-display text-lg text-gray-800">花束内容</h3>
        {order.bouquet.items.map((item) => (
          <div key={item.flowerId} className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0">
            <img src={item.flower.image} alt={item.flower.name} className="w-10 h-10 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{item.flower.name}</p>
              <p className="text-xs text-gray-400">¥{item.flower.price} × {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-rose-500">¥{item.flower.price * item.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 border-t-2 border-rose-100">
          <span className="font-display text-gray-600">花束总价</span>
          <span className="text-xl font-display font-bold text-rose-500">¥{order.bouquet.totalPrice}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-flower p-6 space-y-4">
        <h3 className="font-display text-lg text-gray-800">配送信息</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">收货地址</p>
              <p className="text-gray-700">{order.deliveryInfo.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">配送日期</p>
              <p className="text-gray-700">{dateLabels[order.deliveryInfo.date] || order.deliveryInfo.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">预计送达时段</p>
              <p className="text-gray-700 font-semibold">
                {dateLabels[order.deliveryInfo.date] || ''} {timeLabels[order.deliveryInfo.timeSlot] || order.deliveryInfo.timeSlot}
              </p>
            </div>
          </div>
          {order.deliveryInfo.notes && (
            <div className="pt-2 border-t border-rose-50">
              <p className="text-sm text-gray-400 mb-1">备注</p>
              <p className="text-gray-600 italic">"{order.deliveryInfo.notes}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-sm text-gray-400">
          下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  );
}
