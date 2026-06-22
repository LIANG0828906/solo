import React, { useEffect, useState } from 'react';
import { getFieldUniqueValues } from '../api';

interface SearchBarProps {
  keyword: string;
  filterField: string;
  filterValue: string;
  resultCount: number;
  onKeywordChange: (value: string) => void;
  onFilterFieldChange: (value: string) => void;
  onFilterValueChange: (value: string) => void;
}

const FIELD_OPTIONS = [
  { value: '', label: '不筛选' },
  { value: 'scene', label: '场景名' },
  { value: 'actor', label: '演员' },
  { value: 'lighting', label: '灯光' }
];

const SearchBar: React.FC<SearchBarProps> = ({
  keyword,
  filterField,
  filterValue,
  resultCount,
  onKeywordChange,
  onFilterFieldChange,
  onFilterValueChange
}) => {
  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [fieldValues, setFieldValues] = useState<string[]>([]);

  useEffect(() => {
    setLocalKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    debounceTimer = setTimeout(() => {
      onKeywordChange(localKeyword);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [localKeyword, onKeywordChange]);

  useEffect(() => {
    if (filterField) {
      getFieldUniqueValues(filterField)
        .then(values => setFieldValues(values))
        .catch(err => console.error('获取字段值失败:', err));
    } else {
      setFieldValues([]);
    }
  }, [filterField]);

  return (
    <div className="search-section">
      <div className="search-bar">
        <input
          type="text"
          value={localKeyword}
          onChange={e => setLocalKeyword(e.target.value)}
          placeholder="搜索标题、场景或演员..."
          style={{ flex: 1 }}
        />
        <span className="search-result-count">共 {resultCount} 条</span>
      </div>
      <div className="filter-bar">
        <select
          value={filterField}
          onChange={e => {
            onFilterFieldChange(e.target.value);
            onFilterValueChange('');
          }}
        >
          {FIELD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {filterField && (
          <select
            value={filterValue}
            onChange={e => onFilterValueChange(e.target.value)}
          >
            <option value="">全部</option>
            {fieldValues.map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
