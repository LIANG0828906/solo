import React, { useMemo } from 'react';
import { CourseModule } from './modules/course/CourseModule';
import { QuizModule } from './modules/quiz/QuizModule';
import { useProgress } from './hooks/useProgress';
import { useAppStore } from './store/useAppStore';
import coursesData from './data/courses.json';
import './styles/App.css';

const App: React.FC = () => {
  const {
    currentView,
    selectedCourseId,
    quizQuestions,
    isReviewMode,
    setView,
    setSelectedCourse,
    setSelectedUnit,
  } = useAppStore();

  const {
    loading,
    getCourseProgressSync,
    getCompletedCoursesCount,
    getPassedQuizzesCount,
    getOverallCompletionRate,
    getLastStudyTime,
  } = useProgress();

  const totalUnits = useMemo(() => {
    return coursesData.reduce((acc, course) => acc + course.units.length, 0);
  }, []);

  const stats = useMemo(() => {
    return {
      completedCourses: getCompletedCoursesCount(),
      passedQuizzes: getPassedQuizzesCount(),
      overallCompletion: getOverallCompletionRate(totalUnits),
      lastStudyTime: getLastStudyTime(),
    };
  }, [
    getCompletedCoursesCount,
    getPassedQuizzesCount,
    getOverallCompletionRate,
    getLastStudyTime,
    totalUnits,
  ]);

  const handleCourseClick = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedUnit(null);
    setView('courseDetail');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '暂无学习记录';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCourseProgress = (courseId: string): number => {
    const courseProgress = getCourseProgressSync(courseId);
    const course = coursesData.find((c) => c.id === courseId);
    if (!course || course.units.length === 0) return 0;

    const completedUnits = courseProgress?.units.filter(
      (u) => u.completed
    ).length;
    return Math.round(((completedUnits || 0) / course.units.length) * 100);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  const renderCourseList = () => (
    <div className="course-list-view">
      <header className="app-header">
        <h1 className="app-title">企业培训管理系统</h1>
        <p className="app-subtitle">随时随地，轻松学习</p>
      </header>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedCourses}</div>
              <div className="stat-label">已学课程</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.passedQuizzes}</div>
              <div className="stat-label">已通过测验</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overallCompletion}%</div>
              <div className="stat-label">整体完成率</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-content">
              <div className="stat-value last-time">
                {formatDate(stats.lastStudyTime)}
              </div>
              <div className="stat-label">最近学习时间</div>
            </div>
          </div>
        </div>
      </section>

      <section className="courses-section">
        <h2 className="section-title">全部课程</h2>
        <div className="course-grid">
          {coursesData.map((course) => {
            const progress = getCourseProgress(course.id);
            return (
              <div
                key={course.id}
                className="course-card"
                onClick={() => handleCourseClick(course.id)}
              >
                <div className="course-cover">
                  <img src={course.cover} alt={course.title} />
                  <div className="progress-overlay">
                    <div className="progress-bar-small">
                      <div
                        className="progress-fill-small"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text-small">
                      {progress}% 完成
                    </span>
                  </div>
                </div>
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  <p className="course-card-desc">{course.description}</p>
                  <div className="course-card-meta">
                    <span className="unit-count">
                      {course.units.length} 个单元
                    </span>
                    <span className="card-arrow">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'courseList':
        return renderCourseList();
      case 'courseDetail':
        return selectedCourseId ? (
          <CourseModule courseId={selectedCourseId} />
        ) : (
          renderCourseList()
        );
      case 'quiz':
        return selectedCourseId ? (
          <QuizModule
            courseId={selectedCourseId}
            questions={quizQuestions}
            isReviewMode={isReviewMode}
          />
        ) : (
          renderCourseList()
        );
      default:
        return renderCourseList();
    }
  };

  return <div className="app-container">{renderContent()}</div>;
};

export default App;
