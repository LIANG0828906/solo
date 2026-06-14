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
      <div className="upcoming-card glass-card p-4 cursor-pointer birthday-card">
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
          {daysUntil === 0 ? (
            <span className="text-orange-400">🎂 今天!</span>
          ) : (
            <span>还有 {daysUntil} 天</span>
          )}
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
            {daysUntil === 0 ? (
              <span className="text-orange-400">🎂 今天是生日!</span>
            ) : daysUntil === 1 ? (
              <span className={countdownColor}>明天就是生日!</span>
            ) : (
              <span className={countdownColor}>还有 {daysUntil} 天</span>
            )}
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
