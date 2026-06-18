import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClothingModel } from '../engine/ClothingModel';
import { CarbonProgress } from '../components/CarbonProgress';
import { CarbonTrendChart } from '../components/CarbonTrendChart';
import { FabricSelector } from '../components/FabricSelector';
import { ColorPicker } from '../components/ColorPicker';
import { CarbonRating } from '../components/CarbonRating';
import { getClothingById } from '../data/clothing';
import { getCollectionById } from '../data/collections';
import { fabricData } from '../data/clothing';
import { carbonTracker } from '../services/CarbonTracker';
import { orderService } from '../services/OrderService';
import { useAppStore } from '../store/useAppStore';
import { SavedCustomization } from '../types';
import { FaArrowLeft, FaHeart, FaShoppingBag, FaUndo, FaInfoCircle } from 'react-icons/fa';

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentClothing = useAppStore((state) => state.currentClothing);
  const currentCustomization = useAppStore((state) => state.currentCustomization);
  const selectedPartId = useAppStore((state) => state.selectedPartId);
  const carbonHistory = useAppStore((state) => state.carbonHistory);
  const wishlist = useAppStore((state) => state.wishlist);
  const setCurrentClothing = useAppStore((state) => state.setCurrentClothing);
  const updateCustomizationColor = useAppStore((state) => state.updateCustomizationColor);
  const updateCustomizationFabric = useAppStore((state) => state.updateCustomizationFabric);
  const setSelectedPartId = useAppStore((state) => state.setSelectedPartId);
  const addCarbonHistory = useAppStore((state) => state.addCarbonHistory);
  const addToWishlist = useAppStore((state) => state.addToWishlist);
  const removeFromWishlist = useAppStore((state) => state.removeFromWishlist);
  const updateCarbonStats = useAppStore((state) => state.updateCarbonStats);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clothing = useMemo(() => {
    if (currentClothing?.id === id) return currentClothing;
    return getClothingById(id || '');
  }, [id, currentClothing]);

  const collection = useMemo(() => {
    if (!clothing) return null;
    return getCollectionById(clothing.collectionId);
  }, [clothing]);

  const carbonScore = useMemo(() => {
    if (!clothing || !currentCustomization) return 5;
    return carbonTracker.calculate(
      currentCustomization.fabric,
      clothing.complexity,
      clothing.baseCarbonScore
    );
  }, [clothing, currentCustomization]);

  const carbonSaved = useMemo(() => {
    return carbonTracker.calculateCarbonSaved(carbonScore);
  }, [carbonScore]);

  const isInWishlist = useMemo(() => {
    return wishlist.some((item) => item.clothingId === id);
  }, [wishlist, id]);

  useEffect(() => {
    if (clothing && !currentClothing) {
      setCurrentClothing(clothing);
    }
    if (clothing) {
      setIsLoading(false);
    }
  }, [clothing, currentClothing, setCurrentClothing]);

  useEffect(() => {
    if (!isLoading && currentCustomization) {
      addCarbonHistory(carbonScore);
    }
  }, [currentCustomization?.fabric, isLoading, carbonScore, addCarbonHistory]);

  const handleFabricChange = (fabric: any) => {
    updateCustomizationFabric(fabric);
    toast.success(`已切换至${fabricData[fabric].name}`, {
      style: {
        borderRadius: '8px',
        background: '#fff',
        color: '#333'
      }
    });
  };

  const handleColorChange = (color: string) => {
    if (selectedPartId) {
      updateCustomizationColor(selectedPartId, color);
    }
  };

  const handleWishlistToggle = () => {
    if (!clothing || !currentCustomization) return;

    setWishlistAnimating(true);

    if (isWishlisted) {
      const item = wishlist.find((i) => i.clothingId === id);
      if (item) {
        removeFromWishlist(item.id);
      }
      setIsWishlisted(false);
      toast('已从心愿单移除', { icon: '💔' });
    } else {
      const savedItem: SavedCustomization = {
        id: `custom-${Date.now()}`,
        clothingId: clothing.id,
        clothingName: clothing.name,
        customization: { ...currentCustomization },
        carbonScore,
        savedAt: Date.now(),
        thumbnail: ''
      };
      savedItem.thumbnail = orderService.createCustomizationThumbnail(savedItem);
      addToWishlist(savedItem);
      setIsWishlisted(true);
      toast.success('已加入心愿单', {
        style: {
          borderRadius: '8px',
          background: '#fff',
          color: '#333'
        }
      });
    }

    setTimeout(() => setWishlistAnimating(false), 300);
  };

  const handleCheckout = () => {
    if (!clothing || !currentCustomization) return;

    const savedItem: SavedCustomization = {
      id: `custom-${Date.now()}`,
      clothingId: clothing.id,
      clothingName: clothing.name,
      customization: { ...currentCustomization },
      carbonScore,
      savedAt: Date.now(),
      thumbnail: ''
    };
    savedItem.thumbnail = orderService.createCustomizationThumbnail(savedItem);

    updateCarbonStats(currentCustomization.fabric, carbonSaved);

    navigate(`/checkout/${savedItem.id}`, {
      state: { customization: savedItem, clothing }
    });
  };

  const handleReset = () => {
    if (clothing) {
      setCurrentClothing(clothing);
      toast('已重置为默认配置');
    }
  };

  if (!clothing || !currentCustomization || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F5DC] to-[#E8F5E9]">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const currentFabric = fabricData[currentCustomization.fabric];
  const selectedPart = clothing.parts.find((p) => p.id === selectedPartId);
  const selectedColor = selectedPart ? currentCustomization.colors[selectedPart.id] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] to-white">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/collection/${clothing.collectionId}`)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <FaArrowLeft size={18} />
            <span className="hidden sm:inline">返回系列</span>
          </button>
          <div
            className="text-lg font-bold text-gray-800 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {clothing.name}
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[70%] space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl aspect-[4/5]">
              <ClothingModel
                modelUrl={clothing.modelUrl}
                themeColors={collection.themeColors}
                customization={currentCustomization}
                onRenderComplete={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">加载3D模型中...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <CarbonProgress score={carbonScore} />

              <div className="mt-6 pt-6 border-t border-gray-100">
                <CarbonTrendChart data={carbonHistory} />
              </div>
            </div>
          </div>

          <div
            className="lg:w-[30%] space-y-6"
            style={{
              animation: 'slide-in-right 0.3s ease-out forwards'
            }}
          >
            <style>
              {`
                @keyframes slide-in-right {
                  0% { transform: translateX(100%); opacity: 0; }
                  100% { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1
                    className="text-2xl font-bold text-gray-800 mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {clothing.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <img
                      src={clothing.designerAvatar}
                      alt={clothing.designer}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>设计师: {clothing.designer}</span>
                  </div>
                </div>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-full transition-all duration-300 ${
                    isWishlisted || isInWishlist
                      ? 'bg-red-50 text-red-500'
                      : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                  } ${wishlistAnimating ? 'scale-130' : 'scale-100'}`}
                >
                  <FaHeart size={20} fill={isWishlisted || isInWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <CarbonRating score={carbonScore} size={18} />
                <span className="text-sm text-emerald-600 font-medium">
                  节省 {carbonSaved.toFixed(1)} kg CO₂
                </span>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-700">
                    <p className="font-medium mb-1">面料信息</p>
                    <p className="text-emerald-600">{currentFabric.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择部件
                </label>
                <div className="flex flex-wrap gap-2">
                  {clothing.parts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPartId(part.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedPartId === part.id
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {part.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <ColorPicker
                  colors={currentFabric.colorPalette}
                  selectedColor={selectedColor || undefined}
                  onSelect={handleColorChange}
                  label={selectedPart ? `${selectedPart.name}颜色` : '选择颜色'}
                />
              </div>

              <div className="mb-6">
                <FabricSelector
                  selectedFabric={currentCustomization.fabric}
                  onSelect={handleFabricChange}
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <FaShoppingBag className="group-hover:scale-110 transition-transform" />
                  立即定制
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FaUndo size={14} />
                  重置配置
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">设计信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">系列</span>
                  <span className="text-gray-800 font-medium">{collection.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">面料</span>
                  <span className="text-gray-800 font-medium">{currentFabric.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">制作复杂度</span>
                  <span className="text-gray-800 font-medium">
                    {carbonTracker.getComplexityImpact(clothing.complexity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">基础碳足迹</span>
                  <span className="text-gray-800 font-medium">{clothing.baseCarbonScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
