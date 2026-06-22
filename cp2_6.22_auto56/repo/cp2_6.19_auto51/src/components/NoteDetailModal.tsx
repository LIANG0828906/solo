import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import { Note } from '@/types';
import { useNoteStore } from '@/store';
import { getTagColor, getRelativeTime } from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

export default function NoteDetailModal({ isOpen, onClose, note }: NoteDetailModalProps) {
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (note) deleteNote(note.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !note) return null;

  return (
    <>
      <div className="editor-overlay" onClick={onClose}>
        <div
          className="detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="detail-top-bar detail-modal-topbar">
            <button className="detail-back-btn" onClick={onClose}>
              <ArrowLeft size={18} />
              <span>返回</span>
            </button>
            <div className="detail-actions">
              <button
                type="button"
                className="detail-action-btn detail-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} />
                <span>编辑</span>
              </button>
              <button
                type="button"
                className="detail-action-btn detail-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} />
                <span>删除</span>
              </button>
            </div>
            <button
              type="button"
              className="detail-close-mobile"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>

          <div className="detail-body">
            <div className="detail-content-wrapper detail-modal-content">
              <h1 className="detail-title">{note.title}</h1>
              <div className="detail-meta">
                <div className="detail-tags">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="note-tag-badge"
                      style={{
                        backgroundColor: getTagColor(tag) + '20',
                        color: getTagColor(tag),
                        borderColor: getTagColor(tag) + '40',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="detail-time">{getRelativeTime(note.createdAt)}</span>
              </div>
              <div className="detail-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="editor-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除这条笔记吗？</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="editor-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button type="button" className="confirm-delete-btn" onClick={handleDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <NoteEditor
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        editingNote={note}
      />
    </>
  );
}
