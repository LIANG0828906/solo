import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice, createRipple } from '@/utils/helpers';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantityAnimating, setQuantityAnimating] = useState(false);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 0 && newQuantity <= item.book.stock) {
      updateQuantity(item.bookId, newQuantity);
      setQuantityAnimating(true);
      setTimeout(() => setQuantityAnimating(false), 200);
    }
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e, 'rgba(239, 68, 68, 0.3)');
    setIsRemoving(true);
    setTimeout(() => removeItem(item.bookId), 300);
  };

  const subtotal = item.book.price * item.quantity;

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm transition-all duration-300 ${
        isRemoving
          ? 'opacity-0 -translate-x-full scale-75'
          : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      <img
        src={item.book.coverUrl}
        alt={item.book.title}
        className="w-20 h-28 object-cover rounded shadow-sm"
      />

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate mb-1">
          {item.book.title}
        </h4>
        <p className="text-sm text-gray-500 mb-2">{item.book.author}</p>
        <p className="text-accent font-bold">{formatPrice(item.book.price)}</p>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
            className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span
            className={`w-8 text-center font-medium ${
              quantityAnimating ? 'animate-bounceNumber' : ''
            }`}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={item.quantity >= item.book.stock}
            className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-primary">
            {formatPrice(subtotal)}
          </span>
          <button
            onClick={handleRemove}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
