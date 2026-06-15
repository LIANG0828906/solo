import { useEffect, useState } from 'react';
import { Clock, Coffee, Package, CheckCircle } from 'lucide-react';
import { getOrder } from '@/api';
import type { Order, OrderStatus } from '@/types';

interface OrderProgressProps {
  orderId: string;
}

const statusSteps: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: 'submitted', label: '已提交', icon: Clock },
  { key: 'preparing', label: '制作中', icon: Coffee },
  { key: 'ready', label: '取餐中', icon: Package },
  { key: 'completed', label: '已完成', icon: CheckCircle },
];

export default function OrderProgress({ orderId }: OrderProgressProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error('获取订单状态失败:', error);
      }
    };

    fetchOrderStatus();

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (!order) {
    return null;
  }

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.key === order.status
  );

  const getStepClass = (index: number) => {
    if (index < currentStatusIndex) return 'completed';
    if (index === currentStatusIndex) return 'active';
    return '';
  };

  const getArrowClass = (index: number) => {
    if (index < currentStatusIndex) return 'filled';
    return '';
  };

  return (
    <div className="order-progress-section">
      <h3 className="order-progress-title">订单进度</h3>
      <div className="order-progress-bar">
        {statusSteps.map((step, index) => {
          const IconComponent = step.icon;
          const stepClass = getStepClass(index);

          return (
            <div key={step.key}>
              {index > 0 && (
                <div className={`progress-arrow ${getArrowClass(index)}`} />
              )}
              <div className="progress-step">
                <div className={`step-icon ${stepClass}`}>
                  <IconComponent size={20} />
                </div>
                <span className={`step-label ${stepClass}`}>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="order-id-text">
        订单号：<span>{order.id.slice(0, 8).toUpperCase()}</span>
      </p>
    </div>
  );
}
