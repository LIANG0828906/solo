import React, { useState } from 'react';
import { Plus, ThumbsUp, Pencil, Trash2, X, Check } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { NOTE_COLORS, NOTE_BORDER_COLORS } from '../utils/types';
import type { Note, User, ColorFilter } from '../utils/types';

interface MobileNoteListProps {
  notes: Note[];
  currentUser: User;
  colorFilter: ColorFilter;
  onColorFilterChange: (filter: ColorFilter) => void;
  onAddNote: (color: Note['color'], content: string) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onVoteNote: (noteId: string) => void;
}

export const MobileNoteList: React.FC<MobileNoteListProps> = ({
  notes,
  currentUser,
  colorFilter,
  onColorFilterChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onVoteNote,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<Note['color']>('yellow');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [voteAnimatingId, setVoteAnimatingId] = useState<string | null>(null);

  const filteredNotes = notes
    .filter(n => colorFilter === 'all' || n.color === colorFilter)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(newNoteColor, newNoteContent.trim());
      setNewNoteContent('');
      setShowAddModal(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (editContent.trim()) {
      onUpdateNote(noteId, { content: editContent.trim() });
    }
    setEditingId(null);
  };

  const handleVote = (noteId: string) => {
    onVoteNote(noteId);
    setVoteAnimatingId(noteId);
    setTimeout(() => setVoteAnimatingId(null), 300);
  };

  const colorFilters: { color: ColorFilter; label: string }[] = [
    { color: 'all', label: '全部' },
    { color: 'red', label: '问题' },
    { color: 'green', label: '方案' },
    { color: 'blue', label: '行动项' },
    { color: 'yellow', label: '其他' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F0] pt-16 pb-24">
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {colorFilters.map(({ color, label }) => (
            <button
              key={color}
              onClick={() => onColorFilterChange(color)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                colorFilter === color
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">📝</span>
            <p className="text-gray-500">还没有便签</p>
            <p className="text-sm text-gray-400 mt-1">点击右下角按钮添加第一个便签</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const hasVoted = note.votes.includes(currentUser.id);
            const isEditing = editingId === note.id;
            const bgColor = NOTE_COLORS[note.color];
            const borderColor = NOTE_BORDER_COLORS[note.color];

            return (
              <div
                key={note.id}
                className="rounded-xl shadow-md p-4 transition-all"
                style={{ backgroundColor: bgColor, borderLeft: `4px solid ${borderColor}` }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-24 p-2 rounded-lg border border-gray-300 bg-white/80 text-sm resize-none focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                  </div>
                  <UserAvatar
                    user={{
                      id: note.authorId,
                      name: note.authorName,
                      avatar: note.authorAvatar,
                      color: '#FFFFFF',
                    }}
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50">
                  <button
                    onClick={() => handleVote(note.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      hasVoted ? 'bg-blue-500 text-white' : 'bg-white/50 text-gray-600'
                    }`}
                  >
                    <ThumbsUp size={16} className={hasVoted ? 'fill-current' : ''} />
                    <span
                      className={`text-sm font-semibold ${
                        voteAnimatingId === note.id ? 'vote-bounce' : ''
                      }`}
                    >
                      {note.votes.length}
                    </span>
                  </button>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="p-2 rounded-lg bg-green-500 text-white"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-lg bg-gray-400 text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-2 rounded-lg bg-white/50 text-gray-600 hover:bg-white/80"
                      >
                        <Pencil size={16} />
                      </button>
                      {note.authorId === currentUser.id && (
                        <button
                          onClick={() => {
                            if (confirm('确定要删除这张便签吗？')) {
                              onDeleteNote(note.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-white/50 text-gray-600 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {note.authorName} · {new Date(note.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-3xl z-50"
      >
        <Plus size={28} />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              
              <h3 className="font-serif-sc text-xl font-bold text-gray-800 mb-4">添加便签</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">选择颜色</label>
                <div className="flex gap-2">
                  {(['red', 'green', 'blue', 'yellow'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNoteColor(color)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        newNoteColor === color ? 'scale-110 ring-2 ring-blue