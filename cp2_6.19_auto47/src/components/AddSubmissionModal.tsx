import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

interface AddSubmissionModalProps {
  isOpen: boolean;
  classId: string;
  onClose: () => void;
}

export const AddSubmissionModal: React.FC<AddSubmissionModalProps> = ({
  isOpen,
  classId,
  onClose,
}) => {
  const [studentName, setStudentName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const studentInputRef = useRef<HTMLInputElement>(null);
  const addSubmission = useStore((state) => state.addSubmission);
  const classData = useStore((state) =>
    state.classes.find((c) => c.id === classId)
  );

  useEffect(() => {
    if (isOpen && studentInputRef.current) {
      setTimeout(() => studentInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !title.trim() || !content.trim()) return;

    addSubmission(classId, studentName.trim(), title.trim(), content.trim());
    setStudentName('');
    setTitle('');
    setContent('');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectStudent = (name: string) => {
    setStudentName(name);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content scale-in add-submission-modal">
        <h2 className="modal-title">提交作业</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="studentName">学生姓名</label>
            <input
              ref={studentInputRef}
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="请输入学生姓名"
              autoComplete="off"
            />
            {classData && classData.studentNames.length > 0 && (
              <div className="student-suggestions">
                <span className="suggestions-label">快速选择：</span>
                <div className="suggestion-tags">
                  {classData.studentNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`suggestion-tag ${
                        studentName === name ? 'active' : ''
                      }`}
                      onClick={() => handleSelectStudent(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="title">作业标题</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入作业标题"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">作业内容</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请粘贴或输入作业文本内容"
              rows={8}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!studentName.trim() || !title.trim() || !content.trim()}
            >
              提交
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }

          .modal-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 28px;
            width: 90%;
            max-width: 520px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          }

          .add-submission-modal {
            max-width: 560px;
          }

          .modal-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #555;
            margin-bottom: 6px;
          }

          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 8px;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            border-color: #4a90d9;
            box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
          }

          .form-group textarea {
            resize: vertical;
            min-height: 120px;
            font-family: inherit;
            line-height: 1.6;
          }

          .student-suggestions {
            margin-top: 8px;
          }

          .suggestions-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 6px;
            display: block;
          }

          .suggestion-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .suggestion-tag {
            background: #f0f4f8;
            color: #5a7a9a;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .suggestion-tag:hover {
            background: #dce6f0;
          }

          .suggestion-tag.active {
            background: #4a90d9;
            color: white;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
          }

          .btn-primary {
            background: #4a90d9;
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
          }

          .btn-primary:hover:not(:disabled) {
            background: #3a7bc8;
          }

          .btn-primary:disabled {
            background: #a0c4e8;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f0f0f0;
            color: #555;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
          }

          .btn-secondary:hover {
            background: #e0e0e0;
          }
        `}</style>
      </div>
    </div>
  );
};
