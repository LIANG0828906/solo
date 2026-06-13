import { useState, useEffect } from 'react';
import { learnerApi, courseApi, instructorApi } from '../api';
import { LearnerProgress, Course, Instructor } from '../types';
import CircularProgress from './CircularProgress';
import Modal from './Modal';

interface LearningProgressProps {
  learnerId: string;
}

const statusMap = {
  enrolled: { label: '已报名', className: 'enrolled' },
  in_progress: { label: '学习中', className: 'in_progress' },
  completed: { label: '已完成', className: 'completed' },
  assessed: { label: '已考核', className: 'assessed' },
};

function LearningProgress({ learnerId }: LearningProgressProps) {
  const [progressList, setProgressList] = useState<LearnerProgress[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'progress' | 'enroll'>('progress');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [assessmentCourse, setAssessmentCourse] = useState<Course | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
  } | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [learnerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progress, courses, insts] = await Promise.all([
        learnerApi.getLearnerProgress(learnerId),
        courseApi.getCourses(),
        instructorApi.getInstructors(),
      ]);
      setProgressList(progress);
      setAllCourses(courses);
      setInstructors(insts);
      setEnrolledCourseIds(new Set(progress.map((p) => p.course.id)));
    } finally {
      setLoading(false);
    }
  };

  const getInstructor = (instructorId: string) => {
    return instructors.find((i) => i.id === instructorId);
  };

  const toggleChapter = async (
    courseId: string,
    chapterId: string,
    completed: boolean
  ) => {
    try {
      await learnerApi.updateChapterCompletion(
        learnerId,
        courseId,
        chapterId,
        completed
      );
      const updated = await learnerApi.getLearnerProgress(learnerId);
      setProgressList(updated);
    } catch (err) {
      console.error('更新章节失败', err);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await learnerApi.enrollCourse(learnerId, courseId);
      const updated = await learnerApi.getLearnerProgress(learnerId);
      setProgressList(updated);
      setEnrolledCourseIds(new Set(updated.map((p) => p.course.id)));
    } catch (err) {
      console.error('报名失败', err);
    }
  };

  const openAssessment = (course: Course) => {
    setAssessmentCourse(course);
    setAssessmentAnswers(new Array(course.assessment.length).fill(-1));
    setAssessmentResult(null);
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...assessmentAnswers];
    newAnswers[questionIndex] = optionIndex;
    setAssessmentAnswers(newAnswers);
  };

  const submitAssessment = async () => {
    if (!assessmentCourse) return;
    if (assessmentAnswers.some((a) => a === -1)) {
      alert('请完成所有题目');
      return;
    }

    try {
      const result = await learnerApi.submitAssessment(
        learnerId,
        assessmentCourse.id,
        assessmentAnswers
      );
      if (result.success && result.result) {
        setAssessmentResult(result.result);
        const updated = await learnerApi.getLearnerProgress(learnerId);
        setProgressList(updated);
      }
    } catch (err) {
      console.error('提交考核失败', err);
    }
  };

  const unstartedCourses = allCourses.filter(
    (c) => !enrolledCourseIds.has(c.id) && new Date(c.startTime) > new Date()
  );

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">学习进度</h1>
          <p className="page-description">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学习进度</h1>
        <p className="page-description">查看你的学习进度和已报名课程</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn ${viewMode === 'progress' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('progress')}
        >
          我的课程
        </button>
        <button
          className={`btn ${viewMode === 'enroll' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('enroll')}
        >
          可报名课程
        </button>
      </div>

      {viewMode === 'progress' && (
        <div className="progress-grid">
          {progressList.map((item) => (
            <div key={item.course.id} className="progress-card">
              <div className="progress-card-header">
                <div>
                  <h3 className="progress-card-title">{item.course.title}</h3>
                  <p className="progress-card-instructor">
                    讲师：{getInstructor(item.course.instructorId)?.name || '未知'}
                  </p>
                </div>
                <span className={`status-badge ${statusMap[item.status].className}`}>
                  {statusMap[item.status].label}
                </span>
              </div>

              <div className="progress-card-body">
                <CircularProgress progress={item.progress} size={100} />
                <div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    剩余章节：<strong>{item.remainingChapters}</strong> 节
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    总章节：<strong>{item.course.chapters.length}</strong> 节
                  </p>
                  {item.enrollment.assessmentScore !== null && (
                    <p style={{ fontSize: '14px', color: '#4f8cf7', marginTop: '8px' }}>
                      考核得分：<strong>{item.enrollment.assessmentScore}分</strong>
                    </p>
                  )}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() =>
                  setExpandedCourseId(
                    expandedCourseId === item.course.id ? null : item.course.id
                  )
                }
              >
                {expandedCourseId === item.course.id ? '收起章节' : '展开章节'}
              </button>

              {expandedCourseId === item.course.id && (
                <ul className="chapter-list">
                  {item.course.chapters.map((chapter) => {
                    const isCompleted = item.enrollment.completedChapters.includes(
                      chapter.id
                    );
                    return (
                      <li
                        key={chapter.id}
                        className={`chapter-item ${isCompleted ? 'completed' : ''}`}
                        onClick={() =>
                          toggleChapter(item.course.id, chapter.id, !isCompleted)
                        }
                      >
                        <div
                          className={`chapter-checkbox ${isCompleted ? 'completed' : ''}`}
                        >
                          {isCompleted && '✓'}
                        </div>
                        <span className="chapter-title">{chapter.title}</span>
                        <span className="chapter-duration">{chapter.duration}分钟</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {item.status === 'completed' && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                  onClick={() => openAssessment(item.course)}
                >
                  参加考核
                </button>
              )}
            </div>
          ))}

          {progressList.length === 0 && (
            <div className="card" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#888' }}>暂无已报名课程，去"可报名课程"看看吧</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'enroll' && (
        <div className="progress-grid">
          {unstartedCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const instructor = getInstructor(course.instructorId);
            return (
              <div key={course.id} className="progress-card">
                <div className="progress-card-header">
                  <div>
                    <h3 className="progress-card-title">{course.title}</h3>
                    <p className="progress-card-instructor">
                      讲师：{instructor?.name || '未知'}
                    </p>
                  </div>
                  {isEnrolled && (
                    <span className="enroll-badge">✓ 已报名</span>
                  )}
                </div>

                <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  {course.description}
                </p>

                <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                  <p>📅 开始时间：{new Date(course.startTime).toLocaleString('zh-CN')}</p>
                  <p>⏱️ 课程时长：{course.duration} 小时</p>
                  <p>📚 章节数：{course.chapters.length} 节</p>
                </div>

                <button
                  className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%' }}
                  onClick={() => !isEnrolled && handleEnroll(course.id)}
                  disabled={isEnrolled}
                >
                  {isEnrolled ? '✓ 已报名' : '立即报名'}
                </button>
              </div>
            );
          })}

          {unstartedCourses.length === 0 && (
            <div className="card" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#888' }}>暂无可报名的课程</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!assessmentCourse}
        onClose={() => {
          setAssessmentCourse(null);
          setAssessmentResult(null);
        }}
        title={`${assessmentCourse?.title} - 在线考核`}
        className="assessment-modal"
        footer={
          !assessmentResult ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAssessmentCourse(null);
                  setAssessmentResult(null);
                }}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={submitAssessment}>
                提交答卷
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setAssessmentCourse(null);
                setAssessmentResult(null);
              }}
            >
              关闭
            </button>
          )
        }
      >
        {assessmentResult ? (
          <div className="assessment-result">
            <div
              className={`assessment-score ${
                assessmentResult.passed ? 'passed' : 'failed'
              }`}
            >
              {assessmentResult.percentage}分
            </div>
            <p className="assessment-result-text">
              {assessmentResult.passed ? '🎉 恭喜通过考核！' : '😔 未通过，请继续努力'}
            </p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
              答对 {assessmentResult.score} / {assessmentResult.total} 题
            </p>
          </div>
        ) : (
          assessmentCourse?.assessment.map((question, qIndex) => (
            <div key={question.id} className="question-item">
              <p className="question-text">
                {qIndex + 1}. {question.question}
              </p>
              {question.options.map((option, oIndex) => (
                <div
                  key={oIndex}
                  className={`option-item ${
                    assessmentAnswers[qIndex] === oIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleOptionSelect(qIndex, oIndex)}
                >
                  <div className="option-radio" />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </Modal>
    </div>
  );
}

export default LearningProgress;
