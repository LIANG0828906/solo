import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rating {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  score: number;
  comment: string;
  createdAt: string;
}

interface CommentItemProps {
  rating: Rating;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

export default function CommentItem({ rating }: CommentItemProps) {
  return (
    <div className="animate-slide-in rounded-xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <img
          src={rating.fromUserAvatar}
          alt={rating.fromUserName}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 truncate">
              {rating.fromUserName}
            </span>
            <span className="text-xs text-gray-400 ml-2 shrink-0">
              {getRelativeTime(rating.createdAt)}
            </span>
          </div>
          <div className="mt-0.5 flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3.5 w-3.5',
                  i < rating.score
                    ? 'fill-primary text-primary'
                    : 'fill-none text-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      </div>
      {rating.comment && (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          {rating.comment}
        </p>
      )}
    </div>
  );
}
