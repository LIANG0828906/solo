import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Participant } from '@/types';

interface ParticipantAvatarProps {
  participant?: Participant;
  onClick?: () => void;
  isPayer?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-sm',
    check: 'w-4 h-4',
    checkIcon: 'w-2.5 h-2.5',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-base',
    check: 'w-5 h-5',
    checkIcon: 'w-3 h-3',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-lg',
    check: 'w-6 h-6',
    checkIcon: 'w-3.5 h-3.5',
  },
};

export default function ParticipantAvatar({ participant, onClick, isPayer = false, size = 'md' }: ParticipantAvatarProps) {
  const [showRing, setShowRing] = useState(false);

  const handleClick = () => {
    if (participant && !participant.confirmed) {
      setShowRing(true);
      setTimeout(() => setShowRing(false), 300);
    }
    onClick?.();
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (!participant) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#E0D5C1]',
          sizeConfig[size].container
        )}
      >
        <span className={cn('text-[#8B7D6B]', sizeConfig[size].text)}>?</span>
      </div>
    );
  }

  const config = sizeConfig[size];

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={cn(
          'avatar-container relative flex items-center justify-center rounded-full font-bold text-white transition-all duration-200',
          config.container,
          isPayer && 'payer-avatar',
          participant.confirmed && 'avatar-glow',
          onClick && 'cursor-pointer'
        )}
        style={{ backgroundColor: participant.color }}
        disabled={!onClick}
      >
        {showRing && <div className="gold-ring" />}
        <span className={cn(isPayer ? 'text-lg' : config.text)}>
          {getInitial(participant.name)}
        </span>
        {participant.confirmed && (
          <div className={cn(
            'absolute -bottom-1 -right-1 rounded-full bg-[#FFD93D] flex items-center justify-center',
            config.check
          )}>
            <Check className={cn('text-[#4A3B32] stroke-[3]', config.checkIcon)} />
          </div>
        )}
      </button>
    </div>
  );
}
