import React, { useState, useEffect, useCallback } from 'react';
import { CourseContent } from './CourseContent';
import { Course, CourseUnit, QuizQuestion } from '../../types';
import { useProgress } from '../../hooks/useProgress';
import { useAppStore } from '../../store/useAppStore';
import coursesData from '../../data/courses.json';
import quizzesData from '../../data/quizzes.json';
import { selectQuestions } from '../quiz/QuizEngine';

interface CourseModuleProps {
  courseId: string;
}

export const CourseModule: React.FC<CourseModuleProps> = ({ courseId }) => {
  const {
    getUnitProgressSync,
    getCourseProgressSync,
    updateProgress,
    getLatestQuizAttemptSync,
    hasNoteSync,
  } = useProgress();
  const {
    setView,
    setSelectedUnit,
    selectedUnitId,
    setQuizQuestions,
    setIsReviewMode,
    resetQuizState,
  } = useAppStore();

  const course = coursesData.find((c) => c.id === courseId) as Course;
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (!course) return;

    const courseProgress = getCourseProgressSync(courseId);
    let firstIncompleteUnit: CourseUnit | undefined;

    for (const unit of course.units) {
      const unitProgress = courseProgress?.units.find(
        (u) => u.unitId === unit.id
      );
      if (!unitProgress?.completed) {
        firstIncompleteUnit = unit;
        break;
      }
    }

    const initialUnitId =
      selectedUnitId ||
      firstIncompleteUnit?.id ||
      course.units[0]?.id ||
      null;

    setActiveUnitId(initialUnitId);
    setSelectedUnit(initialUnitId);
  }, [courseId, course, selectedUnitId, setSelectedUnit, getCourseProgressSync]);

  const getUnitCompleted = useCallback(
    (unitId: string): boolean => {
      const unitProgress = getUnitProgressSync(courseId, unitId);
      return unitProgress?.completed || false;
    },
    [courseId, getUnitProgressSync]
  );

  const getCourseProgress = useCallback((): number => {
    if (!course) return 0;
    const totalUnits = course.units.length;
    if (totalUnits === 0) return 0;

    let completedUnits = 0;
    course.units.forEach((unit) => {
      if (getUnitCompleted(unit.id)) {
        completedUnits++;
      }
    });

    return Math.round((completedUnits / totalUnits) * 100);
  }, [course, getUnitCompleted]);

  const handleUnitClick = (unitId: string) => {
    setActiveUnitId(unitId);
    setSelectedUnit(unitId);
  };

  const handleMarkComplete = async () => {
    if (!activeUnitId) return;

    await updateProgress(courseId, activeUnitId, true);

    const currentIndex = course.units.findIndex((u) => u.id === activeUnitId);
    for (let i = currentIndex + 1; i < course.units.length; i++) {
      if (!getUnitCompleted(course.units[i].id)) {
        setActiveUnitId(course.units[i].id);
        setSelectedUnit(course.units[i].id);
        return;
      }
    }
  };

  const handleStartQuiz = () => {
    const quiz = quizzesData.find((q) => q.id === course.quizId);
    if (!quiz) return;

    resetQuizState();
    const selectedQuestions = selectQuestions(quiz.questions as QuizQuestion[], 10);
    setQuizQuestions(selectedQuestions);
    setIsReviewMode(false);
    setView('quiz');
  };

  const handleBackToList = () => {
    setView('courseList');
    setSelectedUnit(null);
  };

  if (!course) {
    return <div className="error-message">课程未找到</div>;
  }

  const activeUnit = course.units.find((u) => u.id === activeUnitId);
  const progress = getCourseProgress();
  const latestQuizAttempt = getLatestQuizAttemptSync(courseId);

  return (
    <div className="course-module">
      <header className="course-header">
        <button className="btn-back" onClick={handleBackToList}>
          ← 返回课程列表
        </button>
        <div className="course-info">
          <h1 className="course-title">{course.title}</h1>
          <div className="course-progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}% 完成</span>
          </div>
        </div>
      </header>

      <div className="course-body">
        <aside className="unit-sidebar">
          <h3 className="sidebar-title">课程单元</h3>
          <nav className="unit-nav">
            {course.units.map((unit) => {
              const isCompleted = getUnitCompleted(unit.id);
              const isActive = unit.id === activeUnitId;

              return (
                <button
                  key={unit.id}
                  className={`unit-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleUnitClick(unit.id)}
                >
                  <span
                    className={`status-indicator ${isCompleted ? 'done' : 'pending'}`}
                  />
                  <span className="unit-icon">
                    {isCompleted ? '✓' : '🔒'}
                  </span>
                  <span className="unit-title-text">{unit.title}</span>
                  {hasNoteSync(courseId, unit.id) && (
                    <span className="unit-note-indicator" title="有笔记">📝</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="course-main">
          {activeUnit && (
            <CourseContent
              courseId={courseId}
              unit={activeUnit}
              isCompleted={getUnitCompleted(activeUnit.id)}
              onMarkComplete={handleMarkComplete}
            />
          )}

          <div className="quiz-section">
            {latestQuizAttempt && (
              <div className="quiz-history">
                <p>
                  上次测验得分：{latestQuizAttempt.score}/
                  {latestQuizAttempt.totalQuestions}
                </p>
                <p>用时：{Math.round(latestQuizAttempt.timeSpent / 1000)} 秒</p>
              </div>
            )}
            <button className="btn-start-quiz" onClick={handleStartQuiz}>
              开始测验
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
