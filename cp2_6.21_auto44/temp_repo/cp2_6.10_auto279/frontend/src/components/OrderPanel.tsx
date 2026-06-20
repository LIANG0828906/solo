import type { Order } from '@/types';
import { ELEMENT_ICONS, ELEMENT_NAMES } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import { Clock, Star, CheckCircle, XCircle } from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

const OrderCard = ({ order }: OrderCardProps) => {
  const { requirements, difficulty, reward, remainingTime, completed, timeLimit } = order;
  
  const progress = (remainingTime / timeLimit) * 100;
  const isUrgent = remainingTime <= 10;
  
  const renderRequirements = () => {
    const items: JSX.Element[] = [];
    
    if (requirements.minFire) {
      items.push(
        <span key="fire" className="flex items-center gap-1 text-orange-400">
          {ELEMENT_ICONS.fire} ×{requirements.minFire}
        </span>
      );
    }
    if (requirements.minWater) {
      items.push(
        <span key="water" className="flex items-center gap-1 text-blue-400">
          {ELEMENT_ICONS.water} ×{requirements.minWater}
        </span>
      );
    }
    if (requirements.minEarth) {
      items.push(
        <span key="earth" className="flex items-center gap-1 text-amber-700">
          {ELEMENT_ICONS.earth} ×{requirements.minEarth}
        </span>
      );
    }
    if (requirements.minWind) {
      items.push(
        <span key="wind" className="flex items-center gap-1 text-green-400">
          {ELEMENT_ICONS.wind} ×{requirements.minWind}
        </span>
      );
    }
    
    if (requirements.requiredElements) {
      requirements.requiredElements.forEach((el, idx) => {
        items.push(
          <span key={`req-${idx}`} className="flex items-center gap-1 text-purple-400">
            {ELEMENT_ICONS[el]} {ELEMENT_NAMES[el]}
          </span>
        );
      });
    }
    
    return items.length > 0 ? items : <span className="text-gray-400">无特殊要求</span>;
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
      />
    ));
  };

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        completed
          ? 'bg-green-900/30 border-green-500/50'
          : remainingTime <= 0
          ? 'bg-red-900/30 border-red-500/50'
          : 'bg-gray-800/60 border-gray-600/50 hover:border-orange-500/50'
      }`}
    >
      {completed && (
        <div className="absolute top-2 right-2">
          <CheckCircle size={20} className="text-green-400" />
        </div>
      )}
      {remainingTime <= 0 && !completed && (
        <div className="absolute top-2 right-2">
          <XCircle size={20} className="text-red-400" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-bold ${completed ? 'text-green-400' : remainingTime <= 0 ? 'text-red-400' : 'text-white'}`}>
          {order.title}
        </h3>
        <div className="flex">{renderStars(difficulty)}</div>
      </div>
      
      <p className="text-sm text-gray-400 mb-3">{order.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        {renderRequirements()}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">+{reward}分</span>
        </div>
        
        {!completed && remainingTime > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={14} className={isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400'} />
            <span className={`text-sm font-mono ${isUrgent ? 'text-red-400' : 'text-gray-300'}`}>
              {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        
        {completed && <span className="text-sm text-green-400">已完成</span>}
        {remainingTime <= 0 && !completed && <span className="text-sm text-red-400">已超时</span>}
      </div>
      
      {!completed && remainingTime > 0 && (
        <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-red-500' : progress > 50 ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const OrderPanel = () => {
  const { orders, currentPeriod, periodTimeRemaining } = useGameStore();
  
  const activeOrders = orders.filter((o) => !o.completed && o.remainingTime > 0);
  const completedOrders = orders.filter((o) => o.completed);
  const failedOrders = orders.filter((o) => !o.completed && o.remainingTime <= 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <span>📜</span>
            订单面板
          </h2>
        </div>
        
        <div className="bg-gray-800/60 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">当前旬期</span>
            <span className="text-orange-400 font-bold">第 {currentPeriod} 旬</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-400">剩余时间</span>
            <span className={`font-mono font-bold ${periodTimeRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              {formatTime(periodTimeRemaining)}
            </span>
          </div>
          <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                periodTimeRemaining <= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${(periodTimeRemaining / 120) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {activeOrders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <Clock size={14} />
              进行中 ({activeOrders.length})
            </h3>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle size={14} />
              已完成 ({completedOrders.length})
            </h3>
            <div className="space-y-3 opacity-70">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {failedOrders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <XCircle size={14} />
              已失败 ({failedOrders.length})
            </h3>
            <div className="space-y-3 opacity-70">
              {failedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>暂无订单</p>
          </div>
        )}
      </div>
    </div>
  );
};
