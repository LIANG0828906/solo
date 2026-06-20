import { useAppStore } from '@/store/appStore';
import { getTagColor } from '@/shared/cardTypes';

export default function TagFilter() {
  const cards = useAppStore(s => s.cards);
  const selectedTags = useAppStore(s => s.selectedTags);
  const toggleTag = useAppStore(s => s.toggleTag);

  const allTags = Array.from(new Set(cards.flatMap(c => c.tags)));

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map(tag => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 active:scale-95"
            style={{
              backgroundColor: isSelected ? '#FFD93D' : getTagColor(tag) + '33',
              color: isSelected ? '#1A1A2E' : getTagColor(tag),
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
