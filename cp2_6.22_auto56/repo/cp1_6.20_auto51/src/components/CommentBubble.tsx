import React from 'react';
import { User } from 'lucide-react';
import type { Comment } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getContrastColor } from '@/utils/colorUtils';

interface CommentBubbleProps {
  comment: Comment;
  paletteColors?: string[];
  onColorClick?: (colorIndex: number) => void;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  comment,
  paletteColors,
  onColorClick
}) => {
  const referencedColor = comment.colorIndex !== undefined && paletteColors 
    ? paletteColors[comment.colorIndex] 
    : null;

  return (
    <div className="flex gap-3 animate-expandIn">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
        <User size={14} className="text-white" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-800">{comment.userEmail}</span>
          <span className="text-xs text-gray-400">
            {format(new Date(comment.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
          </span>
        </div>
        
        {referencedColor && (
          <div 
            className="inline-flex items-center gap-2 px-2 py-1 rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ 
              backgroundColor: referencedColor,
              color: getContrastColor(referencedColor)
            }}
            onClick={() => onColorClick?.(comment.colorIndex!)}
          >
            <div className="w-4 h-4 rounded border border-white/30" style={{ backgroundColor: referencedColor }} />
            <span className="text-xs font-mono">{referencedColor}</span>
          </div>
        )}
        
        <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 inline-block max-w-full">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );
};
