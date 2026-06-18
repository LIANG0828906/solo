import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, ArrowLeft, Ruler, Package, Clock, Check } from 'lucide-react';
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
  const [addedToCart, setAddedToCart] = useState(false);
  const [showMakerTooltip, setShowMakerTooltip] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isFav = product ? favorites.includes(product.id) : false;

  const images = product?.images && product.images.length > 0
    ? product.images
    : product
      ? [product.imageUrl]
      : [];

  const hasMultipleImages = images.length > 1;

  const handlePrev = useCallback(() => {
    if (!hasMultipleImages) return;
    setImgLoaded(false);
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length, hasMultipleImages]);

  const handleNext = useCallback(() => {
    if (!hasMultipleImages) return;
    setImgLoaded(false);
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length, hasMultipleImages]);

  const handleDotClick = useCallback((idx: number) => {
    setImgLoaded(false);
    setCurrentImage(idx);
  }, []);

  const handleFavorite = useCallback(() => {
    if (!product) return;
    toggleFavorite(product.id);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
  }, [product, toggleFavorite]);

  const handleAddToCart = useCallback(() => {
    if (!product || product.stock === 0) return;
    addToCart(product.id);
    showToast(`已将「${product.name}」加入购物车`);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      openCart();
    }, 500);
  }, [product, addToCart, showToast, openCart]);

  const handleMakerHover = useCallback(() => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setShowMakerTooltip(true);
  }, []);

  const handleMakerLeave = useCallback(() => {
    tooltipTimerRef.current = setTimeout(() => {
      setShowMakerTooltip(false);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

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

  const specItems = [
    {
      icon: <Package size={18} />,
      label: '材质',
      value: product.material,
    },
    {
      icon: <Ruler size={18} />,
      label: '尺寸',
      value: product.dimensions,
    },
    {
      icon: <Clock size={18} />,
      label: '制作周期',
      value: product.productionCycle,
    },
  ];

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
            <div className="absolute inset-0 image-placeholder z-10" />
          )}
          <img
            key={currentImage}
            src={images[currentImage]}
            alt={`${product.name} - ${currentImage + 1}`}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm z-20"
                aria-label="上一张"
              >
                <ChevronLeft size={20} className="text-stone-600" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm z-20"
                aria-label="下一张"
              >
                <ChevronRight size={20} className="text-stone-600" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentImage
                        ? 'bg-white w-6'
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`第${idx + 1}张图片`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <button
                onMouseEnter={handleMakerHover}
                onMouseLeave={handleMakerLeave}
                onFocus={handleMakerHover}
                onBlur={handleMakerLeave}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-transform duration-200 hover:scale-110"
                style={{ backgroundColor: '#D97706' }}
                aria-label="制作者头像"
              >
                {product.makerAvatar}
              </button>
              {showMakerTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 top-12 bg-stone-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 animate-fade-in">
                  查看制作者主页
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-stone-800 rotate-45" />
                </div>
              )}
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

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">规格参数</h3>
            <div className="grid grid-cols-3 gap-3">
              {specItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-warm-50 rounded-xl p-3 flex flex-col items-center text-center transition-transform duration-200 hover:scale-[1.02]"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center mb-2"
                    style={{ color: '#D97706' }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs text-stone-400 mb-0.5">{item.label}</span>
                  <span className="text-xs font-medium text-stone-700 leading-tight">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-stone-500 mb-6">
            <span>库存：{product.stock} 件</span>
          </div>

          <div className="flex gap-3 mt-auto">
            <button
              onClick={handleFavorite}
              className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                isFav ? 'border-rose-200 bg-rose-50' : 'border-stone-200 bg-white hover:bg-stone-50'
              } ${heartAnim ? 'heart-bounce' : ''}`}
              aria-label="收藏"
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
              disabled={product.stock === 0 || addedToCart}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: addedToCart ? '#047857' : '#059669' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#047857';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = addedToCart ? '#047857' : '#059669';
              }}
            >
              {addedToCart ? (
                <>
                  <Check size={18} className="animate-fade-in" />
                  <span>已加入</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>{product.stock === 0 ? '已售罄' : '加入购物车'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
