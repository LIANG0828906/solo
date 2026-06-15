/**
 * GiftCard - 单个礼物卡片组件
 *
 * 【职责】
 *   展示单个礼物推荐的详情卡片，支持点击 3D 翻转交互。
 *   正面显示：礼物名称、分类标签、兴趣标签
 *   背面显示：礼物详细描述、推荐购买平台链接
 *
 * 【调用关系】
 *   - 被调用方：GiftFinder 组件通过 map 循环渲染，每个礼物对应一个 GiftCard
 *   - 接收 Props：gift（礼物数据对象）、index（卡片索引，用于动画延迟控制）
 *
 * 【动画效果】
 *   1. 旋转飞入动画（gift-card 类）：
 *      - 初始状态：透明度 0，向左偏移 200px，Y 轴旋转 -90°，缩放 0.7
 *      - 结束状态：透明度 1，位置归零，无旋转，正常缩放
 *      - 延迟控制：通过 CSS nth-child 选择器实现从左到右依次飞入（0.15s / 0.35s / 0.55s）
 *      - 缓动函数：cubic-bezier(0.34, 1.56, 0.64, 1) 带回弹效果
 *
 *   2. 3D 翻转动画（flip-card 类）：
 *      - 点击卡片时翻转 180°，切换正反面显示
 *      - 内部容器 flip-card-inner 执行 rotateY(180deg) 变换
 *      - 翻转耗时 0.7s，使用 cubic-bezier(0.4, 0, 0.2, 1) 缓动
 *      - 通过 CSS perspective: 1200px 营造 3D 透视感
 *
 * @component
 */
import { memo, useState } from 'react';
import type { GiftIdea } from '@/types';
import { Tag, ShoppingCart, ExternalLink } from 'lucide-react';

/**
 * GiftCard 组件 Props 接口定义
 * @property gift - 礼物数据对象，包含名称、分类、描述、标签、购买平台等信息
 * @property index - 卡片在列表中的索引位置（预留用于动画延迟或序号显示）
 */
interface GiftCardProps {
  gift: GiftIdea;
  /** 卡片在列表中的索引位置（CSS nth-child 自动控制动画延迟，此处保留参数接口） */
  index?: number;
}

export const GiftCard = memo(function GiftCard({ gift }: GiftCardProps) {
  // 卡片翻转状态：true 显示背面（详情），false 显示正面（概览）
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * 卡片翻转切换处理
   * 点击卡片时在正反面之间切换
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    // gift-card: 旋转飞入动画类；flip-card: 3D翻转容器类；flipped: 翻转状态控制类
    <div
      className={`gift-card flip-card h-72 ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      // 支持键盘无障碍访问：Enter 或空格键触发翻转
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      {/* 翻转内部容器 - 实际执行 rotateY 动画的元素 */}
      <div className="flip-card-inner">
        {/* ========== 卡片正面：礼物概览信息 ========== */}
        <div
          className="flip-card-front p-6 flex flex-col justify-between"
          style={{ background: gift.gradient }}
        >
          <div>
            {/* 分类标签区域 */}
            <div className="flex items-center gap-2 mb-4">
              <Tag size={20} className="text-white/80" />
              <span className="text-sm font-medium text-white/80">
                {gift.category}
              </span>
            </div>
            {/* 礼物名称 - 使用装饰字体 */}
            <h3 className="text-2xl font-bold font-display text-white leading-tight">
              {gift.name}
            </h3>
          </div>

          <div>
            {/* 兴趣标签列表 */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {gift.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-white/20 text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            {/* 翻转提示文字 */}
            <p className="text-white/70 text-sm flex items-center gap-1">
              <ShoppingCart size={14} />
              点击翻转查看购买建议
            </p>
          </div>
        </div>

        {/* ========== 卡片背面：详情与购买链接 ========== */}
        <div className="flip-card-back bg-white/10 backdrop-blur-md p-6 flex flex-col justify-between border border-white/20">
          <div>
            {/* 礼物名称（金色标题） */}
            <h4 className="text-lg font-bold text-[#D4AF37] mb-3">
              {gift.name}
            </h4>
            {/* 礼物详细描述 */}
            <p className="text-gray-200 text-sm leading-relaxed">
              {gift.description}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">推荐购买平台：</p>
            {/* 购买平台链接列表 */}
            <div className="flex flex-wrap gap-2">
              {gift.platforms.map((platform) => (
                <a
                  key={platform}
                  href="#"
                  // 阻止事件冒泡，防止点击链接时触发卡片翻转
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1a1a2e] transition-all duration-200 flex items-center gap-1"
                >
                  {platform}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
