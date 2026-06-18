import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Order } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { formatPrice, formatDate } from '@/utils/helpers';

interface OrderRowProps {
  order: Order;
}

export const OrderRow = ({ order }: OrderRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColor = STATUS_COLORS[order.status];
  const statusLabel = STATUS_LABELS[order.status];

  return (
    <>
      <tr
        className="bg-white border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-4 text-sm text-gray-900 font-mono">
          {order.orderNo}
        </td>
        <td className="px-4 py-4 text-sm text-gray-600">
          {formatDate(order.createdAt)}
        </td>
        <td className="px-4 py-4">
          <span className="inline-flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <span className="text-sm text-gray-700">{statusLabel}</span>
          </span>
        </td>
        <td className="px-4 py-4 text-sm font-bold text-accent">
          {formatPrice(order.totalAmount)}
        </td>
        <td className="px-4 py-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50 animate-fadeIn">
          <td colSpan={5} className="px-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">收货人：</span>
                  <span className="text-gray-900">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500">联系电话：</span>
                  <span className="text-gray-900">{order.customerPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">收货地址：</span>
                  <span className="text-gray-900">{order.customerAddress}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-medium text-gray-900 mb-3">订单明细</h5>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex items-center gap-4 p-2 bg-white rounded"
                    >
                      <img
                        src={item.book.coverUrl}
                        alt={item.book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.book.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.book.author}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.book.price)} × {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-accent">
                          {formatPrice(item.book.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
