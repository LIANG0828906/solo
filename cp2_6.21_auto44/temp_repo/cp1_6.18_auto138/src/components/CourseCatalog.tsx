import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { catalog } from '../data/courseData';
import type { CourseType } from '../data/courseData';
import CourseCard from './CourseCard';

const FILTER_OPTIONS: Array<'全部' | CourseType> = ['全部', '陶艺', '皮具', '木工'];

const CourseCatalog: React.FC = () => {
  const { filterType, setFilterType } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredCourses = filterType === '全部'
    ? catalog
    : catalog.filter((course) => course.type === filterType);

  const filterContainerStyle: React.CSSProperties = isMobile
    ? {
        overflowX: 'auto',
        display: 'flex',
        gap: 12,
        whiteSpace: 'nowrap',
        marginBottom: 24,
        paddingBottom: 8,
      }
    : {
        marginRight: 32,
        flexShrink: 0,
      };

  const buttonStyle = (option: '全部' | CourseType): React.CSSProperties => {
    const isActive = filterType === option;
    const baseStyle: React.CSSProperties = {
      width: 120,
      height: 40,
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
      transition: 'all 0.2s',
      display: isMobile ? 'inline-block' : 'block',
      marginBottom: isMobile ? 0 : 12,
      flexShrink: 0,
      background: isActive ? '#5B9279' : '#F0F0F0',
      color: isActive ? '#FFFFFF' : '#333333',
    };
    return baseStyle;
  };

  return (
    <div
      style={{
        paddingTop: 80,
        paddingBottom: 40,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
      }}
    >
      <div style={filterContainerStyle}>
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setFilterType(option)}
            style={buttonStyle(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default CourseCatalog;
