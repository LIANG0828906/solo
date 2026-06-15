import type { Flower } from '@/types';

interface FlowerCardProps {
  flower: Flower;
  onSelect?: (flower: Flower) => void;
  index: number;
}

export default function FlowerCard({ flower, onSelect, index }: FlowerCardProps) {
  const isSoldOut = flower.stock === 0;
  const isLowStock = flower.stock > 0 && flower.stock <= 5;

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-flower hover:shadow-flower-hover
                 transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer
                 animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => !isSoldOut && onSelect?.(flower)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={flower.image}
          alt={flower.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-rose-500 font-display text-lg px-4 py-1.5 rounded-full font-semibold">
              已售罄
            </span>
          </div>
        )}
        {isLowStock && !isSoldOut && (
          <div className="absolute top-3 right-3">
            <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
              仅剩{flower.stock}朵
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-gray-800 mb-1">{flower.name}</h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-1">{flower.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-rose-500 font-semibold text-xl">¥{flower.price}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isSoldOut
              ? 'bg-gray-100 text-gray-400'
              : flower.stock <= 10
                ? 'bg-amber-50 text-amber-600'
                : 'bg-sage-100 text-sage-600'
          }`}>
            {isSoldOut ? '售罄' : `库存 ${flower.stock}`}
          </span>
        </div>
      </div>
    </div>
  );
}
