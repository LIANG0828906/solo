import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string, days: number) => void;
  loading: boolean;
}

const CITIES = ['成都', '杭州', '西安', '北京', '上海', '广州', '南京', '武汉', '重庆', '厦门'];
const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [city, setCity] = useState('成都');
  const [days, setDays] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city && days && !loading) {
      onSearch(city, days);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-group">
        <label className="search-label">目的地城市</label>
        <select
          className="search-select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={loading}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="search-group">
        <label className="search-label">旅行天数</label>
        <select
          className="search-select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          disabled={loading}
        >
          {DAYS_OPTIONS.map((d) => (
            <option key={d} value={d}>{d} 天</option>
          ))}
        </select>
      </div>
      <button type="submit" className="search-button" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" />
            <span>生成中...</span>
          </>
        ) : (
          <span>搜索路线</span>
        )}
      </button>
    </form>
  );
};
