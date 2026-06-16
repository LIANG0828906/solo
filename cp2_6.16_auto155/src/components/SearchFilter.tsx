import { CATEGORIES } from '@/types';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 24,
  flexWrap: 'wrap'
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: '10px 16px',
  fontSize: 14
};

const selectStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 14,
  minWidth: 140
};

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}: Props) {
  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder="🔍 搜索食谱名称或分类..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        style={searchInputStyle}
      />
      <select
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">全部分类</option>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}
