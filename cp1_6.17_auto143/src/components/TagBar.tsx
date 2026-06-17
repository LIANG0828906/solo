import { useColorCardStore } from '../store/ColorCardStore';
import { getAllTags } from '../utils/ColorAnalyzer';
import './TagBar.css';

export function TagBar() {
  const cards = useColorCardStore((state) => state.cards);
  const selectedTags = useColorCardStore((state) => state.selectedTags);
  const toggleTag = useColorCardStore((state) => state.toggleTag);

  const allTags = getAllTags(cards);

  return (
    <div className="tag-bar">
      <div className="tag-bar__tags">
        <button
          className={`tag-bar__tag ${selectedTags.length === 0 ? 'tag-bar__tag--active' : ''}`}
          onClick={() => {
            if (selectedTags.length > 0) {
              selectedTags.forEach((t) => toggleTag(t));
            }
          }}
        >
          全部
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`tag-bar__tag ${selectedTags.includes(tag) ? 'tag-bar__tag--active' : ''}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
