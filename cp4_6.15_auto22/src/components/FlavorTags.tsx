import React, { useState, useCallback } from 'react';
import { FLAVOR_TAGS } from '@/types';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function FlavorTags({ selected, onChange }: Props) {
  const [animatingTag, setAnimatingTag] = useState<string | null>(null);

  const toggleTag = useCallback(
    (tagId: string) => {
      setAnimatingTag(tagId);
      setTimeout(() => setAnimatingTag(null), 300);

      if (selected.includes(tagId)) {
        onChange(selected.filter((t) => t !== tagId));
      } else {
        onChange([...selected, tagId]);
      }
    },
    [selected, onChange]
  );

  const tagColors: Record<string, string> = {
    floral: 'bg-pink-50 border-pink-300 text-pink-800',
    fruity: 'bg-orange-50 border-orange-300 text-orange-800',
    nutty: 'bg-amber-50 border-amber-300 text-amber-800',
    chocolate: 'bg-yellow-900/10 border-yellow-800/30 text-yellow-900',
    caramel: 'bg-amber-100 border-amber-400 text-amber-900',
    woody: 'bg-stone-100 border-stone-400 text-stone-800',
    earthy: 'bg-lime-50 border-lime-400 text-lime-900',
  };

  const activeColors: Record<string, string> = {
    floral: 'bg-pink-200 border-pink-500 text-pink-900 shadow-pink-200/50',
    fruity: 'bg-orange-200 border-orange-500 text-orange-900 shadow-orange-200/50',
    nutty: 'bg-amber-200 border-amber-500 text-amber-900 shadow-amber-200/50',
    chocolate: 'bg-yellow-800/20 border-yellow-900/50 text-yellow-950 shadow-yellow-800/30',
    caramel: 'bg-amber-300 border-amber-500 text-amber-950 shadow-amber-300/50',
    woody: 'bg-stone-200 border-stone-500 text-stone-900 shadow-stone-200/50',
    earthy: 'bg-lime-200 border-lime-500 text-lime-900 shadow-lime-200/50',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FLAVOR_TAGS.map((tag) => {
        const isActive = selected.includes(tag.id);
        const isAnimating = animatingTag === tag.id;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`
              inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium
              transition-all duration-200 cursor-pointer select-none
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber
              ${isActive ? activeColors[tag.id] + ' shadow-md' : tagColors[tag.id]}
              ${isAnimating ? 'animate-bounce_tag' : ''}
            `}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
