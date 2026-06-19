import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useNoteStore } from '@/store';
import { getTagColor, getRelativeTime } from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notes = useNoteStore((s) => s.notes);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const note = notes.find((n) => n.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!note) {
    return (
      <div className="detail-not-found">
        <p>笔记未找到</p>
        <button className="detail-back-btn" onClick={() => navigate('/')}>
          返回主页
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteNote(note.id);
    navigate('/');
  };

  return (
    <div className="detail-page">
      <div className="detail-top-bar">
        <button className="detail-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
        <div className="detail-actions">
          <button
            className="detail-action-btn detail-edit-btn"
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={16} />
            <span>编辑</span>
          </button>
          <button
            className="detail-action-btn detail-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            <span>删除</span>
          </button>
        </div>
      </div>

      <div className="detail-content-wrapper">
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

      {showDeleteConfirm && (
        <div className="editor-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除这条笔记吗？</p>
            <div className="confirm-actions">
              <button
                className="editor-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete}>
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
    </div>
  );
}
