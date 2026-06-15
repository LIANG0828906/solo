import React, { useState, useCallback } from 'react';
import { FLAVOR_TAGS } from '@/types';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function FlavorTags({ selected, onChange }: Props) {
  const [animatingTags, setAnimatingTags] = useState<Record<string, number>>({});

  const toggleTag = useCallback(
    (tagId: string) => {
      setAnimatingTags((prev) => ({ ...prev, [tagId]: Date.now() }));
      setTimeout(() => {
        setAnimatingTags((prev) => {
          const next = { ...prev };
          delete next[tagId];
          return next;
        });
      }, 400);

      if (selected.includes(tagId)) {
        onChange(selected.filter((t) => t !== tagId));
      } else {
        onChange([...selected, tagId]);
      }
    },
    [selected, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent, tagId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTag(tagId);
    }
  };

  const tagColors: Record<string, { base: string; active: string }> = {
    floral: {
      base: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
      active: 'bg-pink-300 border-pink-500 text-pink-900 shadow-pink-300/40 shadow-md',
    },
    fruity: {
      base: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
      active: 'bg-orange-300 border-orange-500 text-orange-900 shadow-orange-300/40 shadow-md',
    },
    nutty: {
      base: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
      active: 'bg-amber-300 border-amber-500 text-amber-900 shadow-amber-300/40 shadow-md',
    },
    chocolate: {
      base: 'bg-yellow-900/5 border-yellow-900/20 text-yellow-900 hover:bg-yellow-900/10',
      active: 'bg-yellow-800/20 border-yellow-900/50 text-yellow-950 shadow-yellow-800/30 shadow-md',
    },
    caramel: {
      base: 'bg-amber-100/70 border-amber-300 text-amber-800 hover:bg-amber-200/70',
      active: 'bg-amber-400 border-amber-600 text-amber-950 shadow-amber-400/40 shadow-md',
    },
    woody: {
      base: 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200',
      active: 'bg-stone-300 border-stone-500 text-stone-900 shadow-stone-300/40 shadow-md',
    },
    earthy: {
      base: 'bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100',
      active: 'bg-lime-300 border-lime-500 text-lime-900 shadow-lime-300/40 shadow-md',
    },
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FLAVOR_TAGS.map((tag) => {
        const isActive = selected.includes(tag.id);
        const isAnimating = !!animatingTags[tag.id];
        const colors = tagColors[tag.id];
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            onKeyDown={(e) => handleKeyDown(e, tag.id)}
            tabIndex={0}
            className={`
              inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium
              cursor-pointer select-none
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber
              transition-all duration-150 ease-out
              ${isActive ? colors.active : colors.base}
            `}
            style={{
              transform: isAnimating ? 'scale(1.25)' : isActive ? 'scale(1.05)' : 'scale(1)',
              transition: isAnimating
                ? 'transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 150ms ease'
                : 'transform 180ms ease, box-shadow 150ms ease',
            }}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
