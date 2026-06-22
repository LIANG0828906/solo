import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import CoursePanel from './components/CoursePanel';
import AssignmentCard from './components/AssignmentCard';
import GradingView from './components/GradingView';
import ProgressDashboard from './components/ProgressDashboard';
import SuccessToast from './components/SuccessToast';
import Button from './components/Button';
import Input from './components/Input';
import Spinner from './components/Spinner';
import './styles/App.css';

const App: React.FC = () => {
  const {
    currentView,
    toggleView,
    sidebarCollapsed,
    toggleSidebar,
    courses,
    selectedCourseId,
    selectedChapterId,
    assignments,
    submissions,
    selectedSubmission,
    loadingCourses,
    loadingAssignments,
    loadingSubmissions,
    successMessage,
    setSuccessMessage,
    fetchCourses,
    fetchAssignments,
    fetchSubmissions,
    selectSubmission,
    createAssignment,
    submitAssignment,
    isSaving,
  } = useStore();

  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newAssignmentUrl, setNewAssignmentUrl] = useState('');
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  
  const [studentSubmissionContent, setStudentSubmissionContent] = useState('');
  const [studentFileUrl, setStudentFileUrl] = useState('');

  const [studentName, setStudentName] = useState('学生');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedChapterId && currentView === 'teacher') {
      fetchAssignments(selectedChapterId);
    }
  }, [selectedChapterId, currentView, fetchAssignments]);

  useEffect(() => {
    if (assignments.length > 0 && currentView === 'teacher') {
      fetchSubmissions(assignments[0].id);
    }
  }, [assignments, currentView, fetchSubmissions]);

  const handleCreateAssignment = () => {
    if (!selectedChapterId || !newAssignmentTitle.trim()) return;
    
    createAssignment({
      chapterId: selectedChapterId,
      title: newAssignmentTitle.trim(),
      description: newAssignmentDesc.trim(),
      attachmentUrl: newAssignmentUrl.trim() || undefined,
    });
    
    setNewAssignmentTitle('');
    setNewAssignmentDesc('');
    setNewAssignmentUrl('');
    setShowNewAssignment(false);
  };

  const handleOpenSubmitModal = (assignmentId: string) => {
    setSelectedAssignmentForSubmit(assignmentId);
    setStudentSubmissionContent('');
    setStudentFileUrl('');
    setShowSubmitModal(true);
  };

  const handleStudentSubmit = () => {
    if (!selectedAssignmentForSubmit || !studentSubmissionContent.trim()) return;
    
    submitAssignment({
      assignmentId: selectedAssignmentForSubmit,
      studentId: 'stu_new',
      studentName: studentName.trim() || '匿名学生',
      content: studentSubmissionContent.trim(),
      fileUrl: studentFileUrl.trim() || undefined,
    });
    
    setShowSubmitModal(false);
    setSelectedAssignmentForSubmit(null);
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  return (
    <div className="app-container">
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
      <GradingView />

      {currentView === 'teacher' && (
        <>
          <div className={`sidebar-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {loadingCourses ? (
              <div className="course-panel">
                <div className="panel-loading">
                  <Spinner size={24} />
                  <span>加载中...</span>
                </div>
              </div>
            ) : (
              <CoursePanel />
            )}
          </div>

          <main className="main-content">
            <header className="main-header">
              <button 
                className="menu-toggle" 
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? '展开菜单' : '收起菜单'}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1>作业管理</h1>
              <Button variant="ghost" size="sm" onClick={toggleView}>
                切换到学生视图
              </Button>
            </header>

            <div className="content-area">
              {!selectedChapterId ? (
                <div className="empty-state">
                  <p>请从左侧选择一个章节</p>
                </div>
              ) : (
                <>
                  <div className="assignments-section">
                    <div className="section-header">
                      <h3>章节作业</h3>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setShowNewAssignment(!showNewAssignment)}
                      >
                        {showNewAssignment ? '取消' : '+ 发布作业'}
                      </Button>
                    </div>

                    {showNewAssignment && (
                      <div className="new-assignment-form">
                        <Input
                          value={newAssignmentTitle}
                          onChange={setNewAssignmentTitle}
                          placeholder="作业标题"
                        />
                        <Input
                          type="textarea"
                          value={newAssignmentDesc}
                          onChange={setNewAssignmentDesc}
                          placeholder="作业描述"
                          rows={3}
                        />
                        <Input
                          value={newAssignmentUrl}
                          onChange={setNewAssignmentUrl}
                          placeholder="附件链接（可选）"
                        />
                        <div className="form-actions">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleCreateAssignment}
                            loading={isSaving}
                            disabled={!newAssignmentTitle.trim()}
                          >
                            发布作业
                          </Button>
                        </div>
                      </div>
                    )}

                    {loadingAssignments ? (
                      <div className="loading-state">
                        <Spinner size={20} />
                        <span>加载作业中...</span>
                      </div>
                    ) : assignments.length === 0 ? (
                      <div className="empty-state">
                        <p>该章节暂无作业</p>
                      </div>
                    ) : (
                      <div className="assignments-list">
                        {assignments.map(assignment => (
                          <div key={assignment.id} className="assignment-item">
                            <h4>{assignment.title}</h4>
                            <p>{assignment.description}</p>
                            {assignment.attachmentUrl && (
                              <a 
                                href={assignment.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                📎 查看附件
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="submissions-section">
                    <div className="section-header">
                      <h3>学生提交</h3>
                      <div className="stats-badges">
                        <span className="badge pending">待批改 {pendingCount}</span>
                        <span className="badge graded">已批改 {gradedCount}</span>
                      </div>
                    </div>

                    {loadingSubmissions ? (
                      <div className="loading-state">
                        <Spinner size={20} />
                        <span>加载提交中...</span>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="empty-state">
                        <p>暂无学生提交</p>
                      </div>
                    ) : (
                      <div className="submissions-grid">
                        {submissions.map(submission => (
                          <AssignmentCard
                            key={submission.id}
                            submission={submission}
                            onClick={() => selectSubmission(submission)}
                            expanded={selectedSubmission?.id === submission.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </>
      )}

      {currentView === 'student' && (
        <>
          <main className="main-content student-view">
            <header className="main-header">
              <h1>学生中心</h1>
              <Button variant="ghost" size="sm" onClick={toggleView}>
                切换到教师视图
              </Button>
            </header>

            <div className="content-area">
              <ProgressDashboard />

              <div className="student-assignments-section">
                <div className="section-header">
                  <h3>可提交的作业</h3>
                </div>
                
                {loadingAssignments ? (
                  <div className="loading-state">
                    <Spinner size={20} />
                    <span>加载中...</span>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无可提交的作业</p>
                  </div>
                ) : (
                  <div className="assignments-list">
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="assignment-item student-assignment">
                        <h4>{assignment.title}</h4>
                        <p>{assignment.description}</p>
                        {assignment.attachmentUrl && (
                          <a 
                            href={assignment.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            📎 查看附件
                          </a>
                        )}
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleOpenSubmitModal(assignment.id)}
                        >
                          提交作业
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {showSubmitModal && (
            <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>提交作业</h3>
                  <button className="close-btn" onClick={() => setShowSubmitModal(false)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="modal-body">
                  <Input
                    value={studentName}
                    onChange={setStudentName}
                    placeholder="你的姓名"
                  />
                  <Input
                    type="textarea"
                    value={studentSubmissionContent}
                    onChange={setStudentSubmissionContent}
                    placeholder="请输入作业内容..."
                    rows={6}
                  />
                  <Input
                    value={studentFileUrl}
                    onChange={setStudentFileUrl}
                    placeholder="文件链接（可选）"
                  />
                </div>
                <div className="modal-footer">
                  <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
                    取消
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleStudentSubmit}
                    loading={isSaving}
                    disabled={!studentSubmissionContent.trim()}
                  >
                    提交
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
