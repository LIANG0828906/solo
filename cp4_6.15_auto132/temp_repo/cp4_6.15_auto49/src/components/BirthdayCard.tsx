/**
 * BirthdayCard 组件
 *
 * 职责：
 *   渲染单个生日信息卡片，支持两种展示模式：
 *   - compact 模式：紧凑横幅卡片，用于 UpcomingBanner 横向滚动横幅中
 *   - 完整模式：详细信息卡片，用于 BirthdayList 网格列表中展示
 *   卡片展示头像、姓名、生日日期、兴趣标签、倒计时天数，并提供
 *   找礼物、编辑、删除等操作按钮。
 *
 * 调用关系：
 *   - 被 UpcomingBanner.tsx 调用（compact=true，横幅模式）
 *   - 被 BirthdayList.tsx 调用（compact=false，网格列表模式）
 *   - 接收 props: person(Person对象)、isNew(是否新添加)、compact(是否紧凑模式)
 *   - 内部使用 useBirthdayStore 获取操作方法
 *
 * 数据流向：
 *   1. 从 props.person 获取展示数据（name, birthday, interests, avatarColor）
 *   2. 通过 useCountdown hook 计算距离下次生日的天数
 *   3. 通过 getCountdownColorClass() 根据天数获取倒计时颜色类名
 *   4. 通过 getInitial() 提取姓名首字母作为头像文字
 *   5. 用户操作（编辑/删除/找礼物）通过 useBirthdayStore 的方法触发状态更新
 *   6. isNew 标记控制新卡片的滑入动画，动画结束后调用 clearNewestPersonId 清理
 *
 * 性能优化：
 *   - 使用 React.memo 包裹组件，避免 props 未变化时的不必要重渲染
 *   - 按钮点击事件使用 stopPropagation 防止冒泡触发卡片点击
 */
import { memo, useEffect, useState } from 'react';
import { Gift, Edit2, Trash2 } from 'lucide-react';
import type { Person } from '@/types';
import { useCountdown } from '@/hooks/useCountdown';
import {
  formatBirthdayDisplay,
  getCountdownColorClass,
} from '@/utils/dateUtils';
import { getInitial } from '@/utils/colorUtils';
import { useBirthdayStore } from '@/store/useBirthdayStore';

interface BirthdayCardProps {
  person: Person;
  isNew?: boolean;
  compact?: boolean;
}

export const BirthdayCard = memo(function BirthdayCard({
  person,
  isNew = false,
  compact = false,
}: BirthdayCardProps) {
  const daysUntil = useCountdown(person.birthday);
  const [showAnimation, setShowAnimation] = useState(isNew);
  const { openGiftModal, openEditModal, deletePerson, clearNewestPersonId } =
    useBirthdayStore();

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        clearNewestPersonId();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isNew, clearNewestPersonId]);

  const showPulseDot = daysUntil <= 30 && daysUntil >= 0;
  const countdownColor = getCountdownColorClass(daysUntil);
  const initial = getInitial(person.name);

  const getCountdownText = () => {
    if (daysUntil === 0) return '🎂 今天!';
    if (daysUntil === 1) return '明天就是生日!';
    return `还有 ${daysUntil} 天`;
  };

  const handleGiftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openGiftModal(person);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditModal(person);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除 ${person.name} 的生日记录吗？`)) {
      deletePerson(person.id);
    }
  };

  const handleCardClick = () => {
    openEditModal(person);
  };

  if (compact) {
    return (
      <div className="upcoming-card glass-card p-4 cursor-pointer birthday-card relative">
        {showPulseDot && <div className="pulse-dot" />}

        <div className="flex items-center gap-3">
          <div
            className="avatar-circle"
            style={{ backgroundColor: person.avatarColor }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{person.name}</p>
            <p className="text-sm text-gray-300">
              {formatBirthdayDisplay(person.birthday)}
            </p>
          </div>
        </div>
        <div className={`mt-3 text-center font-bold ${countdownColor}`}>
          <span>{getCountdownText()}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card p-5 birthday-card ${
        showAnimation ? 'new-card' : ''
      }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      {showPulseDot && <div className="pulse-dot" />}

      <div className="flex items-start gap-4">
        <div
          className="avatar-circle w-14 h-14 text-xl"
          style={{ backgroundColor: person.avatarColor }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold font-display truncate">
            {person.name}
          </h3>
          <p className="text-gray-300 mt-1">
            📅 {formatBirthdayDisplay(person.birthday)}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {person.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200"
              >
                {interest}
              </span>
            ))}
            {person.interests.length > 4 && (
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-200">
                +{person.interests.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className={`text-lg font-bold ${countdownColor}`}>
            <span>{getCountdownText()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg bg-white/10 hover:bg-[#D4AF37] hover:text-[#1a1a2e] transition-all duration-200 hover:scale-105"
              onClick={handleGiftClick}
              title="找礼物"
              aria-label="找礼物"
            >
              <Gift size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-white/10 hover:bg-blue-500 transition-all duration-200 hover:scale-105"
              onClick={handleEditClick}
              title="编辑"
              aria-label="编辑"
            >
              <Edit2 size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500 transition-all duration-200 hover:scale-105"
              onClick={handleDeleteClick}
              title="删除"
              aria-label="删除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
