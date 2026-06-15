import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoverRecord, TemplateId } from '@/types';
import { TEMPLATES } from '@/types';

interface HistoryCardProps {
  record: CoverRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

const templateColorMap: Record<TemplateId, string> = {
  serious: 'bg-vintage-red/10 text-vintage-red border-vintage-red/20',
  entertainment: 'bg-pink-100 text-pink-600 border-pink-200',
  vintage: 'bg-amber-100 text-amber-700 border-amber-200',
};

const templateThumbnailBg: Record<TemplateId, string> = {
  serious: 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]',
  entertainment: 'bg-gradient-to-br from-[#FFE4EC] to-[#F3E8FF]',
  vintage: 'bg-gradient-to-br from-[#F5E6C8] to-[#E8D5B0]',
};

const templateThumbnailText: Record<TemplateId, string> = {
  serious: 'text-[#FFD700]',
  entertainment: 'text-[#D946EF]',
  vintage: 'text-[#8B4513]',
};

export default function HistoryCard({
  record,
  onEdit,
  onDelete,
  index = 0,
}: HistoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const template = TEMPLATES.find((t) => t.id === record.template);
  const formattedDate = new Date(record.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(record.id);
    }, 500);
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-white shadow-md',
        'hover:shadow-xl hover:-translate-y-2 transition-all duration-300',
        'border border-vintage-red/10',
        isDeleting ? 'animate-flipOut' : 'animate-slideUp opacity-0'
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        <button
          onClick={() => onEdit(record.id)}
          className={cn(
            'rounded-full p-2 shadow-md transition-all duration-300',
            'bg-white/90 backdrop-blur-sm text-vintage-red',
            'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0',
            'hover:bg-vintage-red hover:text-cream',
            'active:scale-95'
          )}
          title="编辑"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={cn(
            'rounded-full p-2 shadow-md transition-all duration-300',
            'bg-white/90 backdrop-blur-sm text-red-500',
            'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0',
            'hover:bg-red-500 hover:text-white',
            'active:scale-95',
            isDeleting && 'cursor-wait'
          )}
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div
        className={cn(
          'aspect-[210/297] relative overflow-hidden',
          templateThumbnailBg[record.template]
        )}
      >
        {record.thumbnail ? (
          <img
            src={record.thumbnail}
            alt={record.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <h3
              className={cn(
                'font-display font-bold text-xl text-center leading-tight line-clamp-3',
                templateThumbnailText[record.template]
              )}
            >
              {record.title || '未命名封面'}
            </h3>
            {record.summary && (
              <p
                className={cn(
                  'mt-3 text-xs text-center line-clamp-2 opacity-70',
                  templateThumbnailText[record.template]
                )}
              >
                {record.summary}
              </p>
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 bg-cream/80 backdrop-blur-sm">
        <h3
          className="font-semibold text-ink text-lg leading-snug line-clamp-2"
          title={record.title}
        >
          {record.title || '未命名封面'}
        </h3>

        <div className="flex justify-between items-center mt-3 text-sm">
          <span className="text-gray-500 font-sans">
            {formattedDate}
          </span>

          {template && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                templateColorMap[record.template]
              )}
            >
              {template.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
