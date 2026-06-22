import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { Cuisine, Difficulty } from '../types';

interface SearchBarProps {
  onSearch: (
    keyword: string,
    cuisine: Cuisine | 'all',
    difficulty: Difficulty | 'all'
  ) => void;
  initialKeyword?: string;
  initialCuisine?: Cuisine | 'all';
  initialDifficulty?: Difficulty | 'all';
  keyword?: string;
  cuisine?: Cuisine | 'all';
  difficulty?: Difficulty | 'all';
}

type CuisineFilter = Cuisine | 'all';
type DifficultyFilter = Difficulty | 'all';

const cuisineOptions: { value: CuisineFilter; label: string }[] = [
  { value: 'all', label: '全部菜系' },
  { value: 'chinese', label: '中餐' },
  { value: 'western', label: '西餐' },
  { value: 'japanese', label: '日料' },
  { value: 'korean', label: '韩餐' },
  { value: 'italian', label: '意餐' },
  { value: 'french', label: '法餐' },
  { value: 'other', label: '其他' },
];

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: '全部难度' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

export default function SearchBar({
  onSearch,
  initialKeyword = '',
  initialCuisine = 'all',
  initialDifficulty = 'all',
  keyword: keywordProp,
  cuisine: cuisineProp,
  difficulty: difficultyProp,
}: SearchBarProps) {
  const isControlled =
    keywordProp !== undefined ||
    cuisineProp !== undefined ||
    difficultyProp !== undefined;

  const [keyword, setKeyword] = useState(
    keywordProp !== undefined ? keywordProp : initialKeyword
  );
  const [cuisine, setCuisine] = useState<CuisineFilter>(
    cuisineProp !== undefined ? cuisineProp : initialCuisine
  );
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(
    difficultyProp !== undefined ? difficultyProp : initialDifficulty
  );

  useEffect(() => {
    if (keywordProp !== undefined) setKeyword(keywordProp);
    if (cuisineProp !== undefined) setCuisine(cuisineProp);
    if (difficultyProp !== undefined) setDifficulty(difficultyProp);
  }, [keywordProp, cuisineProp, difficultyProp]);

  const debouncedKeyword = useDebounce(keyword, 300);

  useEffect(() => {
    onSearch(debouncedKeyword, cuisine, difficulty);
  }, [debouncedKeyword, cuisine, difficulty, onSearch]);

  const actualKeyword = isControlled && keywordProp !== undefined ? keywordProp : keyword;
  const actualCuisine = isControlled && cuisineProp !== undefined ? cuisineProp : cuisine;
  const actualDifficulty = isControlled && difficultyProp !== undefined ? difficultyProp : difficulty;

  const handleKeywordChange = (val: string) => {
    if (!isControlled || keywordProp === undefined) setKeyword(val);
  };
  const handleCuisineChange = (val: CuisineFilter) => {
    if (!isControlled || cuisineProp === undefined) setCuisine(val);
  };
  const handleDifficultyChange = (val: DifficultyFilter) => {
    if (!isControlled || difficultyProp === undefined) setDifficulty(val);
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-input-wrapper">
        <svg
          className="search-bar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-bar-input"
          placeholder="搜索食谱名称或食材..."
          value={actualKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
        />
      </div>
      <select
        className="search-bar-select"
        value={actualCuisine}
        onChange={(e) => handleCuisineChange(e.target.value as CuisineFilter)}
      >
        {cuisineOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="search-bar-select"
        value={actualDifficulty}
        onChange={(e) => handleDifficultyChange(e.target.value as DifficultyFilter)}
      >
        {difficultyOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
