import { useState, useEffect, useRef } from 'react';
import { X, Send, Coffee } from 'lucide-react';
import type { FlavorNote } from '@/shared/types';
import { getUserById } from '@/modules/backend/data/cafeData';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './NoteModal.css';

interface NoteModalProps {
  isOpen: boolean;
  blendName: string;
  blendId: string;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  mode: 'submit' | 'view';
  notes?: FlavorNote[];
}

export function NoteModal({
  isOpen,
  blendName,
  onClose,
  onSubmit,
  mode = 'submit',
  notes = [],
}: NoteModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && mode === 'submit' && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'view' && notes.length > 0) {
      const uniqueUserIds = [...new Set(notes.map((note) => note.userId))];
      uniqueUserIds.forEach(async (userId) => {
        const user = await getUserById(userId);
        if (user) {
          setUserNames((prev) => ({ ...prev, [userId]: user.nickname }));
        }
      });
    }
  }, [notes, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onClose();
    } catch (error) {
      console.error('提交笔记失败', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div className="modal-content note-modal" ref={contentRef}>
        <div className="note-modal-header">
          <div className="note-modal-title-row">
            <Coffee className="note-modal-icon" size={24} />
            <h3 className="note-modal-title">
              {mode === 'submit' ? '分享你的风味感受' : '风味笔记'}
            </h3>
          </div>
          <button className="note-modal-close" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="note-modal-blend-name">{blendName}</div>

        {mode === 'submit' ? (
          <form className="note-modal-form" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="note-modal-textarea"
              placeholder="说说你对这款拼配的感受吧～ 比如酸度、醇厚度、风味特点..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="note-modal-footer">
              <span className="char-count">{content.length}/500</span>
              <button
                type="submit"
                className="btn btn-primary note-submit-btn"
                disabled={!content.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>提交笔记</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="note-list">
            {notes.length === 0 ? (
              <div className="note-list-empty">
                <Coffee size={40} className="empty-icon" />
                <p>暂无风味笔记</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-item-header">
                    <span className="note-user">
                      {userNames[note.userId] || '匿名用户'}
                    </span>
                    <span className="note-time">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                  <p className="note-content">{note.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
