import { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import CompareDashboard from './components/CompareDashboard';
import type { Course, UserReview } from './types';
import './App.css';

const MAX_COMPARE = 6;

function App() {
  const [compareCourses, setCompareCourses] = useState<Course[]>([]);

  const handleAddCourse = useCallback(
    (course: Course) => {
      setCompareCourses((prev) => {
        const exists = prev.find((c) => c.id === course.id);
        if (exists) return prev;
        if (prev.length >= MAX_COMPARE) return prev;
        return [...prev, course];
      });
    },
    []
  );

  const handleRemoveCourse = useCallback((courseId: string) => {
    setCompareCourses((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

  const handleReviewSubmitted = useCallback(
    (courseId: string, review: UserReview) => {
      setCompareCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, userReview: review }
            : course
        )
      );
    },
    []
  );

  return (
    <div className="app">
      <nav className="navbar">
        <h1>
          <span>📊</span>
          在线课程对比平台
        </h1>
      </nav>

      <main className="main-content">
        <SearchBar
          onAddCourse={handleAddCourse}
          compareCount={compareCourses.length}
          maxCompare={MAX_COMPARE}
          addedCourseIds={compareCourses.map((c) => c.id)}
        />

        <CompareDashboard
          courses={compareCourses}
          onRemove={handleRemoveCourse}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </main>
    </div>
  );
}

export default App;
