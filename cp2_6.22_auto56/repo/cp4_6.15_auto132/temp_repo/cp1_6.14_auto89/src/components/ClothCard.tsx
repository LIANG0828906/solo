// ============================================================
// 衣物卡片组件
// 数据流向：接收 Cloth 数据对象 → 渲染圆形缩略图 + 名称 + 标签 + 操作按钮
// 调用关系：被 ClosetPage.tsx、FriendProfilePage.tsx 等页面调用，接收 onSwap 回调
// ============================================================

import { useState } from 'react';
import { ImageOff, Shuffle, Trash2, Edit3 } from 'lucide-react';
import type { Cloth, ClothStyle } from '@/types';

/**
 * 风格标签渐变色映射
 * 每种风格对应不同的渐变色背景
 */
const styleGradientMap: Record<ClothStyle, string> = {
  '通勤': 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800',
  '休闲': 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800',
  '约会': 'bg-gradient-to-r from-pink-100 to-rose-200 text-pink-800',
  '运动': 'bg-gradient-to-r from-orange-100 to-red-200 text-orange-800',
  '正式': 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800',
  '复古': 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800',
  '街头': 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800',
};

/**
 * 季节图标映射
 * 每种季节对应一个 Emoji 图标
 */
const seasonIconMap: Record<string, string> = {
  '春': '🌸',
  '夏': '☀️',
  '秋': '🍂',
  '冬': '❄️',
  '四季': '🌈',
};

/**
 * 衣物卡片组件 Props 接口
 */
interface ClothCardProps {
  /** 衣物数据对象 */
  cloth: Cloth;
  /** 交换请求回调（好友衣橱中点击时触发） */
  onSwap?: (cloth: Cloth) => void;
  /** 是否显示操作按钮（个人衣橱显示，好友衣橱隐藏） */
  showActions?: boolean;
  /** 删除衣物回调 */
  onDelete?: (id: string) => void;
  /** 编辑衣物回调 */
  onEdit?: (cloth: Cloth) => void;
  /** 卡片索引，用于动画延迟 */
  index?: number;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 拖拽开始回调 */
  onDragStart?: (e: React.DragEvent, cloth: Cloth) => void;
  /** 拖拽结束回调 */
  onDragEnd?: () => void;
}

/**
 * 衣物卡片组件
 *
 * 功能特性：
 * - 圆形裁剪缩略图，加载时旋转淡入动画
 * - 风格标签使用渐变色
 * - 季节标签使用图标表示
 * - 悬停时卡片上浮并投射阴影
 * - 支持懒加载图片
 * - 图片加载失败时展示占位图
 */
export default function ClothCard({
  cloth,
  onSwap,
  showActions = true,
  onDelete,
  onEdit,
  index = 0,
  draggable = false,
  onDragStart,
  onDragEnd,
}: ClothCardProps) {
  // 图片加载状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 操作按钮悬停状态
  const [isHovered, setIsHovered] = useState(false);

  /**
   * 处理图片加载成功
   * 触发旋转淡入动画
   */
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  /**
   * 处理图片加载失败
   * 显示占位图和错误提示
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * 处理拖拽开始
   */
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, cloth);
    }
  };

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div
      className={`
        group relative bg-white rounded-xl shadow-md overflow-hidden
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-translate-y-2
        animate-slide-in-from-bottom
      `}
      style={{
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 圆形缩略图区域 */}
      <div className="relative flex justify-center pt-4 pb-2">
        <div className="relative w-24 h-24 overflow-hidden rounded-full border-4 border-cream-100 shadow-inner bg-mocha-600/10">
          {/* 图片加载错误时显示占位图 */}
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-mocha-600/10 text-mocha-700/60">
              <ImageOff size={28} className="mb-1" />
              <span className="text-[10px]">加载失败</span>
            </div>
          ) : (
            <>
              {/* 旋转淡入动画容器 */}
              <div
                className={`
                  w-full h-full transition-all duration-700 ease-out
                  ${imageLoaded ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-12 scale-90'}
                `}
              >
                <img
                  src={cloth.imageUrl}
                  alt={cloth.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
              {/* 加载中骨架效果 */}
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-mocha-600/10 to-mocha-600/20 rounded-full" />
              )}
            </>
          )}
        </div>
      </div>

      {/* 衣物名称 */}
      <div className="px-3 pb-2 text-center">
        <h3 className="text-sm font-semibold text-mocha-800 truncate" title={cloth.name}>
          {cloth.name}
        </h3>
      </div>

      {/* 风格标签区域 */}
      <div className="px-3 pb-2 flex flex-wrap justify-center gap-1">
        {cloth.styles.slice(0, 2).map((style) => (
          <span
            key={style}
            className={`
              text-[10px] px-2 py-0.5 rounded-full font-medium
              ${styleGradientMap[style]}
            `}
          >
            {style}
          </span>
        ))}
      </div>

      {/* 季节图标区域 */}
      <div className="px-3 pb-3 flex justify-center gap-1">
        {cloth.seasons.slice(0, 4).map((season) => (
          <span key={season} className="text-xs" title={`${season}季`}>
            {seasonIconMap[season] || '✨'}
          </span>
        ))}
      </div>

      {/* 操作按钮层（悬停时显示） */}
      {showActions && (
        <div
          className={`
            absolute inset-0 bg-black/30 flex items-center justify-center gap-2
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {onEdit && (
            <button
              onClick={() => onEdit(cloth)}
              className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center
                       text-mocha-700 hover:bg-mocha-600 hover:text-white transition-colors duration-200"
              title="编辑衣物"
            >
              <Edit3 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(cloth.id)}
              className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center
                       text-rose-600 hover:bg-rose-500 hover:text-white transition-colors duration-200"
              title="删除衣物"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* 好友衣橱中的交换按钮 */}
      {onSwap && !showActions && (
        <div
          className={`
            absolute inset-0 bg-black/30 flex items-center justify-center
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <button
            onClick={() => onSwap(cloth)}
            className="px-4 py-2 rounded-full bg-mocha-600 text-white shadow-lg flex items-center gap-2
                     hover:bg-mocha-700 transition-colors duration-200 font-medium text-sm"
          >
            <Shuffle size={16} />
            申请交换
          </button>
        </div>
      )}
    </div>
  );
}
