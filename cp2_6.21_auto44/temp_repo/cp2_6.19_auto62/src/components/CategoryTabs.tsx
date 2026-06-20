import { useTokenStore } from '../store/tokenStore';
import type { FilterCategory } from '../types/token';
import './CategoryTabs.css';

const tabs: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'color', label: 'Colors' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'typography', label: 'Typography' },
];

export function CategoryTabs() {
  const activeCategory = useTokenStore((state) => state.activeCategory);
  const setActiveCategory = useTokenStore((state) => state.setActiveCategory);

  return (
    <div className="category-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-item ${activeCategory === tab.key ? 'active' : ''}`}
          onClick={() => setActiveCategory(tab.key)}
        >
          {tab.label}
          <span className="tab-underline" />
        </button>
      ))}
    </div>
  );
}
