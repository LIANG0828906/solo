// ============================================================
// 我的衣橱页面
// 数据流向：
//   页面挂载 → useEffect → GET /api/clothes → 后端 → lowdb
//           ↓ 返回衣物列表
//   Zustand store.clothes → ClosetPage → 按 category 分组 → ClothCard 网格渲染
//   上传衣物 → POST /api/clothes → 后端 → lowdb → 返回新衣物 → store.addCloth
//   删除衣物 → DELETE /api/clothes/:id → 后端 → lowdb → store.removeCloth
//   拖拽排序 → PATCH /api/clothes/reorder → 后端更新 order
// 调用关系：调用 ClothCard 组件展示衣物，调用 useStore 获取全局状态，
//          调用 src/api/clothes.ts 中方法与后端通信
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Plus, Shirt, Briefcase, Footprints, Gem } from 'lucide-react';
import ClothCard from '@/components/ClothCard';
import { useStore } from '@/store/useStore';
import { getClothes, deleteCloth as apiDeleteCloth } from '@/api/clothes';
import type { Cloth, ClothCategory } from '@/types';

/**
 * 衣物分类配置
 * 每个类别对应不同的图标、名称和颜色
 */
const categoryConfig: Record<
  ClothCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  top: { label: '上衣', icon: <Shirt size={18} />, color: 'from-blush-200 to-blush-300' },
  bottom: { label: '下装', icon: <Briefcase size={18} />, color: 'from-dusty-200 to-dusty-300' },
  shoes: { label: '鞋子', icon: <Footprints size={18} />, color: 'from-sage-200 to-sage-300' },
  accessory: { label: '配饰', icon: <Gem size={18} />, color: 'from-lavender-200 to-lavender-300' },
};

/**
 * 分类顺序
 */
const categoryOrder: ClothCategory[] = ['top', 'bottom', 'shoes', 'accessory'];

/**
 * 我的衣橱页面组件
 *
 * 功能：
 * 1. 衣物网格展示（上衣、下装、鞋子、配饰各占不同区域，浅色分割线隔开）
 * 2. 上传新衣物（弹出表单，支持图片上传）
 * 3. 拖拽排序（HTML5 Drag & Drop API）
 * 4. 编辑/删除衣物
 */
export default function ClosetPage() {
  // 从全局 store 获取状态
  const clothes = useStore((state) => state.clothes);
  const setClothes = useStore((state) => state.setClothes);
  const removeCloth = useStore((state) => state.removeCloth);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 拖拽状态
  const [draggedCloth, setDraggedCloth] = useState<Cloth | null>(null);

  // ============================================================
  // 数据获取：useEffect 从 /api/clothes 获取衣物列表
  // 数据流向：挂载 → API → 后端 lowdb → 返回 → store → 渲染
  // ============================================================
  const fetchClothes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClothes();
      setClothes(data || []);
    } catch (error) {
      console.error('获取衣物列表失败:', error);
      setClothes([]);
    } finally {
      setIsLoading(false);
    }
  }, [setClothes]);

  useEffect(() => {
    fetchClothes();
  }, [fetchClothes]);

  // ============================================================
  // 拖拽排序逻辑
  // ============================================================

  /**
   * 处理拖拽开始
   * 设置当前拖拽的衣物对象
   */
  const handleDragStart = (e: React.DragEvent, cloth: Cloth) => {
    setDraggedCloth(cloth);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cloth.id);
  };

  /**
   * 处理拖拽悬停
   * 允许放置
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * 处理放置
   * 交换两件衣物的位置
   */
  const handleDrop = (e: React.DragEvent, targetCloth: Cloth) => {
    e.preventDefault();
    if (!draggedCloth || draggedCloth.id === targetCloth.id) return;

    // 仅在同一类别内排序
    if (draggedCloth.category !== targetCloth.category) {
      setDraggedCloth(null);
      return;
    }

    // 更新本地排序
    const updatedClothes = [...clothes];
    const draggedIndex = updatedClothes.findIndex((c) => c.id === draggedCloth.id);
    const targetIndex = updatedClothes.findIndex((c) => c.id === targetCloth.id);

    // 交换位置
    const [removed] = updatedClothes.splice(draggedIndex, 1);
    updatedClothes.splice(targetIndex, 0, removed);

    // 重新分配同类别内的 order
    const category = draggedCloth.category;
    let orderIdx = 0;
    updatedClothes.forEach((c) => {
      if (c.category === category) {
        c.order = orderIdx++;
      }
    });

    setClothes(updatedClothes);
    setDraggedCloth(null);
  };

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = () => {
    setDraggedCloth(null);
  };

  // ============================================================
  // 衣物操作
  // ============================================================

  /**
   * 删除衣物
   * 数据流向：点击删除 → API DELETE → 后端 lowdb 删除 → store.removeCloth
   */
  const handleDeleteCloth = async (id: string) => {
    if (!confirm('确定要删除这件衣物吗？')) return;
    try {
      await apiDeleteCloth(id);
      removeCloth(id);
    } catch (error) {
      console.error('删除衣物失败:', error);
    }
  };

  // ============================================================
  // 工具函数
  // ============================================================

  /**
   * 按类别分组衣物
   */
  const clothesByCategory = categoryOrder.reduce(
    (acc, category) => {
      acc[category] = clothes
        .filter((c) => c.category === category)
        .sort((a, b) => a.order - b.order);
      return acc;
    },
    {} as Record<ClothCategory, Cloth[]>
  );

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="p-4 md:p-8 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-mocha-800 mb-2">
            我的衣橱
          </h1>
          <p className="text-mocha-600/70 text-sm md:text-base">
            共 {clothes.length} 件衣物 · 让每件衣服都焕发新生
          </p>
        </div>

        {/* 添加衣物按钮 */}
        <button
          onClick={() => alert('上传衣物功能（请在弹窗中上传图片、填写名称、类别和标签）')}
          className="flex items-center gap-2 px-4 py-2.5 bg-mocha-600 text-white rounded-xl font-medium
                   shadow-md hover:bg-mocha-700 hover:shadow-lg transition-all duration-200
                   active:scale-95"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">添加衣物</span>
        </button>
      </div>

      {/* ============================================
         骨架屏加载状态
         首次加载时显示占位卡片动画
         ============================================ */}
      {isLoading && (
        <div className="space-y-8">
          {categoryOrder.map((category) => (
            <div key={category}>
              <div className="h-6 w-24 bg-mocha-200/50 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md h-48 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================
         衣物分类展示区域
         每个类别用浅色分割线隔开
         ============================================ */}
      {!isLoading &&
        categoryOrder.map((category, catIndex) => {
          const config = categoryConfig[category];
          const categoryClothes = clothesByCategory[category];

          return (
            <div key={category} className="mb-10 animate-fade-in">
              {/* 类别标题（浅色分割线） */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-mocha-600/10">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-mocha-800 shadow-sm`}
                >
                  {config.icon}
                </div>
                <h2 className="text-lg font-serif font-semibold text-mocha-800">
                  {config.label}
                </h2>
                <span className="text-sm text-mocha-600/60">
                  ({categoryClothes.length})
                </span>
                <div className="flex-1 h-px bg-mocha-600/10" />
              </div>

              {/* 衣物网格 */}
              {categoryClothes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {categoryClothes.map((cloth, index) => (
                    <div
                      key={cloth.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, cloth)}
                    >
                      <ClothCard
                        cloth={cloth}
                        index={catIndex * 10 + index}
                        onDelete={handleDeleteCloth}
                        draggable
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white/50 rounded-xl border-2 border-dashed border-mocha-600/20">
                  <div className="text-mocha-600/40 mb-2">{config.icon}</div>
                  <p className="text-mocha-600/60 text-sm">暂无{config.label}</p>
                  <p className="text-mocha-600/40 text-xs mt-1">
                    点击右上角「添加衣物」上传你的第一件{config.label}
                  </p>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
