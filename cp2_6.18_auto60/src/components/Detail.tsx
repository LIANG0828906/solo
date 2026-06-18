import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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

  const rawImages = useMemo(
    () =>
      product?.images && product.images.length > 0
        ? product.images
        : product
          ? [product.imageUrl]
          : [],
    [product]
  );

  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const validImages = useMemo(
    () => rawImages.filter((_, idx) => !failedImages.has(idx)),
    [rawImages, failedImages]
  );

  const validIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    let validCount = 0;
    rawImages.forEach((_, idx) => {
      if (!failedImages.has(idx)) {
        map[idx] = validCount;
        validCount++;
      }
    });
    return map;
  }, [rawImages, failedImages]);

  const [currentImage, setCurrentImage] = useState(0);
  const [prevImage, setPrevImage] = useState<number | null>(null);
  const [heartAnim, setHeartAnim] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showMakerTooltip, setShowMakerTooltip] = useState(false);

  const hoverEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addCartLockRef = useRef(false);
  const addCartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFav = product ? favorites.includes(product.id) : false;

  const effectiveImages = validImages;
  const effectiveCurrent = validIndexMap[currentImage] ?? 0;
  const hasMultipleImages = effectiveImages.length > 1;

  useEffect(() => {
    if (currentImage >= rawImages.length && rawImages.length > 0) {
      setCurrentImage(0);
    }
  }, [rawImages.length, currentImage]);

  useEffect(() => {
    if (carouselTimerRef.current) {
      clearTimeout(carouselTimerRef.current);
      carouselTimerRef.current = null;
    }
    if (prevImage !== null) {
      carouselTimerRef.current = setTimeout(() => {
        setPrevImage(null);
      }, 350);
    }
    return () => {
      if (carouselTimerRef.current) clearTimeout(carouselTimerRef.current);
    };
  }, [prevImage]);

  const handleImageLoad = useCallback((idx: number) => {
    setLoadedImages((prev) => ({ ...prev, [idx]: true }));
  }, []);

  const handleImageError = useCallback((idx: number) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }, []);

  const findNextValidRawIndex = useCallback(
    (direction: 1 | -1): number | null => {
      const total = rawImages.length;
      if (total === 0) return null;
      let nextIdx = currentImage;
      for (let i = 1; i <= total; i++) {
        nextIdx = (nextIdx + direction + total) % total;
        if (!failedImages.has(nextIdx)) return nextIdx;
      }
      return null;
    },
    [rawImages.length, currentImage, failedImages]
  );

  const handlePrev = useCallback(() => {
    if (!hasMultipleImages) return;
    const next = findNextValidRawIndex(-1);
    if (next === null || next === currentImage) return;
    setPrevImage(currentImage);
    setCurrentImage(next);
  }, [hasMultipleImages, findNextValidRawIndex, currentImage]);

  const handleNext = useCallback(() => {
    if (!hasMultipleImages) return;
    const next = findNextValidRawIndex(1);
    if (next === null || next === currentImage) return;
    setPrevImage(currentImage);
    setCurrentImage(next);
  }, [hasMultipleImages, findNextValidRawIndex, currentImage]);

  const handleDotClick = useCallback(
    (rawIdx: number) => {
      if (failedImages.has(rawIdx)) return;
      if (rawIdx === currentImage) return;
      setPrevImage(currentImage);
      setCurrentImage(rawIdx);
    },
    [currentImage, failedImages]
  );

  const handleFavorite = useCallback(() => {
    if (!product) return;
    toggleFavorite(product.id);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 200);
  }, [product, toggleFavorite]);

  const handleAddToCart = useCallback(() => {
    if (!product || product.stock === 0) return;
    if (addCartLockRef.current) return;

    addCartLockRef.current = true;
    addToCart(product.id);
    showToast(`已将「${product.name}」加入购物车`);
    setAddedToCart(true);

    if (addCartTimerRef.current) clearTimeout(addCartTimerRef.current);
    addCartTimerRef.current = setTimeout(() => {
      setAddedToCart(false);
      addCartLockRef.current = false;
      openCart();
    }, 700);
  }, [product, addToCart, showToast, openCart]);

  const handleMakerHover = useCallback(() => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    if (hoverEnterTimerRef.current) return;
    hoverEnterTimerRef.current = setTimeout(() => {
      setShowMakerTooltip(true);
      hoverEnterTimerRef.current = null;
    }, 80);
  }, []);

  const handleMakerLeave = useCallback(() => {
    if (hoverEnterTimerRef.current) {
      clearTimeout(hoverEnterTimerRef.current);
      hoverEnterTimerRef.current = null;
    }
    if (hoverLeaveTimerRef.current) return;
    hoverLeaveTimerRef.current = setTimeout(() => {
      setShowMakerTooltip(false);
      hoverLeaveTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverEnterTimerRef.current) clearTimeout(hoverEnterTimerRef.current);
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
      if (addCartTimerRef.current) clearTimeout(addCartTimerRef.current);
      if (carouselTimerRef.current) clearTimeout(carouselTimerRef.current);
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
        <div
          className="relative rounded-2xl overflow-hidden bg-stone-100 select-none"
          style={{ aspectRatio: '4/3' }}
        >
          {effectiveImages.length === 0 ? (
            <div className="absolute inset-0 image-placeholder" />
          ) : (
            <>
              {prevImage !== null && rawImages[prevImage] && (
                <img
                  src={rawImages[prevImage]}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out opacity-0 pointer-events-none"
                />
              )}
              <img
                src={rawImages[currentImage]}
                alt={`${product.name} - ${effectiveCurrent + 1}`}
                onLoad={() => handleImageLoad(currentImage)}
                onError={() => handleImageError(currentImage)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${
                  loadedImages[currentImage]
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              />
              {!loadedImages[currentImage] && (
                <div className="absolute inset-0 image-placeholder z-0" />
              )}
            </>
          )}

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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {rawImages.map((_, rawIdx) => {
                  if (failedImages.has(rawIdx)) return null;
                  const isActive = rawIdx === currentImage;
                  return (
                    <button
                      key={rawIdx}
                      onClick={() => handleDotClick(rawIdx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-white w-6'
                          : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`第${(validIndexMap[rawIdx] ?? 0) + 1}张图片`}
                      aria-current={isActive ? 'true' : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={handleMakerHover}
                onMouseLeave={handleMakerLeave}
                onFocus={handleMakerHover}
                onBlur={handleMakerLeave}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm will-change-transform transition-transform duration-200 hover:scale-110"
                style={{ backgroundColor: '#D97706' }}
                aria-label="制作者头像，悬停查看详情"
              >
                {product.makerAvatar}
              </button>
              <div
                className={`pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 transition-all duration-150 ease-out ${
                  showMakerTooltip
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-1'
                }`}
                style={{ zIndex: 30 }}
              >
                <div className="relative bg-stone-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                  查看制作者主页
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-1 w-2.5 h-2.5 bg-stone-800 rotate-45"
                    aria-hidden="true"
                  />
                </div>
              </div>
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
            <h3 className="text-sm font-semibold text-stone-700 mb-3">
              规格参数
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {specItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-warm-50 rounded-xl p-3 flex sm:flex-col flex-row sm:items-center sm:text-center items-start text-left gap-3 sm:gap-0 transition-transform duration-200 sm:hover:scale-[1.02]"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 mb-0 sm:mb-2"
                    style={{ color: '#D97706' }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex sm:flex-col sm:items-center flex-row sm:gap-0 gap-3 items-center">
                    <span className="text-xs text-stone-400 sm:mb-0.5 w-12 sm:w-auto flex-shrink-0">
                      {item.label}
                    </span>
                    <span className="text-xs font-medium text-stone-700 sm:leading-tight leading-snug flex-1">
                      {item.value}
                    </span>
                  </div>
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
                isFav
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
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
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                backgroundColor: addedToCart ? '#047857' : '#059669',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#047857';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  addedToCart ? '#047857' : '#059669';
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
