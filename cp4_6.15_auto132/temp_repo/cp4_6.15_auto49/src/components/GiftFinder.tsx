/**
 * GiftFinder - 礼物推荐发现器组件
 *
 * 【职责】
 *   接收 Person 对象的兴趣标签，从内置礼物数据库中智能匹配并展示 3 个礼物推荐，
 *   为用户提供个性化的生日礼物灵感。
 *
 * 【调用关系】
 *   - 被调用方：App.tsx 条件渲染，当 isGiftModalOpen 为 true 时挂载显示
 *   - 内部调用：getGiftRecommendations(interests, 3) 从礼物数据库获取匹配推荐
 *   - 子组件渲染：循环渲染 3 个 GiftCard 组件展示每个礼物
 *
 * 【数据流】
 *   App → selectedPerson → GiftFinder → person.interests
 *                                        ↓
 *                              getGiftRecommendations()
 *                                        ↓
 *                                   giftDatabase
 *                                        ↓
 *                              GiftCard[] (3个卡片)
 *
 * 【功能点】
 *   1. 刷新换一批：点击右上角刷新按钮，通过更新 key 触发 useEffect 重新获取随机推荐
 *   2. 点击遮罩关闭：点击弹窗半透明遮罩区域（非内容区）关闭弹窗
 *   3. 动画效果：3 个礼物卡片从左到右依次旋转飞入（通过 gift-card CSS 类的 nth-child 延迟实现）
 *   4. 关闭按钮：点击 X 按钮或"我知道了"按钮关闭弹窗
 *
 * @component
 */
import { memo, useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import type { Person, GiftIdea } from '@/types';
import { GiftCard } from './GiftCard';
import { getGiftRecommendations } from '@/utils/giftDatabase';
import { useBirthdayStore } from '@/store/useBirthdayStore';

/**
 * GiftFinder 组件 Props 接口定义
 * @property person - 目标人物对象，包含兴趣标签用于礼物匹配
 */
interface GiftFinderProps {
  person: Person;
}

export const GiftFinder = memo(function GiftFinder({ person }: GiftFinderProps) {
  // 从全局状态获取关闭弹窗的方法
  const { closeGiftModal } = useBirthdayStore();
  // 存储当前推荐的礼物列表
  const [recommendations, setRecommendations] = useState<GiftIdea[]>([]);
  // key 用于强制刷新礼物推荐（换一批功能）
  const [key, setKey] = useState(0);

  /**
   * 当人物兴趣标签或刷新 key 变化时，重新获取礼物推荐
   * key 变化会触发此 effect，实现"换一批"功能
   */
  useEffect(() => {
    setRecommendations(getGiftRecommendations(person.interests, 3));
  }, [person.interests, key]);

  /**
   * 换一批按钮点击处理
   * 通过递增 key 值触发 useEffect 重新获取随机推荐
   */
  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  /**
   * 遮罩层点击处理
   * 仅当点击的是遮罩层本身（而非内部内容）时才关闭弹窗
   * @param e - 鼠标事件对象
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeGiftModal();
    }
  };

  return (
    // 弹窗遮罩层 - 点击空白区域关闭弹窗
    <div className="modal-overlay" onClick={handleOverlayClick}>
      {/* 弹窗内容区 - 毛玻璃效果卡片 */}
      <div className="modal-content glass-card p-8">
        {/* ========== 顶部标题栏 ========== */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* 金色星星图标 */}
            <Sparkles className="text-[#D4AF37]" size={28} />
            <div>
              {/* 主标题 - 使用装饰字体 */}
              <h2 className="text-2xl font-bold font-display">
                为 {person.name} 找到的礼物灵感
              </h2>
              {/* 副标题 - 显示匹配的兴趣标签 */}
              <p className="text-sm text-gray-300 mt-1">
                基于兴趣标签：{person.interests.join('、')}
              </p>
            </div>
          </div>

          {/* 操作按钮组：换一批 + 关闭 */}
          <div className="flex items-center gap-2">
            {/* 换一批按钮 - 通过递增 key 值触发重新获取推荐 */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
              title="换一批"
              aria-label="换一批推荐"
            >
              <RefreshCw size={20} />
            </button>
            {/* 关闭按钮 - 悬停变红色 */}
            <button
              onClick={closeGiftModal}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500 transition-all duration-200 hover:scale-105"
              title="关闭"
              aria-label="关闭弹窗"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ========== 礼物卡片网格 ========== */}
        {/* 响应式布局：移动端单列，桌面端三列 */}
        {/* key 组合 gift.id 和刷新 key，确保换一批时重新触发动画 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((gift, index) => (
            <GiftCard key={`${gift.id}-${key}`} gift={gift} index={index} />
          ))}
        </div>

        {/* ========== 底部提示与确认按钮 ========== */}
        <div className="mt-6 text-center">
          {/* 操作提示 */}
          <p className="text-sm text-gray-400 mb-4">
            💡 点击卡片翻转查看详情和购买建议
          </p>
          {/* 确认关闭按钮 - 金色主按钮 */}
          <button onClick={closeGiftModal} className="btn-gold">
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
});
