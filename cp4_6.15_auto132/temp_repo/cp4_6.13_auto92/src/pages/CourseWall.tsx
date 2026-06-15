import React, { useState, useEffect } from 'react';
import CourseCard from '@/components/CourseCard';
import FilterBar from '@/components/FilterBar';
import { Course, CategoryType, DifficultyType, PriceRange } from '@/types';
import { useApi } from '@/hooks/useApi';

const CourseWall: React.FC = () => {
  const { request } = useApi();
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<CategoryType | ''>('');
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('');
  const [priceRange, setPriceRange] = useState<PriceRange>('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      if (priceRange) {
        if (priceRange === '200+') {
          params.append('minPrice', '200');
        } else {
          const [min, max] = priceRange.split('-');
          params.append('minPrice', min);
          params.append('maxPrice', max);
        }
      }
      params.append('page', String(page));
      params.append('limit', '12');

      const data = await request<{ courses: Course[]; total: number }>(
        `/api/courses?${params.toString()}`,
        { requireAuth: false }
      );
      setCourses(data.courses);
      setTotal(data.total);
    } catch (err) {
      console.error('加载课程失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [category, difficulty, priceRange]);

  useEffect(() => {
    loadCourses();
  }, [page, category, difficulty, priceRange]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#E67E22',
          marginBottom: '12px',
        }}>
          发现精彩手工坊课程
        </h1>
        <p style={{ fontSize: '16px', color: '#8B5E3C' }}>
          与手工艺人一起，探索手作的温度与美好
        </p>
      </div>

      <FilterBar
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', fontSize: '18px', color: '#8B5E3C' }}>
          加载中...
        </div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '12px', border: '2px solid #E8DCC8' }}>
          <p style={{ fontSize: '18px', color: '#8B5E3C', marginBottom: '12px' }}>暂无符合条件的课程</p>
          <p style={{ fontSize: '14px', color: '#999' }}>试试调整筛选条件或稍后再来查看</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '32px',
          }}
          className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: page === 1 ? '#F0EDE8' : '#fff',
                  color: page === 1 ? '#999' : '#333',
                  border: '2px solid #E8DCC8',
                  fontSize: '14px',
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '16px', color: '#333', padding: '0 12px' }}>
                第 {page} / {totalPages} 页，共 {total} 个课程
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: page === totalPages ? '#F0EDE8' : '#fff',
                  color: page === totalPages ? '#999' : '#333',
                  border: '2px solid #E8DCC8',
                  fontSize: '14px',
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) {
          .course-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 767px) {
          .course-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseWall;
