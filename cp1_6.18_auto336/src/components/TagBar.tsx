import { TAGS } from '@/types';

interface TagBarProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagBar({ selectedTag, onSelectTag }: TagBarProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid #EEE8DC',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        overflowX: 'auto',
        gap: 10,
        scrollbarWidth: 'none',
      }}
      className="tag-bar"
    >
      {TAGS.map((tag) => {
        const isActive = selectedTag === tag;
        return (
          <button
            key={tag}
            onClick={() => onSelectTag(isActive ? null : tag)}
            style={{
              flexShrink: 0,
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: '0.85rem',
              background: isActive ? '#A67C52' : '#E8E0D6',
              color: isActive ? '#FFFFFF' : '#5C4A39',
              transition: 'all 0.2s ease-out',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 500 : 400,
            }}
            className="tag-btn"
          >
            {tag}
          </button>
        );
      })}

      <style jsx>{`
        .tag-bar::-webkit-scrollbar {
          display: none;
        }
        .tag-btn:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
