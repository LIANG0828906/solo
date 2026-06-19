import type { PreferenceTag } from '@/types';
import { PREFERENCE_LABEL } from '@/types';

interface Props {
  selected: string[];
  onChange: (tag: string) => void;
}

const TAGS: PreferenceTag[] = [
  'quick',
  'low-calorie',
  'spicy',
  'homestyle',
  'healthy',
  'vegetarian',
  'seafood',
  'meat',
  'vegetable',
];

export default function PreferenceSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onChange(tag)}
            className={`ripple rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              isSelected
                ? 'bg-[var(--primary)] text-white shadow-sm shadow-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {PREFERENCE_LABEL[tag]}
          </button>
        );
      })}
    </div>
  );
}
