import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { fabricData } from '../data/clothing';
import { carbonTracker } from '../services/CarbonTracker';
import { getClothingById } from '../data/clothing';
import { CarbonRating } from '../components/CarbonRating';
import { FaArrowLeft, FaTrash, FaShoppingBag, FaHeart } from 'react-icons/fa';

export function WishlistPage() {
  const navigate = useNavigate();
  const wishlist = useAppStore((state) => state.wishlist);
  const removeFromWishlist = useAppStore((state) => state.removeFromWishlist);
  const setCurrentClothing = useAppStore((state) => state.setCurrentClothing);
  const updateCarbonStats = useAppStore((state) => state.updateCarbonStats);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (item: any) => {
    const clothing = getClothingById(item.clothingId);
    if (clothing) {
      setCurrentClothing(clothing);
      navigate(`/detail/${item.clothingId}`);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      removeFromWishlist(id);
      setDeletingId(null);
    }, 200);
  };

  const handleCheckout = (item: any) => {
    const clothing = getClothingById(item.clothingId);
    if (clothing) {
      const carbonSaved = carbonTracker.calculateCarbonSaved(item.carbonScore);
      updateCarbonStats(item.customization.fabric, carbonSaved);
      navigate(`/checkout/${item.id}`, {
        state: { customization: item, clothing }
      });
    }
  };

  const totalCarbonSaved = useMemo(() => {
    return wishlist.reduce((sum, item) => {
      return sum + carbonTracker.calculateCarbonSaved(item.carbonScore);
    }, 0);
  }, [wishlist]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] to-white">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <FaArrowLeft size={18} />
            <span>返回首页</span>
          </button>
          <div
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            我的心愿单
          </div>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {wishlist.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">您的环保贡献</h3>
                <p className="text-emerald-100">
                  已保存 {wishlist.length} 件定制方案
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{totalCarbonSaved.toFixed(1)}</div>
                <div className="text-sm text-emerald-100">kg CO₂ 可节省</div>
              </div>
            </div>
          </div>
        )}

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const clothing = getClothingById(item.clothingId);
              const fabric = fabricData[item.customization.fabric];
              const colors = Object.values(item.customization.colors);

              return (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                    deletingId === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden"
                    onClick={() => handleEdit(item)}
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.clothingName || '定制服装'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, ${colors[0]}60 0%, ${colors[1] || colors[0]}40 100%)`
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 200 300" className="w-2/3 h-2/3 drop-shadow-xl">
                            <defs>
                              <linearGradient id={`wl-${item.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                {colors.map((color, i) => (
                                  <stop
                                    key={i}
                                    offset={`${(i / (colors.length - 1)) * 100}%`}
                                    stopColor={color}
                                  />
                                ))}
                              </linearGradient>
                            </defs>
                            <path
                              d="M100,30 Q70,60 65,100 L55,250 Q100,280 145,250 L135,100 Q130,60 100,30"
                              fill={`url(#wl-${item.id})`}
                              stroke="rgba(255,255,255,0.5)"
                              strokeWidth="1.5"
                            />
                            <circle cx="100" cy="25" r="15" fill="rgba(255,255,255,0.6)" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-sm font-medium">点击编辑</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3
                      className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {item.clothingName || clothing?.name || '定制服装'}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                        {fabric.name}
                      </span>
                      <div className="flex gap-1">
                        {colors.slice(0, 3).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <CarbonRating score={item.carbonScore} size={14} showTooltip={false} />
                      <span className="text-xs text-emerald-600 font-medium">
                        省 {carbonTracker.calculateCarbonSaved(item.carbonScore).toFixed(1)}kg
                      </span>
                    </div>

                    <button
                      onClick={() => handleCheckout(item)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <FaShoppingBag size={14} />
                      立即定制
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <FaHeart size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">心愿单是空的</h2>
            <p className="text-gray-500 mb-8">开始探索我们的系列，添加您喜欢的定制方案</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              探索系列
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
