// ============================================================
// 搭配广场页面
// 数据流向：
//   页面挂载 → useEffect → GET /api/outfits → 后端 → lowdb
//           ↓ 返回搭配列表
//   Zustand store.outfits → OutfitsPage → 横向滚动卡片展示
//   创建搭配 → 拖拽衣物到画布 → POST /api/outfits → 后端 → lowdb
//                   ↓ 后端自动调用 styleGenerator 生成 styleTags
//            返回新搭配 → store.addOutfit
// 调用关系：调用 ClothCard 组件展示画布中的衣物，调用 useStore 获取全局状态，
//          调用 src/api/outfits.ts 中方法与后端通信，
//          调用 src/utils/styleGenerator.ts 预览风格描述
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Plus, Shirt, Briefcase, Footprints, Gem, Trash2, Sparkles, X } from 'lucide-react';
import ClothCard from '@/components/ClothCard';
import { useStore } from '@/store/useStore';
import { getOutfits, createOutfit as apiCreateOutfit, deleteOutfit as apiDeleteOutfit } from '@/api/outfits';
import { getClothes } from '@/api/clothes';
import { generateStyleDescription } from '@/utils/styleGenerator';
import type { Cloth, ClothCategory, Outfit } from '@/types';

/**
 * 搭配画布槽位配置
 * 四个槽位：上装、下装、鞋子、配饰
 */
const canvasSlots: { key: ClothCategory | 'top' | 'bottom' | 'shoes' | 'accessory'; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'top', label: '上装', icon: <Shirt size={24} />, color: 'from-blush-200 to-blush-300' },
  { key: 'bottom', label: '下装', icon: <Briefcase size={24} />, color: 'from-dusty-200 to-dusty-300' },
  { key: 'shoes', label: '鞋子', icon: <Footprints size={24} />, color: 'from-sage-200 to-sage-300' },
  { key: 'accessory', label: '配饰', icon: <Gem size={24} />, color: 'from-lavender-200 to-lavender-300' },
];

/**
 * 搭配广场页面组件
 *
 * 功能：
 * 1. 搭配画布（四个槽位，支持拖拽衣物放置）
 * 2. 自动生成风格描述
 * 3. 创建新搭配
 * 4. 浏览已有搭配（横向滚动卡片展示）
 * 5. 删除搭配
 */
export default function OutfitsPage() {
  // 全局状态
  const outfits = useStore((state) => state.outfits);
  const clothes = useStore((state) => state.clothes);
  const setOutfits = useStore((state) => state.setOutfits);
  const addOutfit = useStore((state) => state.addOutfit);
  const removeOutfit = useStore((state) => state.removeOutfit);
  const setClothes = useStore((state) => state.setClothes);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 搭配画布中的衣物
  const [canvasClothes, setCanvasClothes] = useState<Record<string, Cloth | null>>({
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
  });

  // 搭配名称
  const [outfitName, setOutfitName] = useState('');

  // 搭配描述（自动生成，可手动编辑）
  const [outfitDescription, setOutfitDescription] = useState('');

  // 是否显示衣物选择面板
  const [showPicker, setShowPicker] = useState(false);

  // 当前正在选择的槽位
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // ============================================================
  // 数据获取
  // ============================================================

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // 并行获取搭配列表和衣物列表
      const [outfitsData, clothesData] = await Promise.all([
        getOutfits(),
        getClothes().catch(() => [] as Cloth[]),
      ]);
      setOutfits(outfitsData || []);
      setClothes(clothesData || []);
    } catch (error) {
      console.error('获取数据失败:', error);
      setOutfits([]);
    } finally {
      setIsLoading(false);
    }
  }, [setOutfits, setClothes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // 搭配画布逻辑
  // ============================================================

  /**
   * 获取当前画布中的所有衣物
   */
  const getCanvasClothesArray = (): Cloth[] => {
    return Object.values(canvasClothes).filter((c): c is Cloth => c !== null);
  };

  /**
   * 自动更新风格描述
   * 当画布中的衣物变化时，自动生成风格描述文本
   * 数据流向：画布衣物变化 → generateStyleDescription → 自动填充描述
   */
  useEffect(() => {
    const canvasItems = getCanvasClothesArray();
    if (canvasItems.length > 0) {
      const description = generateStyleDescription(canvasItems);
      setOutfitDescription(description);
    } else {
      setOutfitDescription('');
    }
  }, [canvasClothes]);

  /**
   * 处理拖拽到画布槽位
   */
  const handleDropToSlot = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    const clothId = e.dataTransfer.getData('text/plain');
    const cloth = clothes.find((c) => c.id === clothId);

    if (cloth && cloth.category === slotKey) {
      setCanvasClothes((prev) => ({
        ...prev,
        [slotKey]: cloth,
      }));
    }
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * 打开衣物选择面板
   */
  const openPicker = (slotKey: string) => {
    setActiveSlot(slotKey);
    setShowPicker(true);
  };

  /**
   * 选择衣物放入槽位
   */
  const selectClothForSlot = (cloth: Cloth) => {
    if (activeSlot) {
      setCanvasClothes((prev) => ({
        ...prev,
        [activeSlot]: cloth,
      }));
    }
    setShowPicker(false);
    setActiveSlot(null);
  };

  /**
   * 从槽位移除衣物
   */
  const removeFromSlot = (slotKey: string) => {
    setCanvasClothes((prev) => ({
      ...prev,
      [slotKey]: null,
    }));
  };

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    setCanvasClothes({ top: null, bottom: null, shoes: null, accessory: null });
    setOutfitName('');
  };

  /**
   * 保存搭配
   * 数据流向：点击保存 → POST /api/outfits → 后端 → lowdb → store.addOutfit
   */
  const handleSaveOutfit = async () => {
    const canvasItems = getCanvasClothesArray();
    if (canvasItems.length === 0) {
      alert('请至少选择一件衣物');
      return;
    }
    if (!outfitName.trim()) {
      alert('请给搭配起个名字');
      return;
    }

    try {
      const payload = {
        name: outfitName,
        description: outfitDescription,
        topId: canvasClothes.top?.id,
        bottomId: canvasClothes.bottom?.id,
        shoesId: canvasClothes.shoes?.id,
        accessoryId: canvasClothes.accessory?.id,
        styleTags: [] as string[],
      };

      const newOutfit = await apiCreateOutfit(payload);
      addOutfit(newOutfit);
      clearCanvas();
      alert('搭配保存成功！');
    } catch (error) {
      console.error('保存搭配失败:', error);
      alert('保存失败，请重试');
    }
  };

  /**
   * 删除搭配
   */
  const handleDeleteOutfit = async (id: string) => {
    if (!confirm('确定要删除这个搭配吗？')) return;
    try {
      await apiDeleteOutfit(id);
      removeOutfit(id);
    } catch (error) {
      console.error('删除搭配失败:', error);
    }
  };

  // 可用于选择的衣物（按当前激活槽位分类过滤）
  const availableClothes = activeSlot
    ? clothes.filter((c) => c.category === activeSlot)
    : [];

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-mocha-800 mb-2">
            搭配广场
          </h1>
          <p className="text-mocha-600/70 text-sm md:text-base">
            共 {outfits.length} 套搭配 · 自由组合，发现更多穿搭可能
          </p>
        </div>
      </div>

      {/* ============================================
         搭配创建画布
         四个槽位：上装、下装、鞋子、配饰
         ============================================ */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-mocha-600/10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-mocha-600" />
          <h2 className="text-xl font-serif font-semibold text-mocha-800">创建新搭配</h2>
        </div>

        {/* 搭配名称输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-mocha-700 mb-2">
            搭配名称
          </label>
          <input
            type="text"
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
            placeholder="例如：周末休闲风、通勤精英..."
            className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-mocha-600/20 bg-cream-100/50
                     text-mocha-800 placeholder-mocha-600/40 focus:outline-none focus:ring-2
                     focus:ring-mocha-500/30 focus:border-mocha-500/50 transition-all"
          />
        </div>

        {/* 画布槽位区域 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {canvasSlots.map((slot) => {
            const slotCloth = canvasClothes[slot.key];
            return (
              <div
                key={slot.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToSlot(e, slot.key)}
                onClick={() => openPicker(slot.key)}
                className={`
                  relative min-h-[220px] rounded-xl border-2 border-dashed
                  flex flex-col items-center justify-center p-4 cursor-pointer
                  transition-all duration-200
                  ${slotCloth
                    ? 'border-mocha-500/40 bg-mocha-600/5'
                    : 'border-mocha-600/20 bg-cream-50 hover:border-mocha-500/40 hover:bg-mocha-600/5'
                  }
                `}
              >
                {slotCloth ? (
                  <div className="relative w-full animate-bounce-in">
                    {/* 移除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSlot(slot.key);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full
                               flex items-center justify-center shadow-md hover:bg-rose-600
                               transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                    <ClothCard cloth={slotCloth} showActions={false} />
                  </div>
                ) : (
                  <div className="text-center">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slot.color} flex items-center justify-center mb-3 text-mocha-700 shadow-sm mx-auto`}
                    >
                      {slot.icon}
                    </div>
                    <p className="text-sm font-medium text-mocha-700">{slot.label}</p>
                    <p className="text-xs text-mocha-600/50 mt-1">
                      点击选择或拖拽衣物
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 风格描述 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-mocha-700 mb-2">
            风格描述（自动生成，可编辑）
          </label>
          <input
            type="text"
            value={outfitDescription}
            onChange={(e) => setOutfitDescription(e.target.value)}
            placeholder="选择衣物后自动生成风格描述..."
            className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-mocha-600/20 bg-cream-100/50
                     text-mocha-800 placeholder-mocha-600/40 focus:outline-none focus:ring-2
                     focus:ring-mocha-500/30 focus:border-mocha-500/50 transition-all"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveOutfit}
            className="flex items-center gap-2 px-5 py-2.5 bg-mocha-600 text-white rounded-xl font-medium
                     shadow-md hover:bg-mocha-700 hover:shadow-lg transition-all duration-200
                     active:scale-95"
          >
            <Plus size={18} />
            保存搭配
          </button>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-5 py-2.5 bg-mocha-600/10 text-mocha-700 rounded-xl font-medium
                     hover:bg-mocha-600/20 transition-all duration-200"
          >
            <Trash2 size={18} />
            清空画布
          </button>
        </div>

        <p className="mt-4 text-xs text-mocha-600/50">
          💡 提示：可以从我的衣橱页面拖拽衣物到槽位，或点击槽位选择衣物
        </p>
      </div>

      {/* ============================================
         搭配列表 - 横向滚动卡片展示
         ============================================ */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-mocha-800 mb-5 flex items-center gap-2">
          <Shirt size={20} className="text-mocha-600" />
          我的搭配
        </h2>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 h-72 bg-white rounded-xl shadow-md animate-pulse"
              />
            ))}
          </div>
        ) : outfits.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
            {outfits.map((outfit, index) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                index={index}
                onDelete={handleDeleteOutfit}
                allClothes={clothes}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white/50 rounded-xl border-2 border-dashed border-mocha-600/20">
            <Sparkles size={36} className="text-mocha-600/30 mx-auto mb-3" />
            <p className="text-mocha-600/60">还没有搭配</p>
            <p className="text-mocha-600/40 text-sm mt-1">
              使用上方画布创建你的第一套搭配吧！
            </p>
          </div>
        )}
      </div>

      {/* ============================================
         衣物选择弹窗
         ============================================ */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cream-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-bounce-in">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-4 border-b border-mocha-600/10">
              <h3 className="text-lg font-serif font-semibold text-mocha-800">
                选择{activeSlot ? canvasSlots.find((s) => s.key === activeSlot)?.label : ''}
              </h3>
              <button
                onClick={() => {
                  setShowPicker(false);
                  setActiveSlot(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-mocha-600
                         hover:bg-mocha-600/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 衣物列表 */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {availableClothes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableClothes.map((cloth) => (
                    <div
                      key={cloth.id}
                      onClick={() => selectClothForSlot(cloth)}
                      className="cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <ClothCard cloth={cloth} showActions={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-mocha-600/50">
                  暂无该类别衣物，请先到衣橱添加
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 搭配卡片子组件
// 横向滚动展示的搭配卡片
// ============================================================
interface OutfitCardProps {
  outfit: Outfit;
  index: number;
  onDelete: (id: string) => void;
  allClothes: Cloth[];
}

/**
 * 搭配卡片子组件
 * 展示搭配预览图和风格标签，点击可查看大图和详情
 */
function OutfitCard({ outfit, index, onDelete, allClothes }: OutfitCardProps) {
  // 获取搭配中的衣物
  const outfitClothIds = [outfit.topId, outfit.bottomId, outfit.shoesId, outfit.accessoryId].filter(
    Boolean
  ) as string[];
  const outfitClothes = allClothes.filter((c) => outfitClothIds.includes(c.id));

  // 预览图（取第一件衣物的图片作为主图）
  const previewCloth = outfitClothes[0];

  return (
    <div
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md overflow-hidden
                transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative
                animate-slide-in-from-bottom"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 删除按钮（悬停显示） */}
      <button
        onClick={() => onDelete(outfit.id)}
        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full
                 flex items-center justify-center text-rose-500 shadow-md z-10
                 opacity-0 group-hover:opacity-100 transition-opacity
                 hover:bg-rose-500 hover:text-white"
      >
        <Trash2 size={14} />
      </button>

      {/* 预览图 */}
      <div className="h-48 bg-gradient-to-br from-cream-100 to-mocha-100 relative overflow-hidden">
        {previewCloth ? (
          <img
            src={previewCloth.imageUrl}
            alt={outfit.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mocha-600/30">
            <Shirt size={40} />
          </div>
        )}

        {/* 小缩略图（显示其他衣物） */}
        {outfitClothes.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {outfitClothes.slice(1, 4).map((cloth) => (
              <div
                key={cloth.id}
                className="w-8 h-8 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white"
              >
                <img
                  src={cloth.imageUrl}
                  alt={cloth.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-mocha-800 truncate mb-2">
          {outfit.name}
        </h3>

        {/* 风格标签 */}
        <div className="flex flex-wrap gap-1">
          {outfit.styleTags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-mocha-100 to-mocha-200 text-mocha-700 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {outfit.description && (
          <p className="text-xs text-mocha-600/60 mt-2 line-clamp-1">
            {outfit.description}
          </p>
        )}
      </div>
    </div>
  );
}
