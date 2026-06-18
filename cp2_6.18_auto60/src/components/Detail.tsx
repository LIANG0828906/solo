import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useStore((s) => s.products);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const addToCart = useStore((s) => s.addToCart);
  const openCart = useStore((s) => s.openCart);
  const showToast = useStore((s) => s.showToast);

  const product = products.find((p) => p.id === id);
  const [currentImage, setCurrentImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const isFav = product ? favorites.includes(product.id) : false;

  const images = product
    ? [product.imageUrl, product.imageUrl, product.imageUrl]
    : [];

  const handlePrev = useCallback(() => {
    setImgLoaded(false);
    setFadeKey((k) => k + 1);
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setImgLoaded(false);
    setFadeKey((k) => k + 1);
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleFavorite = useCallback(() => {
    if (!product) return;
    toggleFavorite(product.id);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
  }, [product, toggleFavorite]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product.id);
    showToast(`已将「${product.name}」加入购物车`);
    openCart();
  }, [product, addToCart, showToast, openCart]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-stone-400 mb-4">商品不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg text-white text-sm"
          style={{ backgroundColor: '#D97706' }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto px-4 py-6 animate-fade-in-up">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-stone-500 hover:text-stone-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">返回</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative rounded-2xl overflow-hidden bg-stone-100" style={{ aspectRatio: '4/3' }}>
          {!imgLoaded && (
            <div className="absolute inset-0 image-placeholder" />
          )}
          <img
            key={fadeKey}
            src={images[currentImage]}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
          >
            <ChevronLeft size={20} className="text-stone-600" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
          >
            <ChevronRight size={20} className="text-stone-600" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setImgLoaded(false);
                  setFadeKey((k) => k + 1);
                  setCurrentImage(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  idx === currentImage
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: '#D97706' }}
            >
              {product.makerAvatar}
            </div>
            <span className="text-sm text-stone-500">{product.makerName}</span>
          </div>

          <h1 className="font-serif text-2xl font-bold text-stone-800 mb-2">
            {product.name}
          </h1>

          <p className="text-2xl font-bold mb-4" style={{ color: '#D97706' }}>
            ¥{product.price}
          </p>

          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            {product.description}
          </p>

          <div className="bg-warm-50 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700">规格参数</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-stone-400">材质</span>
                <p className="text-stone-700 mt-0.5">{product.material}</p>
              </div>
              <div>
                <span className="text-stone-400">尺寸</span>
                <p className="text-stone-700 mt-0.5">{product.dimensions}</p>
              </div>
              <div>
                <span className="text-stone-400">制作周期</span>
                <p className="text-stone-700 mt-0.5">{product.productionCycle}</p>
              </div>
              <div>
                <span className="text-stone-400">库存</span>
                <p className="text-stone-700 mt-0.5">{product.stock}件</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button
              onClick={handleFavorite}
              className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                isFav ? 'border-rose-200 bg-rose-50' : 'border-stone-200 bg-white hover:bg-stone-50'
              } ${heartAnim ? 'heart-bounce' : ''}`}
            >
              <Heart
                size={20}
                fill={isFav ? '#E11D48' : 'none'}
                stroke={isFav ? '#E11D48' : '#9CA3AF'}
                strokeWidth={2}
              />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#059669' }}
              onMouseEnter={(e) =>
                !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = '#047857')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#059669')
              }
            >
              <ShoppingCart size={18} />
              {product.stock === 0 ? '已售罄' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
