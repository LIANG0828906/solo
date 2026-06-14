import { memo } from 'react';
import type { Person } from '@/types';
import { BirthdayCard } from './BirthdayCard';
import { sortByBirthday } from '@/utils/dateUtils';
import { useBirthdayStore } from '@/store/useBirthdayStore';

interface BirthdayListProps {
  people: Person[];
}

export const BirthdayList = memo(function BirthdayList({
  people,
}: BirthdayListProps) {
  const { newestPersonId } = useBirthdayStore();
  const sortedPeople = sortByBirthday(people);

  if (sortedPeople.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🎂</div>
        <h3 className="text-2xl font-bold font-display mb-2">
          还没有生日记录
        </h3>
        <p className="text-gray-300 mb-6">
          点击上方的"添加生日"按钮，开始记录您亲友的生日吧！
        </p>
        <p className="text-sm text-gray-400">
          我们会帮您记住每一个重要的日子，并提供贴心的礼物灵感
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sortedPeople.map((person) => (
        <BirthdayCard
          key={person.id}
          person={person}
          isNew={person.id === newestPersonId}
        />
      ))}
    </div>
  );
});
