import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCourses } from '../utils/api';
import type { Course } from '../types';

interface SearchBarProps {
  onAddCourse: (course: Course) => void;
  compareCount: number;
  maxCompare: number;
  addedCourseIds: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  onAddCourse,
  compareCount,
  maxCompare,
  addedCourseIds,
}) => {
  const [keyword, setKeyword] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (keyword.trim() === '') {
      setResults([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const courses = await searchCourses(keyword);
        setResults(courses);
      } catch (err) {
        console.error('搜索失败:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [keyword]);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    setShowResults(true);
    if (keyword.trim() !== '') {
      searchCourses(keyword).then(setResults).catch(console.error);
    }
  }, [keyword]);

  const handleAddCourse = useCallback(
    (course: Course) => {
      onAddCourse(course);
    },
    [onAddCourse]
  );

  const isMaxReached = compareCount >= maxCompare;

  const isCourseAdded = (courseId: string) => {
    return addedCourseIds.includes(courseId);
  };

  return (
    <div className="search-container">
      <div
        ref={searchRef}
        className={`search-wrapper ${isExpanded ? 'expanded' : ''}`}
      >
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={handleFocus}
          placeholder="搜索课程，如：少儿编程"
          className="search-input"
        />
        <span className="search-icon">🔍</span>

        {showResults && (keyword.trim() !== '' || results.length > 0) && (
          <div className="search-results">
            {isSearching && (
              <div className="loading">
                <span className="loading-spinner"></span>
                搜索中...
              </div>
            )}

            {!isSearching && results.length === 0 && (
              <div className="loading" style={{ color: '#95a5a6' }}>
                未找到相关课程
              </div>
            )}

            {!isSearching &&
              results.map((course) => (
                <div
                  key={course.id}
                  className="search-result-item"
                  onClick={() => {
                    if (!isMaxReached && !isCourseAdded(course.id)) {
                      handleAddCourse(course);
                    }
                  }}
                >
                  <div className="search-result-info">
                    <div className="search-result-name">{course.name}</div>
                    <div className="search-result-meta">
                      {course.category} · {course.teacher.name} · ¥
                      {course.price.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isMaxReached && !isCourseAdded(course.id)) {
                          handleAddCourse(course);
                        }
                      }}
                      disabled={isMaxReached || isCourseAdded(course.id)}
                    >
                      {isCourseAdded(course.id)
                        ? '已添加'
                        : isMaxReached
                        ? '已满'
                        : '+ 添加'}
                    </button>
                    {isMaxReached && (
                      <div className="max-reached-tooltip">
                        最多添加{maxCompare}个课程
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
