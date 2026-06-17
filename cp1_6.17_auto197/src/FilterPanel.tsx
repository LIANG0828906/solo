import { useTimelineStore } from './store';
import { CardType, SortType, TYPE_LABELS, TYPE_COLORS } from './types';

const ALL_TYPES: CardType[] = ['article', 'painting', 'music', 'video'];
const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'newest', label: '最新优先' },
  { value: 'oldest', label: '最早优先' },
  { value: 'title', label: '标题排序' },
];

function FilterPanel() {
  const filteredTypes = useTimelineStore((state) => state.filteredTypes);
  const sortType = useTimelineStore((state) => state.sortType);
  const setFilteredTypes = useTimelineStore((state) => state.setFilteredTypes);
  const setSortType = useTimelineStore((state) => state.setSortType);

  const handleTypeToggle = (type: CardType) => {
    if (filteredTypes.includes(type)) {
      setFilteredTypes(filteredTypes.filter((t) => t !== type));
    } else {
      setFilteredTypes([...filteredTypes, type]);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '280px',
        background: 'rgba(36, 0, 70, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(224, 170, 255, 0.1)',
        zIndex: 100,
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#E0AAFF',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '4px',
            height: '18px',
            background: 'linear-gradient(180deg, #E0AAFF, #C77DFF)',
            borderRadius: '2px',
          }}
        />
        筛选与排序
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#C77DFF',
            marginBottom: '12px',
            fontWeight: 500,
          }}
        >
          类型筛选
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ALL_TYPES.map((type) => {
            const isChecked = filteredTypes.length === 0 || filteredTypes.includes(type);
            return (
              <label
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(224, 170, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  onClick={() => handleTypeToggle(type)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: `2px solid ${TYPE_COLORS[type]}`,
                    background: isChecked ? TYPE_COLORS[type] : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {isChecked && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{ display: 'block' }}
                    >
                      <path
                        d="M2.5 6.5L5 9L9.5 3.5"
                        stroke={type === 'painting' ? '#240046' : '#FFFFFF'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => handleTypeToggle(type)}
                  style={{
                    fontSize: '14px',
                    color: isChecked ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                    transition: 'color 0.2s ease',
                    flex: 1,
                  }}
                >
                  {TYPE_LABELS[type]}
                </span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: TYPE_COLORS[type],
                    flexShrink: 0,
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#C77DFF',
            marginBottom: '12px',
            fontWeight: 500,
          }}
        >
          排序方式
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              background: '#3C096C',
              color: '#FFFFFF',
              border: '1px solid rgba(224, 170, 255, 0.2)',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: '#240046' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="#E0AAFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
