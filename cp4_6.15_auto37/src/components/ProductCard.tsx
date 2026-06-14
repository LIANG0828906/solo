import { memo, useState, useCallback } from 'react';
import { Heart, ShoppingCart, Edit2, Trash2 } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';
import { CATEGORY_LABELS, type Product } from '@/types';
import { Modal } from './Modal';

interface ProductCardProps {
  product: Product;
  index: number;
  showManagement?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  highlightText?: string;
}

function highlight(text: string, keyword?: string) {
  if (!keyword?.trim()) return text;
  const lower = keyword.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(lower);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="highlight-text animate-highlight-pulse">
        {text.slice(idx, idx + lower.length)}
      </span>
      {text.slice(idx + lower.length)}
    </>
  );
}

function ProductCardInner({
  product,
  index,
  showManagement = false,
  onEdit,
  onDelete,
  highlightText,
}: ProductCardProps) {
  const toggleFavorite = useMarketStore(s => s.toggleFavorite);
  const createTransaction = useMarketStore(s => s.createTransaction);
  const isFavorite = useMarketStore(s => s.isFavorite(product.id));
  const stalls = useMarketStore(s => s.stalls);
  const stall = stalls.find(s => s.id === product.stallId);

  const [buyerModal, setBuyerModal] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyQty, setBuyQty] = useState(1);
  const [favAnimating, setFavAnimating] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);

  const handleToggleFavorite = useCallback(() => {
    setFavAnimating(true);
    toggleFavorite(product.id);
    setTimeout(() => setFavAnimating(false), 300);
  }, [product.id, toggleFavorite]);

  const handleBuy = useCallback(() => {
    if (product.quantity <= 0) {
      setOutOfStock(true);
      setTimeout(() => setOutOfStock(false), 2000);
      return;
    }
    setBuyerModal(true);
    setBuyQty(1);
    setBuyerName('');
  }, [product.quantity]);

  const confirmBuy = useCallback(() => {
    if (!buyerName.trim()) return;
    const result = createTransaction(product.id, buyerName.trim(), buyQty);
    if (result) {
      setBuyerModal(false);
    }
  }, [buyerName, buyQty, createTransaction, product.id]);

  return (
    <>
      <div
        className={`glass-card glass-card-hover overflow-hidden will-change-transform opacity-0 animate-slide-in-left
                   flex flex-col`}
        style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
      >
        <div className="relative aspect-square sm:aspect-square bg-amber-100/50 overflow-hidden flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flea%20market%20${product.category}%20product&image_size=square`;
            }}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 sm:gap-2">
            {!showManagement && (
              <button
                onClick={handleToggleFavorite}
                className={`p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md
                           transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                           hover:scale-110 ${favAnimating ? 'scale-125' : ''}`}
                aria-label={isFavorite ? '取消收藏' : '收藏'}
              >
                <Heart
                  size={16}
                  className={isFavorite ? 'text-red-500 fill-red-500' : 'text-amber-700'}
                />
              </button>
            )}
            {showManagement && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onEdit?.(product)}
                  className="p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md
                             hover:bg-white hover:scale-110 transition-all"
                  aria-label="编辑"
                >
                  <Edit2 size={14} className="text-amber-700" />
                </button>
                <button
                  onClick={() => onDelete?.(product.id)}
                  className="p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md
                             hover:bg-red-50 hover:scale-110 transition-all"
                  aria-label="删除"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-amber-600 text-white rounded-full">
              {CATEGORY_LABELS[product.category]}
            </span>
          </div>
          {product.quantity <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm sm:text-base">已售罄</span>
            </div>
          )}
        </div>

        <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
          <h3 className="font-display font-semibold text-amber-900 truncate text-sm sm:text-base">
            {highlight(product.name, highlightText)}
          </h3>
          {stall && (
            <p className="text-[11px] sm:text-xs text-amber-600 mt-0.5 truncate">
              {highlight(stall.name, highlightText)} · {stall.area}
            </p>
          )}
          <p className="text-[11px] sm:text-xs text-amber-700/80 mt-1 line-clamp-2 flex-1">
            {product.description}
          </p>

          <div className="flex items-end justify-between mt-2 sm:mt-3">
            <div>
              <span className="text-base sm:text-lg font-bold text-amber-700">¥{product.price}</span>
              <span className="text-[10px] sm:text-xs text-amber-600 ml-1.5">库存 {product.quantity}</span>
            </div>
            {!showManagement && (
              <button
                onClick={handleBuy}
                disabled={product.quantity <= 0}
                className={`!px-2.5 !py-1.5 sm:!px-3 sm:!py-1.5 !text-[11px] sm:!text-sm btn-primary flex items-center gap-1
                           ${outOfStock ? 'animate-pulse' : ''}`}
              >
                <ShoppingCart size={12} className="sm:hidden" />
                <ShoppingCart size={14} className="hidden sm:inline" />
                <span className="sm:inline">购买</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal open={buyerModal} onClose={() => setBuyerModal(false)} title="确认购买">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/60 rounded-lg">
            <p className="font-semibold text-amber-900">{product.name}</p>
            <p className="text-sm text-amber-700">单价: ¥{product.price}</p>
            <p className="text-sm text-amber-700">可用库存: {product.quantity}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">买家昵称</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="请输入您的昵称"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">
              购买数量（共 ¥{product.price * buyQty}）
            </label>
            <input
              type="number"
              min={1}
              max={product.quantity}
              value={buyQty}
              onChange={(e) => setBuyQty(Math.max(1, Math.min(product.quantity, Number(e.target.value) || 1)))}
              className="input-field"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setBuyerModal(false)} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={confirmBuy}
              disabled={!buyerName.trim() || buyQty <= 0 || buyQty > product.quantity}
              className="btn-primary flex-1"
            >
              确认购买
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export const ProductCard = memo(ProductCardInner);
