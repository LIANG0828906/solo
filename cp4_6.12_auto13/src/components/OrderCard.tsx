import { useState } from 'react';
import { Order, DyeScheme, ORDER_STATUSES } from '@/types';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  dyeSchemes: DyeScheme[];
}

export default function OrderCard({ order, dyeSchemes }: OrderCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.status);
  const progressPercentage = ((currentStatusIndex + 1) / ORDER_STATUSES.length) * 100;

  const dyeScheme = dyeSchemes.find((ds) => ds.id === order.dyeSchemeId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'bg-white rounded-xl p-4 cursor-grab active:cursor-grabbing',
        'border border-[#E8DFD0]',
        'transition-shadow duration-200 ease',
        'hover:shadow-[0_4px_16px_rgba(74,55,40,0.12)]',
        isDragging && 'opacity-50'
      )}
      style={{
        boxShadow: '0 2px 8px rgba(74, 55, 40, 0.08)',
      }}
    >
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <span className="font-bold text-gray-900">{order.orderNo}</span>
          {dyeScheme && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block border border-gray-200"
                style={{ backgroundColor: dyeScheme.colorHex }}
              />
              <span className="text-sm text-gray-600">{dyeScheme.name}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-1">
          {order.fabricType} {order.widthCm}×{order.lengthCm}cm
        </div>
        <div className="text-sm text-gray-500">
          预计完成：{formatDate(order.estimatedCompletion)}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          {order.status}
        </div>
        <div className="relative">
          <div
            className="w-full bg-gray-200 rounded"
            style={{ height: '8px' }}
          >
            <div
              className="h-full rounded transition-all duration-500 ease"
              style={{
                width: `${progressPercentage}%`,
                background: 'linear-gradient(to right, #87CEEB, #000080)',
              }}
            />
          </div>
          <div className="absolute top-0 left-0 w-full flex justify-between" style={{ transform: 'translateY(-2px)' }}>
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              return (
                <div
                  key={status}
                  className={cn(
                    'w-3 h-3 rounded-full border-2',
                    isCompleted
                      ? 'bg-[#000080] border-[#000080]'
                      : 'bg-white border-gray-300'
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
