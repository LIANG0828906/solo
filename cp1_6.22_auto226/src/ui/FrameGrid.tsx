import React, { useCallback } from 'react';
import { FrameData, MarkData, formatTimestamp } from '@/types';
import { Hash, FileText, Star } from 'lucide-react';

interface FrameGridProps {
  frames: FrameData[];
  marks: Record<string, MarkData>;
  onFrameClick: (frameId: string) => void;
}

const FrameCard = React.memo(function FrameCard({
  frame,
  mark,
  onClick,
}: {
  frame: FrameData;
  mark?: MarkData;
  onClick: () => void;
}) {
  return (
    <div
      className="frame-card group relative cursor-pointer overflow-hidden rounded-lg bg-[#1E293B] transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/40"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={frame.url}
          alt={`Frame ${frame.index}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {mark && (
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            {mark.tags.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#3B82F6]/80 text-white">
                <Hash size={12} />
              </span>
            )}
            {mark.note && (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#8B5CF6]/80 text-white">
                <FileText size={12} />
              </span>
            )}
            {mark.rating > 0 && (
              <span className="flex h-5 items-center justify-center rounded bg-[#EAB308]/80 px-1 text-white">
                <Star size={10} fill="currentColor" />
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-2 py-1.5 text-xs text-[#94A3B8]">
        <span className="font-medium text-[#E2E8F0]">#{frame.index + 1}</span>
        <span>{formatTimestamp(frame.timestamp)}</span>
      </div>
    </div>
  );
});

export function FrameGrid({ frames, marks, onFrameClick }: FrameGridProps) {
  const handleClick = useCallback(
    (frameId: string) => () => onFrameClick(frameId),
    [onFrameClick]
  );

  if (frames.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[#64748B]">
        <div className="text-center">
          <p className="text-lg font-medium">暂无关键帧</p>
          <p className="mt-1 text-sm">上传视频文件以开始提取关键帧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="frame-grid grid gap-3 p-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {frames.map((frame) => (
        <FrameCard
          key={frame.id}
          frame={frame}
          mark={marks[frame.id]}
          onClick={handleClick(frame.id)}
        />
      ))}
    </div>
  );
}
