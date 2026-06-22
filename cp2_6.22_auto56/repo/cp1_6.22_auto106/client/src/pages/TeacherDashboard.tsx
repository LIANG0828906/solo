import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from '../hooks/useWebSocket';
import { Question, ClassroomState, QuizReport } from '../types';

interface QuestionForm {
  id: string;
  type: 'single' | 'judge';
  content: string;
  options: string[];
  correctAnswer: number;
}

export default function TeacherDashboard() {
  const [classroomCode, setClassroomCode] = useState<string>('');
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<QuizReport | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [prevStudentCount, setPrevStudentCount] = useState(0);
  const [animateCount, setAnimateCount] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: classroomState, refetch } = useWebSocket<ClassroomState>(
    classroomCode ? `/api/classrooms/${classroomCode}` : '',
    3000,
    isCreated && !showReport
  );

  useEffect(() => {
    if (classroomState && classroomState.studentCount !== prevStudentCount) {
      setAnimateCount(true);
      setTimeout(() => setAnimateCount(false), 500);
      setPrevStudentCount(classroomState.studentCount);
    }
  }, [classroomState?.studentCount, prevStudentCount]);

  const createClassroom = async () => {
    if (!className.trim() || !teacherName.trim()) return;

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className, teacherName }),
      });
      const data = await response.json();
      setClassroomCode(data.code);
      setIsCreated(true);
    } catch (error) {
      console.error('创建课堂失败:', error);
    }
  };

  const addQuestion = (type: 'single' | 'judge') => {
    if (questions.length >= 10) return;

    const newQuestion: QuestionForm = {
      id: uuidv4(),
      type,
      content: '',
      options: type === 'single' ? ['', '', '', ''] : ['正确', '错误'],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionForm>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const publishQuiz = async () => {
    if (questions.length === 0) return;

    const validQuestions = questions.filter(
      (q) => q.content.trim() !== ''
    );

    if (validQuestions.length === 0) return;

    try {
      await fetch(`/api/classrooms/${classroomCode}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions }),
      });
      setShowQuizModal(false);
      setQuestions([]);
      refetch();
    } catch (error) {
      console.error('发布测验失败:', error);
    }
  };

  const endQuiz = async () => {
    try {
      await fetch(`/api/classrooms/${classroomCode}/end-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      loadReport();
    } catch (error) {
      console.error('结束测验失败:', error);
    }
  };

  const loadReport = async () => {
    try {
      const response = await fetch(`/api/classrooms/${classroomCode}/report`);
      const data = await response.json();
      setReport(data);
      setShowReport(true);
    } catch (error) {
      console.error('获取报告失败:', error);
    }
  };

  const exportReport = () => {
    if (!report) return;

    let text = `班级学情报告\n`;
    text += `==========================\n\n`;
    text += `班级名称: ${report.className}\n`;
    text += `授课教师: ${report.teacherName}\n`;
    text += `学生人数: ${report.studentCount}\n`;
    text += `题目数量: ${report.totalQuestions}\n`;
    text += `全班平均正确率: ${(report.overallAccuracy * 100).toFixed(1)}%\n\n`;

    text += `各题统计:\n`;
    text += `--------------------------\n`;
    report.questionStats.forEach((stat, index) => {
      text += `第${index + 1}题: ${stat.question.content}\n`;
      text += `  正确率: ${(stat.accuracy * 100).toFixed(1)}%\n`;
      text += `  答对人数: ${stat.correctCount}\n`;
      text += `  答错人数: ${stat.wrongCount}\n`;
      text += `  平均用时: ${stat.avgTime.toFixed(1)}秒\n\n`;
    });

    text += `学生答题记录:\n`;
    text += `--------------------------\n`;
    report.studentStats.forEach((stat) => {
      text += `${stat.studentName}: `;
      text += `${stat.correctCount}/${stat.totalQuestions}题正确, `;
      text += `用时${stat.totalTime.toFixed(1)}秒\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.className}_学情报告.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const drawRingChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !classroomState || !classroomState.currentQuiz) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const lineWidth = 24;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    const answers = classroomState.answers;
    const totalQuestions = classroomState.currentQuiz.questions.length;
    const totalPossible = classroomState.studentCount * totalQuestions;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = totalPossible > 0 ? correctCount / totalPossible : 0;

    const gradient = ctx.createLinearGradient(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius
    );
    gradient.addColorStop(0, '#22d3ee');
    gradient.addColorStop(0.5, '#0ea5e9');
    gradient.addColorStop(1, '#1e40af');

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + accuracy * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(accuracy * 100).toFixed(1)}%`, centerX, centerY - 10);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('全班正确率', centerX, centerY + 25);
  }, [classroomState]);

  useEffect(() => {
    if (classroomState?.currentQuiz && !showReport) {
      drawRingChart();
    }
  }, [classroomState, drawRingChart, showReport]);

  const shareLink = classroomCode
    ? `${window.location.origin}/student/${classroomCode}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const getQuestionStats = () => {
    if (!classroomState?.currentQuiz) return [];

    return classroomState.currentQuiz.questions.map((q, index) => {
      const questionAnswers = classroomState.answers.filter(
        (a) => a.questionIndex === index
      );
      const correctCount = questionAnswers.filter((a) => a.isCorrect).length;
      const totalCount = questionAnswers.length;
      const avgTime =
        totalCount > 0
          ? questionAnswers.reduce((sum, a) => sum + a.timeSpent, 0) /
            totalCount
          : 0;

      return {
        index,
        question: q,
        correctCount,
        wrongCount: totalCount - correctCount,
        totalCount,
        avgTime,
      };
    });
  };

  const getStudentAnswersForQuestion = (questionIndex: number) => {
    if (!classroomState) return [];

    return classroomState.students.map((student) => {
      const answer = classroomState.answers.find(
        (a) => a.studentId === student.id && a.questionIndex === questionIndex
      );
      const question = classroomState.currentQuiz?.questions[questionIndex];
      return {
        studentId: student.id,
        studentName: student.name,
        answer: answer?.answer ?? null,
        answerText:
          answer !== undefined && question
            ? question.options[answer.answer]
            : '未作答',
        timeSpent: answer?.timeSpent ?? 0,
        isCorrect: answer?.isCorrect ?? false,
        answered: !!answer,
      };
    });
  };

  if (!isCreated) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.createCard}>
          <h1 style={styles.createTitle}>创建课堂</h1>
          <p style={styles.createSubtitle}>
            快速创建一个虚拟课堂，与学生进行实时互动
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>课堂名称</label>
            <input
              style={styles.input}
              type="text"
              placeholder="例如：高三(1)班 数学课"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>教师姓名</label>
            <input
              style={styles.input}
              type="text"
              placeholder="请输入您的姓名"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />
          </div>

          <button
            style={{
              ...styles.primaryButton,
              opacity: className.trim() && teacherName.trim() ? 1 : 0.6,
            }}
            onClick={createClassroom}
            disabled={!className.trim() || !teacherName.trim()}
            className="btn-hover"
          >
            创建课堂
          </button>
        </div>
      </div>
    );
  }

  if (showReport && report) {
    return (
      <div style={styles.reportPage}>
        <div style={styles.reportNav}>
          <button
            style={styles.backButton}
            onClick={() => {
              setShowReport(false);
              setReport(null);
            }}
            className="btn-hover"
          >
            ← 返回仪表盘
          </button>
          <button style={styles.exportButton} onClick={exportReport} className="btn-hover">
            导出报告
          </button>
        </div>

        <div style={styles.reportContainer}>
          <div style={styles.reportHeader}>
            <h1 style={styles.reportTitle}>班级学情报告</h1>
            <p style={styles.reportMeta}>
              {report.className} | {report.teacherName}老师 |{' '}
              {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          <div style={styles.reportSummary} className="report-summary">
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>
                {(report.overallAccuracy * 100).toFixed(1)}%
              </div>
              <div style={styles.summaryLabel}>全班平均正确率</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>{report.studentCount}</div>
              <div style={styles.summaryLabel}>参与学生</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryValue}>{report.totalQuestions}</div>
              <div style={styles.summaryLabel}>题目总数</div>
            </div>
          </div>

          <div style={styles.reportSection}>
            <h2 style={styles.sectionTitle}>各题详细统计</h2>
            {report.questionStats.map((stat, index) => (
              <div key={index} style={styles.questionReportCard}>
                <div style={styles.questionReportHeader}>
                  <span style={styles.questionNumber}>第{index + 1}题</span>
                  <span
                    style={{
                      ...styles.accuracyBadge,
                      backgroundColor:
                        stat.accuracy >= 0.8
                          ? '#dcfce7'
                          : stat.accuracy >= 0.6
                          ? '#fef9c3'
                          : '#fee2e2',
                      color:
                        stat.accuracy >= 0.8
                          ? '#166534'
                          : stat.accuracy >= 0.6
                          ? '#854d0e'
                          : '#991b1b',
                    }}
                  >
                    正确率 {(stat.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <p style={styles.questionContent}>{stat.question.content}</p>
                <div style={styles.questionMeta}>
                  <span>答对: {stat.correctCount}人</span>
                  <span>答错: {stat.wrongCount}人</span>
                  <span>平均用时: {stat.avgTime.toFixed(1)}秒</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.reportSection}>
            <h2 style={styles.sectionTitle}>学生答题记录</h2>
            <div style={styles.studentRecords}>
              {report.studentStats.map((stat, index) => (
                <div key={stat.studentId} style={styles.studentRecordCard}>
                  <div style={styles.studentRecordHeader}>
                    <span style={styles.studentRank}>#{index + 1}</span>
                    <span style={styles.studentName}>{stat.studentName}</span>
                  </div>
                  <div style={styles.studentRecordStats}>
                    <div>
                      <span style={styles.recordValue}>
                        {stat.correctCount}/{stat.totalQuestions}
                      </span>
                      <span style={styles.recordLabel}>正确题数</span>
                    </div>
                    <div>
                      <span style={styles.recordValue}>
                        {stat.totalTime.toFixed(1)}s
                      </span>
                      <span style={styles.recordLabel}>总用时</span>
                    </div>
                    <div>
                      <span
                        style={{
                          ...styles.recordValue,
                          color:
                            stat.accuracy >= 0.8
                              ? '#16a34a'
                              : stat.accuracy >= 0.6
                              ? '#ca8a04'
                              : '#dc2626',
                        }}
                      >
                        {(stat.accuracy * 100).toFixed(0)}%
                      </span>
                      <span style={styles.recordLabel}>正确率</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionStats = getQuestionStats();

  return (
    <div style={styles.dashboard}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <button
            style={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
          >
            ☰
          </button>
          <div style={styles.classroomInfo}>
            <span style={styles.className}>{className}</span>
            <span style={styles.onlineCount}>
              在线:{' '}
              <span
                style={{
                  ...styles.countNumber,
                  animation: animateCount
                    ? 'numberFade 0.5s ease'
                    : 'none',
                }}
              >
                {classroomState?.studentCount || 0}
              </span>
            </span>
          </div>
        </div>

        <div className={`nav-right ${mobileMenuOpen ? 'mobile-open' : ''}`} style={styles.navRight}>
          <span style={styles.classCode}>课堂码: {classroomCode}</span>
          <button style={styles.quizButton} onClick={() => setShowQuizModal(true)} className="btn-hover">
            开始随堂测验
          </button>
        </div>
      </nav>

      <div style={styles.mainContent}>
        <div style={styles.shareSection}>
          <div style={styles.shareCard}>
            <span style={styles.shareLabel}>分享链接</span>
            <div style={styles.shareLinkRow}>
              <input style={styles.shareInput} value={shareLink} readOnly />
              <button style={styles.copyButton} onClick={copyLink} className="btn-hover">
                复制
              </button>
            </div>
          </div>
        </div>

        {!classroomState?.currentQuiz ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h2 style={styles.emptyTitle}>暂无进行中的测验</h2>
            <p style={styles.emptyDesc}>
              点击右上角「开始随堂测验」按钮创建题目
            </p>
          </div>
        ) : (
          <div style={styles.dashboardContent}>
            <div style={styles.statsHeader}>
              <h2 style={styles.statsTitle}>实时答题统计</h2>
              <button style={styles.endQuizButton} onClick={endQuiz} className="btn-hover">
                结束测验
              </button>
            </div>

            <div style={styles.dashboardGrid} className="dashboard-grid">
              <div style={styles.chartCard}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '280px' }} />
              </div>

              <div style={styles.questionsListCard}>
                <h3 style={styles.listTitle}>题目答题情况</h3>
                <div style={styles.questionsList}>
                  {questionStats.map((stat) => (
                    <div key={stat.index}>
                      <div
                        style={styles.questionRow}
                        onClick={() =>
                          setExpandedQuestion(
                            expandedQuestion === stat.index
                              ? null
                              : stat.index
                          )
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                      >
                        <span style={styles.qNum}>第{stat.index + 1}题</span>
                        <span style={styles.qType}>
                          {stat.question.type === 'single' ? '单选' : '判断'}
                        </span>
                        <span style={styles.qCorrect}>
                          ✓ {stat.correctCount}
                        </span>
                        <span style={styles.qWrong}>✗ {stat.wrongCount}</span>
                        <span style={styles.qTime}>
                          {stat.avgTime.toFixed(1)}s
                        </span>
                        <span style={styles.qExpand}>
                          {expandedQuestion === stat.index ? '▲' : '▼'}
                        </span>
                      </div>

                      {expandedQuestion === stat.index && (
                        <div style={styles.expandedSection}>
                          <div style={styles.studentAnswersHeader}>
                            <span style={styles.answerColHeader}>学生</span>
                            <span style={styles.answerColHeader}>答案</span>
                            <span style={styles.answerColHeader}>用时</span>
                            <span style={styles.answerColHeader}>状态</span>
                          </div>
                          {getStudentAnswersForQuestion(stat.index).map(
                            (sa, idx) => (
                              <div
                                key={sa.studentId}
                                style={{
                                  ...styles.studentAnswerRow,
                                  backgroundColor:
                                    idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                }}
                              >
                                <span style={styles.studentAnswerName}>
                                  {sa.studentName}
                                </span>
                                <span style={styles.studentAnswerText}>
                                  {sa.answered ? sa.answerText : '未作答'}
                                </span>
                                <span style={styles.studentAnswerTime}>
                                  {sa.answered
                                    ? `${sa.timeSpent.toFixed(1)}s`
                                    : '-'}
                                </span>
                                <span>
                                  {sa.answered ? (
                                    sa.isCorrect ? (
                                      <span style={styles.correctBadge}>
                                        正确
                                      </span>
                                    ) : (
                                      <span style={styles.wrongBadge}>
                                        错误
                                      </span>
                                    )
                                  ) : (
                                    <span style={styles.pendingBadge}>
                                      待答
                                    </span>
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQuizModal && (
        <div style={styles.modalOverlay} onClick={() => setShowQuizModal(false)}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2>创建随堂测验</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowQuizModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.addQuestionButtons}>
                <button
                  style={styles.addQBtn}
                  onClick={() => addQuestion('single')}
                  disabled={questions.length >= 10}
                  className="btn-hover"
                >
                  + 添加单选题
                </button>
                <button
                  style={styles.addQBtn}
                  onClick={() => addQuestion('judge')}
                  disabled={questions.length >= 10}
                  className="btn-hover"
                >
                  + 添加判断题
                </button>
                <span style={styles.questionCount}>
                  {questions.length}/10 题
                </span>
              </div>

              <div style={styles.questionsContainer}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={styles.questionCard}
                  >
                    <div style={styles.questionCardHeader}>
                      <span style={styles.cardQNum}>第{idx + 1}题</span>
                      <span style={styles.cardQType}>
                        {q.type === 'single' ? '单选题' : '判断题'}
                      </span>
                      <button
                        style={styles.removeQBtn}
                        onClick={() => removeQuestion(q.id)}
                      >
                        删除
                      </button>
                    </div>

                    <input
                      style={styles.questionInput}
                      type="text"
                      placeholder="请输入题目内容"
                      value={q.content}
                      onChange={(e) =>
                        updateQuestion(q.id, { content: e.target.value })
                      }
                    />

                    <div style={styles.optionsList}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={styles.optionRow}>
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === optIdx}
                            onChange={() =>
                              updateQuestion(q.id, { correctAnswer: optIdx })
                            }
                            style={styles.radioInput}
                          />
                          <span style={styles.optionLabel}>
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {q.type === 'single' ? (
                            <input
                              style={styles.optionInput}
                              type="text"
                              placeholder="选项内容"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIdx] = e.target.value;
                                updateQuestion(q.id, { options: newOptions });
                              }}
                            />
                          ) : (
                            <span style={styles.judgeOption}>{opt}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowQuizModal(false)}
                className="btn-hover"
              >
                取消
              </button>
              <button
                style={{
                  ...styles.publishBtn,
                  opacity:
                    questions.filter((q) => q.content.trim()).length > 0
                      ? 1
                      : 0.5,
                }}
                onClick={publishQuiz}
                disabled={
                  questions.filter((q) => q.content.trim()).length === 0
                }
                className="btn-hover"
              >
                发布测验
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1A365D 0%, #2c5282 100%)',
    padding: '20px',
  },
  createCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    animation: 'scaleIn 0.3s ease-out',
  },
  createTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: '8px',
  },
  createSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '32px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1A365D',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '10px',
    marginTop: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#1A365D',
    padding: '0 24px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'none',
    color: 'white',
    fontSize: '24px',
    padding: '8px 12px',
  },
  classroomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  className: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
  },
  onlineCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
  },
  countNumber: {
    color: '#22d3ee',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  classCode: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  quizButton: {
    backgroundColor: '#22d3ee',
    color: '#0f172a',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  mainContent: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  shareSection: {
    marginBottom: '24px',
  },
  shareCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '0.5px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  shareLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px',
    display: 'block',
  },
  shareLinkRow: {
    display: 'flex',
    gap: '10px',
  },
  shareInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f8fafc',
  },
  copyButton: {
    padding: '10px 20px',
    backgroundColor: '#1A365D',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '20px',
    color: '#334155',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  dashboardContent: {
    animation: 'fadeIn 0.3s ease',
  },
  statsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  statsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  endQuizButton: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '0.5px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  questionsListCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '0.5px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  listTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionRow: {
    display: 'grid',
    gridTemplateColumns: '60px 50px 50px 50px 60px 30px',
    gap: '8px',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    alignItems: 'center',
    fontSize: '14px',
  },
  qNum: {
    fontWeight: '600',
    color: '#334155',
  },
  qType: {
    color: '#64748b',
    fontSize: '12px',
  },
  qCorrect: {
    color: '#16a34a',
    fontWeight: '500',
  },
  qWrong: {
    color: '#dc2626',
    fontWeight: '500',
  },
  qTime: {
    color: '#64748b',
  },
  qExpand: {
    color: '#94a3b8',
    fontSize: '12px',
    textAlign: 'center',
  },
  expandedSection: {
    marginTop: '8px',
    marginLeft: '10px',
    borderLeft: '3px solid #e2e8f0',
    paddingLeft: '14px',
  },
  studentAnswersHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 80px 80px',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '4px',
  },
  answerColHeader: {
    textAlign: 'left',
  },
  studentAnswerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 80px 80px',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  studentAnswerName: {
    color: '#334155',
    fontWeight: '500',
  },
  studentAnswerText: {
    color: '#475569',
  },
  studentAnswerTime: {
    color: '#64748b',
  },
  correctBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  wrongBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  pendingBadge: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'scaleIn 0.3s ease-out',
    boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    fontSize: '20px',
    color: '#94a3b8',
    padding: '4px 8px',
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  addQuestionButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  addQBtn: {
    padding: '10px 16px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s, transform 0.2s',
  },
  questionCount: {
    marginLeft: 'auto',
    color: '#64748b',
    fontSize: '13px',
  },
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    animation: 'slideInRight 0.3s ease-out',
  },
  questionCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  cardQNum: {
    fontWeight: '600',
    color: '#1A365D',
    fontSize: '15px',
  },
  cardQType: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  removeQBtn: {
    marginLeft: 'auto',
    color: '#ef4444',
    fontSize: '13px',
    background: 'none',
  },
  questionInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  radioInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  optionLabel: {
    color: '#64748b',
    fontSize: '14px',
    minWidth: '24px',
  },
  optionInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: 'white',
  },
  judgeOption: {
    flex: 1,
    fontSize: '14px',
    color: '#334155',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  publishBtn: {
    padding: '10px 28px',
    backgroundColor: '#1A365D',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  reportPage: {
    minHeight: '100vh',
    backgroundColor: '#FDF6E3',
  },
  reportNav: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#FDF6E3',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e6dcc8',
    zIndex: 10,
  },
  backButton: {
    color: '#1A365D',
    fontSize: '14px',
    background: 'none',
    fontWeight: '500',
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#1A365D',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s',
  },
  reportContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  reportHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  reportTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: '12px',
  },
  reportMeta: {
    fontSize: '14px',
    color: '#78716c',
  },
  reportSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '40px',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid #e6dcc8',
  },
  summaryValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: '4px',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#78716c',
  },
  reportSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
  },
  questionReportCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e6dcc8',
  },
  questionReportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  questionNumber: {
    fontWeight: '600',
    color: '#1A365D',
  },
  accuracyBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  questionContent: {
    fontSize: '15px',
    color: '#334155',
    marginBottom: '10px',
  },
  questionMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#64748b',
  },
  studentRecords: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  studentRecordCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e6dcc8',
  },
  studentRecordHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  studentRank: {
    backgroundColor: '#1A365D',
    color: 'white',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  studentName: {
    fontWeight: '600',
    color: '#1e293b',
  },
  studentRecordStats: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  recordValue: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  recordLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#78716c',
    marginTop: '2px',
  },
};
