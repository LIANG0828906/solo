import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MemberAvatar } from '../components/MemberAvatar';
import { FileUpload } from '../components/FileUpload';
import type { FileItem } from '../types';
import '../styles/TaskSubmit.css';

export function TaskSubmit() {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, currentUser, users, submitTask, getUserById } = useApp();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const task = taskId ? getTaskById(taskId) : null;

  const currentGroup = useMemo(() => {
    if (!task || !currentUser) return null;
    return task.groups.find((g) => g.memberIds.includes(currentUser.id)) || null;
  }, [task, currentUser]);

  const groupMembers = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.memberIds
      .map((id) => getUserById(id))
      .filter((u): u is NonNullable<typeof u> => u !== undefined);
  }, [currentGroup, getUserById]);

  const isLeader = currentGroup?.leaderId === currentUser?.id;

  const handleSubmit = () => {
    if (!task || !currentGroup || files.length === 0) return;

    setIsSubmitting(true);

    setTimeout(() => {
      submitTask(task.id, currentGroup.id, files);
      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        navigate(`/class/${task.classId}`);
      }, 1500);
    }, 800);
  };

  if (!task) {
    return (
      <div className="task-submit page-enter">
        <div className="task-submit__empty">任务不存在</div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="task-submit page-enter">
        <div className="task-submit__empty">你不在该任务的任何小组中</div>
      </div>
    );
  }

  return (
    <div className="task-submit page-enter">
      <div className="task-submit__container">
        <div className="task-submit__header">
          <button
            className="task-submit__back"
            onClick={() => navigate(`/class/${task.classId}`)}
          >
            ← 返回
          </button>
          <h1 className="task-submit__title">{task.name}</h1>
          <div className="task-submit__group">
            <span className="task-submit__group-label">当前小组</span>
            <span className="task-submit__group-name">{currentGroup.name}</span>
            {isLeader && <span className="task-submit__leader-badge">组长</span>}
          </div>
        </div>

        <div className="task-submit__content">
          <div className="task-submit__sidebar">
            <h2 className="task-submit__section-title">组内成员</h2>
            <div className="task-submit__members">
              {groupMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="task-submit__member"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <MemberAvatar user={member} size="md" showStatus />
                  <div className="task-submit__member-info">
                    <span className="task-submit__member-name">{member.name}</span>
                    <span className="task-submit__member-role">
                      {member.id === currentGroup.leaderId ? '组长' : '组员'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="task-submit__main">
            <h2 className="task-submit__section-title">提交成果</h2>

            {currentGroup.submission ? (
              <div className="task-submit__submitted">
                <div className="task-submit__submitted-icon">✓</div>
                <h3 className="task-submit__submitted-title">已提交成果</h3>
                <p className="task-submit__submitted-time">
                  提交时间：
                  {new Date(currentGroup.submission.submittedAt).toLocaleString('zh-CN')}
                </p>
                <div className="task-submit__submitted-files">
                  {currentGroup.submission.files.map((file) => (
                    <div key={file.id} className="task-submit__file-item">
                      <span className="task-submit__file-icon">
                        {file.type === 'image' ? '🖼️' : file.type === 'pdf' ? '📄' : '📁'}
                      </span>
                      <span className="task-submit__file-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {isLeader ? (
                  <>
                    <FileUpload files={files} onChange={setFiles} />

                    <div className="task-submit__actions">
                      <button
                        className="btn btn--primary btn--large"
                        onClick={handleSubmit}
                        disabled={files.length === 0 || isSubmitting}
                      >
                        {isSubmitting ? '提交中...' : '提交成果'}
                      </button>
                    </div>

                    <p className="task-submit__hint">
                      作为组长，你负责统一提交小组的成果文件
                    </p>
                  </>
                ) : (
                  <div className="task-submit__not-leader">
                    <div className="task-submit__not-leader-icon">👥</div>
                    <h3 className="task-submit__not-leader-title">等待组长提交</h3>
                    <p className="task-submit__not-leader-text">
                      请联系你们的组长
                      {getUserById(currentGroup.leaderId)?.name}
                      来统一提交小组成果
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="task-submit__success-overlay">
          <div className="task-submit__success-content">
            <div className="task-submit__success-check">
              <svg viewBox="0 0 52 52" className="checkmark">
                <circle
                  className="checkmark__circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className="checkmark__check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <h2 className="task-submit__success-title">提交成功</h2>
          </div>
        </div>
      )}
    </div>
  );
}
