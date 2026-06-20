import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ApiService } from '@/services/ApiService';
import { wsService } from '@/services/WebSocketService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ScoreSlider } from '@/components/ScoreSlider';
import { NotificationContainer } from '@/components/Notification';
import { Submission } from '@/types';
import { matchDimension } from '@/utils/dimension';

export function ReviewPanel() {
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const room = useStore((state) => state.room);
  const assignedSubmissions = useStore((state) => state.assignedSubmissions);
  const addNotification = useStore((state) => state.addNotification);
  const setReviewProgress = useStore((state) => state.setReviewProgress);
  const setPhase = useStore((state) => state.setPhase);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (assignedSubmissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(assignedSubmissions[0]);
      setScores(assignedSubmissions.reduce((acc, s) => ({ ...acc, [s.id]: 3 }), {}));
      setComments(assignedSubmissions.reduce((acc, s) => ({ ...acc, [s.id]: '' }), {}));
    }
  }, [assignedSubmissions, selectedSubmission]);
  
  useEffect(() => {
    wsService.subscribe('review_update', (message) => {
      if (message.data.roomId === room?.id) {
        addNotification(`有新评分提交！当前进度: ${message.data.reviewCount}/${message.data.totalRequired}`, 'info');
      }
    });
    
    wsService.subscribe('phase_change', (message) => {
      if (message.data.roomId === room?.id && message.data.phase === 'completed') {
        setPhase('completed');
        addNotification('所有互评已完成，正在跳转到反馈看板...', 'success');
        setTimeout(() => navigate('/feedback'), 1500);
      }
    });
  }, [room?.id, addNotification, setPhase, navigate]);
  
  useEffect(() => {
    if (!user || !room) {
      navigate('/login');
    }
  }, [user, room, navigate]);
  
  const handleSelectSubmission = (submission: Submission) => {
    if (!submittedIds.includes(submission.id)) {
      setSelectedSubmission(submission);
    }
  };
  
  const handleScoreChange = (submissionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [submissionId]: score }));
  };
  
  const handleCommentChange = (submissionId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [submissionId]: comment }));
  };
  
  const getCommentStatus = (submissionId: string) => {
    const comment = comments[submissionId] || '';
    const length = comment.trim().length;
    if (length < 50) {
      return { valid: false, message: `还需输入${50 - length}字`, color: '#e74c3c' };
    }
    return { valid: true, message: '✅ 已达到50字', color: '#2ecc71' };
  };
  
  const handleSubmit = async (submissionId: string) => {
    if (!user || !room) return;
    
    const comment = comments[submissionId] || '';
    if (comment.trim().length < 50) {
      addNotification('评论需要至少50字', 'info');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const dimension = matchDimension(comment);
      
      await ApiService.sendReview({
        reviewerId: user.id,
        submissionId,
        roomId: room.id,
        score: scores[submissionId],
        comment: comment.trim(),
      });
      
      setSubmittedIds((prev) => [...prev, submissionId]);
      setReviewProgress(submittedIds.length + 1, assignedSubmissions.length);
      addNotification('评分提交成功！', 'success');
      
      const remaining = assignedSubmissions.filter((s) => !submittedIds.includes(s.id) && s.id !== submissionId);
      if (remaining.length > 0) {
        setSelectedSubmission(remaining[0]);
      } else {
        setPhase('completed');
        navigate('/feedback');
      }
    } catch {
      addNotification('提交失败，请重试', 'info');
    }
    
    setSubmitting(false);
  };
  
  if (!user || !room || assignedSubmissions.length === 0) {
    return null;
  }
  
  const remainingCount = assignedSubmissions.filter((s) => !submittedIds.includes(s.id)).length;
  
  return (
    <div
      className={`min-h-screen transition-theme duration-300 ${
        theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'
      }`}
    >
      <NotificationContainer />
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="p-4">
        <div
          className={`mb-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-xl font-bold font-inter ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}
              >
                📝 互评面板
              </h1>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                }`}
              >
                房间码: {room.code} | 昵称: {user.nickname}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-dark-accent1' : 'bg-light-accent1/20'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-accent1'
                }`}
              >
                进度: {submittedIds.length}/{assignedSubmissions.length}
              </span>
            </div>
          </div>
        </div>
        
        {isMobile ? (
          <div className="space-y-4">
            {assignedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 rounded-lg ${
                  submittedIds.includes(submission.id)
                    ? theme === 'dark'
                      ? 'bg-dark-accent1/30'
                      : 'bg-gray-100'
                    : theme === 'dark'
                    ? 'bg-dark-card'
                    : 'bg-light-card'
                }`}
              >
                <div
                  className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                  }`}
                >
                  {submission.title}
                  {submittedIds.includes(submission.id) && (
                    <span className="ml-2 text-score-high">✅ 已提交</span>
                  )}
                </div>
                
                <p
                  className={`text-sm mb-4 ${
                    theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                  }`}
                >
                  {submission.abstract}
                </p>
                
                {!submittedIds.includes(submission.id) && (
                  <>
                    <ScoreSlider
                      value={scores[submission.id] || 3}
                      onChange={(score) => handleScoreChange(submission.id, score)}
                    />
                    
                    <div className="mt-4">
                      <textarea
                        value={comments[submission.id] || ''}
                        onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                        placeholder="请输入50字以上的评价意见..."
                        rows={4}
                        className={`w-full p-3 rounded-lg border resize-none ${
                          theme === 'dark'
                            ? 'bg-dark-bg border-dark-accent1 text-dark-text placeholder-dark-text/40'
                            : 'bg-light-bg border-gray-200 text-light-text placeholder-light-text/40'
                        }`}
                      />
                      <div
                        className="text-xs mt-1"
                        style={{ color: getCommentStatus(submission.id).color }}
                      >
                        {getCommentStatus(submission.id).message}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSubmit(submission.id)}
                      disabled={submitting || !getCommentStatus(submission.id).valid}
                      className={`mt-4 w-full py-3 rounded-lg font-medium text-white transition-all ${
                        submitting || !getCommentStatus(submission.id).valid
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      {submitting ? '⏳ 提交中...' : '📤 提交评分'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            <div
              className={`w-[30%] p-4 rounded-lg ${
                theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
              }`}
              style={{ borderRight: `1px solid ${theme === 'dark' ? '#0f3460' : '#e0e0e0'}` }}
            >
              <h2
                className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                }`}
              >
                📋 待评作业 ({remainingCount})
              </h2>
              
              <div className="space-y-2">
                {assignedSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => handleSelectSubmission(submission)}
                    disabled={submittedIds.includes(submission.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      selectedSubmission?.id === submission.id
                        ? 'animate-float'
                        : ''
                    } ${
                      submittedIds.includes(submission.id)
                        ? theme === 'dark'
                          ? 'bg-dark-accent1/30 opacity-50'
                          : 'bg-gray-100 opacity-50'
                        : selectedSubmission?.id === submission.id
                        ? 'bg-gradient-to-r from-gradient-start to-gradient-end text-white'
                        : theme === 'dark'
                        ? 'bg-dark-accent1 hover:bg-dark-accent1/80'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium truncate">
                      {submission.title}
                    </div>
                    {submittedIds.includes(submission.id) && (
                      <span className="text-xs text-score-high">✅ 已提交</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div
              className={`w-[70%] p-6 rounded-lg ${
                theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'
              }`}
            >
              {selectedSubmission ? (
                <>
                  <h2
                    className={`text-xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                    }`}
                  >
                    {selectedSubmission.title}
                  </h2>
                  
                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      theme === 'dark' ? 'text-dark-text/80' : 'text-light-text/80'
                    }`}
                  >
                    {selectedSubmission.abstract}
                  </p>
                  
                  <div className="mb-6">
                    <ScoreSlider
                      value={scores[selectedSubmission.id] || 3}
                      onChange={(score) => handleScoreChange(selectedSubmission.id, score)}
                      disabled={submittedIds.includes(selectedSubmission.id)}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-dark-text' : 'text-light-text'
                      }`}
                    >
                      💬 评价意见 (至少50字)
                    </label>
                    <textarea
                      value={comments[selectedSubmission.id] || ''}
                      onChange={(e) => handleCommentChange(selectedSubmission.id, e.target.value)}
                      placeholder="请输入你的评价意见，包括对作业的优点、不足和改进建议..."
                      rows={6}
                      disabled={submittedIds.includes(selectedSubmission.id)}
                      className={`w-full p-4 rounded-lg border resize-none transition-all ${
                        theme === 'dark'
                          ? 'bg-dark-bg border-dark-accent1 text-dark-text placeholder-dark-text/40 focus:border-dark-accent2'
                          : 'bg-light-bg border-gray-200 text-light-text placeholder-light-text/40 focus:border-light-accent1'
                      } disabled:opacity-50`}
                    />
                    <div
                      className="text-sm mt-2 flex items-center gap-2"
                      style={{ color: getCommentStatus(selectedSubmission.id).color }}
                    >
                      {getCommentStatus(selectedSubmission.id).message}
                      <span className="text-xs">
                        ({(comments[selectedSubmission.id] || '').trim().length}字)
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSubmit(selectedSubmission.id)}
                    disabled={submitting || submittedIds.includes(selectedSubmission.id) || !getCommentStatus(selectedSubmission.id).valid}
                    className={`w-full py-4 rounded-lg font-medium text-white transition-all duration-300 ${
                      submitting || submittedIds.includes(selectedSubmission.id) || !getCommentStatus(selectedSubmission.id).valid
                        ? 'opacity-50 cursor-not-allowed hover:scale-100'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {submittedIds.includes(selectedSubmission.id)
                      ? '✅ 已提交'
                      : submitting
                      ? '⏳ 提交中...'
                      : '📤 提交评分'}
                  </button>
                </>
              ) : (
                <div
                  className={`text-center py-12 ${
                    theme === 'dark' ? 'text-dark-text/60' : 'text-light-text/60'
                  }`}
                >
                  请从左侧选择一份作业进行评分
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}