import { useEffect } from 'react';
import { TagFrequency, tagApi } from '../utils/api';

interface TagChartProps {
  bookId: string;
  tagFrequencies: TagFrequency[];
  setTagFrequencies: React.Dispatch<React.SetStateAction<TagFrequency[]>>;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

function TagChart({
  bookId,
  tagFrequencies,
  setTagFrequencies,
  selectedTag,
  onTagSelect,
}: TagChartProps) {
  useEffect(() => {
    loadTagFrequencies();
  }, [bookId]);

  async function loadTagFrequencies() {
    try {
      const response = await tagApi.getByBookId(bookId);
      if (response.success && response.data) {
        setTagFrequencies(response.data);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  const maxCount = tagFrequencies.length > 0
    ? Math.max(...tagFrequencies.map(t => t.count))
    : 1;

  const maxHeight = 60;

  function getBarColor(index: number, total: number) {
    const ratio = total > 1 ? index / (total - 1) : 0;
    const r = Math.round(59 + (139 - 59) * ratio);
    const g = Math.round(130 + (92 - 130) * ratio);
    const b = Math.round(246 + (246 - 246) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (tagFrequencies.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>标签图谱</h3>
        {selectedTag && (
          <button
            className="clear-btn"
            onClick={() => onTagSelect(null)}
            style={styles.clearButton}
          >
            清除筛选
          </button>
        )}
      </div>
      
      <div style={styles.chartContainer}>
        <div style={styles.barsContainer}>
          {tagFrequencies.map((tagFreq, index) => {
            const height = (tagFreq.count / maxCount) * maxHeight;
            return (
              <div
                key={tagFreq.tag}
                style={styles.barWrapper}
                onClick={() => onTagSelect(selectedTag === tagFreq.tag ? null : tagFreq.tag)}
              >
                <div
                  className="tag-bar"
                  style={{
                    ...styles.bar,
                    height: `${height}px`,
                    backgroundColor: getBarColor(index, tagFrequencies.length),
                    ...(selectedTag === tagFreq.tag ? styles.barSelected : {}),
                  }}
                  title={`${tagFreq.tag}: ${tagFreq.count}次`}
                />
                <span style={styles.tagLabel}>{tagFreq.tag}</span>
                <span style={styles.countLabel}>{tagFreq.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid #E2E8F0',
    padding: '16px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  title: {
    margin: '0 8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  clearButton: {
    fontSize: '11px',
    color: '#3B82F6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  },
  chartContainer: {
    padding: '8px',
    overflowX: 'auto',
  },
  barsContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    minHeight: '80px',
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  bar: {
    width: '20px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    opacity: 0.85,
  },
  barSelected: {
    opacity: 1,
    transform: 'scaleY(1.05)',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
  },
  tagLabel: {
    fontSize: '10px',
    color: '#475569',
    marginTop: '6px',
    maxWidth: '24px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  countLabel: {
    fontSize: '9px',
    color: '#94A3B8',
    marginTop: '1px',
  },
};

export default TagChart;
