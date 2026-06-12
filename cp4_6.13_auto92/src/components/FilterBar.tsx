import React from 'react';
import { CategoryType, DifficultyType, PriceRange } from '@/types';

interface FilterBarProps {
  category: CategoryType | '';
  setCategory: (c: CategoryType | '') => void;
  difficulty: DifficultyType | '';
  setDifficulty: (d: DifficultyType | '') => void;
  priceRange: PriceRange;
  setPriceRange: (p: PriceRange) => void;
}

const categories: CategoryType[] = ['编织', '陶艺', '木工', '扎染'];
const difficulties: DifficultyType[] = ['初级', '中级', '高级'];
const priceRanges: { label: string; value: PriceRange }[] = [
  { label: '0-50', value: '0-50' },
  { label: '50-100', value: '50-100' },
  { label: '100-200', value: '100-200' },
  { label: '200+', value: '200+' },
];

const categoryColors: Record<CategoryType, string> = {
  '编织': '#9B59B6',
  '陶艺': '#1ABC9C',
  '木工': '#8B5E3C',
  '扎染': '#E91E63',
};

const difficultyColors: Record<DifficultyType, string> = {
  '初级': '#27AE60',
  '中级': '#F39C12',
  '高级': '#E74C3C',
};

const FilterBar: React.FC<FilterBarProps> = ({
  category,
  setCategory,
  difficulty,
  setDifficulty,
  priceRange,
  setPriceRange,
}) => {
  return (
    <div style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '12px',
      border: '2px solid #E8DCC8',
      marginBottom: '24px',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#8B5E3C', fontWeight: '600', marginBottom: '10px' }}>课程类型</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategory('')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              transition: 'all 0.2s ease-out',
              background: !category ? '#E67E22' : '#F0EDE8',
              color: !category ? '#fff' : '#666',
              border: 'none',
            }}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                transition: 'all 0.2s ease-out',
                background: category === cat ? categoryColors[cat] : '#F0EDE8',
                color: category === cat ? '#fff' : '#666',
                border: 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#8B5E3C', fontWeight: '600', marginBottom: '10px' }}>难度等级</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDifficulty('')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              transition: 'all 0.2s ease-out',
              background: !difficulty ? '#E67E22' : '#F0EDE8',
              color: !difficulty ? '#fff' : '#666',
              border: 'none',
            }}
          >
            全部
          </button>
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(difficulty === diff ? '' : diff)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                transition: 'all 0.2s ease-out',
                background: difficulty === diff ? difficultyColors[diff] : '#F0EDE8',
                color: difficulty === diff ? '#fff' : '#666',
                border: 'none',
              }}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', color: '#8B5E3C', fontWeight: '600', marginBottom: '10px' }}>价格区间</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPriceRange('')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              transition: 'all 0.2s ease-out',
              background: !priceRange ? '#E67E22' : '#F0EDE8',
              color: !priceRange ? '#fff' : '#666',
              border: 'none',
            }}
          >
            全部
          </button>
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setPriceRange(priceRange === range.value ? '' : range.value)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                transition: 'all 0.2s ease-out',
                background: priceRange === range.value ? '#E67E22' : '#F0EDE8',
                color: priceRange === range.value ? '#fff' : '#666',
                border: 'none',
              }}
            >
              ¥{range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
