import React, { useState, useCallback, memo } from 'react';
import RadarChart from './RadarChart';
import RatingSlider from './RatingSlider';
import ReviewInput from './ReviewInput';
import ReputationModal from './ReputationModal';
import { submitReview } from '../utils/api';
import type { Course, UserReview } from '../types';

interface CourseCardProps {
  course: Course;
  onRemove: (courseId: string) => void;
  onReviewSubmitted: (courseId: string, review: UserReview) => void;
}

const CourseCard: React.FC<CourseCardProps> = memo(({ course, onRemove, onReviewSubmitted }) => {
  const [sliderValue, setSliderValue] = useState(course.userReview?.rating || 5);
  const [reviewText, setReviewText] = useState(course.userReview?.comment || '');
  const [showReputation, setShowReputation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReviewed = !!course.userReview;

  const handleSubmit = useCallback(async () => {
    if (hasReviewed || reviewText.trim().length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const review = await submitReview(course.id, {
        rating: sliderValue,
        comment: reviewText.trim(),
      });
      onReviewSubmitted(course.id, review);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [course.id, sliderValue, reviewText, hasReviewed, onReviewSubmitted]);

  const handleRemove = useCallback(() => {
    onRemove(course.id);
  }, [course.id, onRemove]);

  const handleShowReputation = useCallback(() => {
    setShowReputation(true);
  }, []);

  const handleCloseReputation = useCallback(() => {
    setShowReputation(false);
  }, []);

  const renderStars = () => {
    const rating = course.rating;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
        <span className="rating-value">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getInitial = (name: string) => {
    return name.charAt(0);
  };

  const canSubmit = !hasReviewed && reviewText.trim().length > 0 && !isSubmitting;

  return (
    <div className="course-card">
      {hasReviewed && <div className="reviewed-badge">✓ 已评价</div>}
      <button
        className="remove-btn"
        onClick={handleRemove}
        aria-label="移除课程"
        title="移除课程"
      >
        ×
      </button>

      <h3 className="course-name">{course.name}</h3>

      <div className="teacher-info">
        <div
          className="teacher-avatar"
          style={{ backgroundColor: course.teacher.avatar }}
        >
          {getInitial(course.teacher.name)}
        </div>
        <div className="teacher-details">
          <div className="teacher-name">{course.teacher.name}</div>
          <div className="teacher-bio">{course.teacher.bio}</div>
        </div>
      </div>

      <div className="course-price">{course.price.toLocaleString()}</div>

      {renderStars()}

      <RadarChart scores={course.radarScores} />

      <RatingSlider
        value={sliderValue}
        onChange={setSliderValue}
        disabled={hasReviewed}
      />

      <ReviewInput
        value={reviewText}
        onChange={setReviewText}
        disabled={hasReviewed}
        placeholder={hasReviewed ? '您已评价该课程' : '写下您的评价...'}
      />

      {error && <div className="error-message">{error}</div>}

      <div className="card-actions">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? '提交中...' : hasReviewed ? '已提交' : '提交评价'}
        </button>
        <button
          className="reputation-btn"
          onClick={handleShowReputation}
        >
          口碑
        </button>
      </div>

      {showReputation && (
        <ReputationModal
          courseId={course.id}
          courseName={course.name}
          onClose={handleCloseReputation}
        />
      )}
    </div>
  );
});

CourseCard.displayName = 'CourseCard';

export default CourseCard;
