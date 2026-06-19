import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [studentNames, setStudentNames] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addClass = useStore((state) => state.addClass);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const names = studentNames
      .split(/[,，\n]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    addClass(name.trim(), names);
    setName('');
    setStudentNames('');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content scale-in">
        <h2 className="modal-title">创建新班级</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="className">班级名称</label>
            <input
              ref={inputRef}
              id="className"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入班级名称"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="students">学生名单</label>
            <textarea
              id="students"
              value={studentNames}
              onChange={(e) => setStudentNames(e.target.value)}
              placeholder="请输入学生姓名，用逗号或换行分隔&#10;例如：张三,李四,王五"
              rows={5}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              创建
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
            max-width: 440px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
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
            min-height: 100px;
            font-family: inherit;
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
