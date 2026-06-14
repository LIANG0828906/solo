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
