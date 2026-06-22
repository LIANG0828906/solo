import React, { memo } from 'react';
import CourseCard from './CourseCard';
import type { Course, UserReview } from '../types';

interface CompareDashboardProps {
  courses: Course[];
  onRemove: (courseId: string) => void;
  onReviewSubmitted: (courseId: string, review: UserReview) => void;
}

const CompareDashboard: React.FC<CompareDashboardProps> = memo(
  ({ courses, onRemove, onReviewSubmitted }) => {
    return (
      <div>
        <div className="dashboard-header">
          <h2 className="dashboard-title">课程对比仪表盘</h2>
          <span className="dashboard-count">
            已添加 {courses.length}/6 个课程
          </span>
        </div>

        <div className="compare-dashboard">
          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <p className="empty-state-text">
                搜索并添加课程，开始对比分析
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onRemove={onRemove}
                onReviewSubmitted={onReviewSubmitted}
              />
            ))
          )}
        </div>
      </div>
    );
  }
);

CompareDashboard.displayName = 'CompareDashboard';

export default CompareDashboard;
