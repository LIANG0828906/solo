import type { MoodId } from '@/types';
import { getMood } from '@/utils/mood';
import { cn } from '@/lib/utils';

interface MoodTagProps {
  mood: MoodId;
  showEmoji?: boolean;
  showName?: boolean;
}

export default function MoodTag({ mood, showEmoji = true, showName = true }: MoodTagProps) {
  const moodConfig = getMood(mood);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm',
        'font-medium'
      )}
      style={{
        backgroundColor: `${moodConfig.color}20`,
        color: moodConfig.color,
      }}
    >
      {showEmoji && <span>{moodConfig.emoji}</span>}
      {showName && <span>{moodConfig.name}</span>}
    </span>
  );
}
