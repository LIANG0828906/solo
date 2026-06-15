/**
 * UpcomingBanner 组件
 *
 * 职责：
 *   横向滚动展示30天内即将到来的生日列表，支持自动无限循环滚动，
 *   鼠标悬停时暂停滚动，方便用户查看具体信息。
 *
 * 调用关系：
 *   - 被 App.tsx 调用，作为页面顶部的公告横幅区域
 *   - 通过 props 接收 people: Person[] 数组数据源
 *   - 内部渲染 BirthdayCard 组件（compact 紧凑模式）
 *
 * 数据流：
 *   App.tsx
 *     → people（全部生日记录）
 *     → getUpcomingBirthdays(people, 30)（筛选出30天内的生日）
 *     → duplicatedList（列表复制一份实现无缝滚动衔接）
 *     → 遍历渲染 BirthdayCard[] 卡片数组
 *
 * CSS 实现原理：
 *   - .banner-container：外层容器，设置 overflow:hidden 裁剪超出部分，
 *     使用 mask-image 实现左右两侧渐隐淡出的视觉效果
 *   - .banner-track：内层滚动轨道，使用 flex 横向排列，通过
 *     CSS @keyframes scroll 动画（30s linear infinite）实现匀速滚动
 *   - .banner-container:hover .banner-track：悬停时设置
 *     animation-play-state: paused 暂停滚动
 *   - .upcoming-card：每张卡片固定宽度 180px（移动端 150px），
 *     flex-shrink: 0 防止卡片被压缩
 *   - 无缝滚动：将列表复制一份（duplicatedList = [...list, ...list]），
 *     动画从 translateX(0) 滚动到 translateX(-50%)，刚好滚动完第一份列表，
 *     此时视觉上第二份列表衔接在第一份的位置，实现无限循环
 */
import { memo, useMemo } from 'react';
import type { Person } from '@/types';
import { BirthdayCard } from './BirthdayCard';
import { getUpcomingBirthdays } from '@/utils/dateUtils';

interface UpcomingBannerProps {
  people: Person[];
}

export const UpcomingBanner = memo(function UpcomingBanner({
  people,
}: UpcomingBannerProps) {
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(people, 30),
    [people]
  );

  if (upcomingBirthdays.length === 0) {
    return null;
  }

  const duplicatedList = [...upcomingBirthdays, ...upcomingBirthdays];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎉</span>
        <h2 className="text-xl font-bold font-display">
          即将到来的生日
          <span className="ml-2 text-sm font-normal text-gray-300">
            ({upcomingBirthdays.length} 个生日在30天内)
          </span>
        </h2>
      </div>

      <div className="banner-container glass-card p-4">
        <div className="banner-track">
          {duplicatedList.map((person, index) => (
            <div
              key={`${person.id}-${index}`}
              onClick={() => {
                // 横幅卡片点击不触发编辑
              }}
            >
              <BirthdayCard person={person} compact />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        🖱️ 鼠标悬停暂停滚动
      </p>
    </div>
  );
});
