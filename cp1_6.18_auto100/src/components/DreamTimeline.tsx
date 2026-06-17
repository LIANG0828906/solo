import { useRef, useEffect, useMemo } from 'react';
import { useDreamStore, type Dream, type SortType } from '../stores/dreamStore';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function getSummary(content: string): string {
  return content.length > 30 ? content.substring(0, 30) + '...' : content;
}

function filterAndSortDreams(
  dreams: Dream[],
  activeTags: string[],
  sortType: SortType
): Dream[] {
  let result = [...dreams];

  if (activeTags.length > 0) {
    result = result.filter(dream =>
      dream.tags.some(tag => activeTags.includes(tag.id))
    );
  }

  switch (sortType) {
    case 'date-desc':
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date-asc':
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'emotion-desc':
      result.sort((a, b) => b.emotionRating - a.emotionRating);
      break;
    case 'emotion-asc':
      result.sort((a, b) => a.emotionRating - b.emotionRating);
      break;
  }

  return result;
}

interface DreamCardProps {
  dream: Dream;
  isExpanded: boolean;
  onToggleExpand: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}

function DreamCard({ dream, isExpanded, onToggleExpand, cardRef }: DreamCardProps) {
  const openEditor = useDreamStore(state => state.openEditor);
  const deleteDream = useDreamStore(state => state.deleteDream);
  const setSelectedDream = useDreamStore(state => state.setSelectedDream);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditor(dream);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个梦境记录吗？')) {
      deleteDream(dream.id);
    }
  };

  const handleClick = () => {
    onToggleExpand();
    setSelectedDream(isExpanded ? null : dream.id);
  };

  return (
    <div
      ref={cardRef}
      className={`dream-card ${isExpanded ? 'expanded' : ''}`}
      onClick={handleClick}
      data-dream-id={dream.id}
    >
      <div className="dream-card-header">
        <div className="dream-title">{dream.title}</div>
        <div className="dream-date">{formatDate(dream.date)}</div>
      </div>

      <div className="dream-rating">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`star ${i < dream.emotionRating ? 'filled' : ''}`}>
            {i < dream.emotionRating ? '★' : '☆'}
          </span>
        ))}
      </div>

      <div className="dream-summary">{getSummary(dream.content)}</div>

      {isExpanded && (
        <div className="dream-details">
          <div className="dream-content">{dream.content}</div>
          {dream.tags.length > 0 && (
            <div className="dream-tags">
              {dream.tags.map(tag => (
                <span
                  key={tag.id}
                  className="tag-pill"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="dream-actions">
            <button className="btn-secondary" onClick={handleEdit}>
              编辑
            </button>
            <button className="btn-secondary btn-danger" onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedDreamCard = DreamCard;

export default function DreamTimeline() {
  const dreams = useDreamStore(state => state.dreams);
  const activeTags = useDreamStore(state => state.activeTags);
  const sortType = useDreamStore(state => state.sortType);
  const setSortType = useDreamStore(state => state.setSortType);
  const expandedDreamId = useDreamStore(state => state.expandedDreamId);
  const setExpandedDream = useDreamStore(state => state.setExpandedDream);
  const selectedDreamId = useDreamStore(state => state.selectedDreamId);

  const filteredAndSortedDreams = useMemo(() => {
    return filterAndSortDreams(dreams, activeTags, sortType);
  }, [dreams, activeTags, sortType]);

  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (selectedDreamId && listRef.current) {
      const cardElement = cardRefs.current.get(selectedDreamId);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedDreamId]);

  const handleToggleExpand = (dreamId: string) => {
    setExpandedDream(expandedDreamId === dreamId ? null : dreamId);
  };

  const setCardRef = (dreamId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(dreamId, el);
    } else {
      cardRefs.current.delete(dreamId);
    }
  };

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'date-desc', label: '日期（新→旧）' },
    { value: 'date-asc', label: '日期（旧→新）' },
    { value: 'emotion-desc', label: '情绪（强→弱）' },
    { value: 'emotion-asc', label: '情绪（弱→强）' },
  ];

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <select
          className="sort-select"
          value={sortType}
          onChange={(e) => setSortType(e.target.value as SortType)}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="timeline-list" ref={listRef}>
        {filteredAndSortedDreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌙</div>
            <div className="empty-state-text">
              还没有记录任何梦境<br />
              点击上方"记录新梦"开始记录你的第一个梦境吧
            </div>
          </div>
        ) : (
          filteredAndSortedDreams.map(dream => (
            <MemoizedDreamCard
              key={dream.id}
              dream={dream}
              isExpanded={expandedDreamId === dream.id}
              onToggleExpand={() => handleToggleExpand(dream.id)}
              cardRef={setCardRef(dream.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
