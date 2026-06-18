import React, { useRef, useEffect, useState } from 'react';
import { useLandmarkStore } from '../store/landmarkStore';
import { SearchIcon, CloseIcon } from './Icons';

const SearchPanel: React.FC = () => {
  const { searchQuery, setSearchQuery, filteredLandmarks, setSelectedLandmark } = useLandmarkStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleSelectLandmark = (landmarkId: string) => {
    setSelectedLandmark(landmarkId);
    setIsDropdownOpen(false);
  };

  const showDropdown = isDropdownOpen && searchQuery.trim();

  return (
    <div className="search-panel" ref={panelRef}>
      <div className="search-input-wrapper">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="搜索地标名称或关键词..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {searchQuery && (
          <button className="search-clear" onClick={handleClear} title="清除">
            <CloseIcon style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="search-dropdown">
          {filteredLandmarks.length > 0 ? (
            filteredLandmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="search-item"
                onClick={() => handleSelectLandmark(landmark.id)}
              >
                <div
                  className="search-item-thumb"
                  style={{ backgroundImage: `url(${landmark.imageUrl})` }}
                />
                <div className="search-item-info">
                  <div className="search-item-name">{landmark.name}</div>
                  <div className="search-item-desc">{landmark.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="search-no-results">未找到相关地标</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
