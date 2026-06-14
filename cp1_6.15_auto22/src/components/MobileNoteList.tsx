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
    setTimeout(() => setVoteAnimatingId(null), 400);
  };

  const colorFilters: { color: ColorFilter; label: string; icon: string }[] = [
    { color: 'all', label: '全部', icon: '📋' },
    { color: 'red', label: '问题', icon: '❓' },
    { color: 'green', label: '方案', icon: '💡' },
    { color: 'blue', label: '行动', icon: '✅' },
    { color: 'yellow', label: '其他', icon: '📌' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F0] pt-16 pb-24">
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {colorFilters.map(({ color, label, icon }) => (
            <button
              key={color}
              onClick={() => onColorFilterChange(color)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                colorFilter === color
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-6xl">📝</span>
            </div>
            <p className="text-lg font-medium text-gray-600 mb-2">还没有便签</p>
            <p className="text-sm text-gray-400">点击右下角 + 按钮添加第一个便签</p>
          </div>
        ) : (
          filteredNotes.map((note, index) => {
            const hasVoted = note.votes.includes(currentUser.id);
            const isEditing = editingId === note.id;
            const bgColor = NOTE_COLORS[note.color];
            const borderColor = NOTE_BORDER_COLORS[note.color];

            return (
              <div
                key={note.id}
                className="rounded-2xl shadow-md p-4 transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: bgColor,
                  borderLeft: `5px solid ${borderColor}`,
                  animation: `bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`,
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-28 p-3 rounded-xl border-2 border-blue-300 bg-white/90 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {note.content || <span className="text-gray-400 italic">(空便签)</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <UserAvatar
                      user={{
                        id: note.authorId,
                        name: note.authorName,
                        avatar: note.authorAvatar,
                        color: borderColor,
                      }}
                      size="sm"
                      showTooltip={true}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
                  <button
                    onClick={() => handleVote(note.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                      hasVoted
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                        : 'bg-white/70 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <ThumbsUp
                      size={16}
                      className={`${hasVoted ? 'fill-current' : ''} transition-transform duration-200 ${
                        voteAnimatingId === note.id ? 'scale-125' : ''
                      }`}
                    />
                    <span
                      className={`text-sm font-bold inline-block ${
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
                        className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md active:scale-95 transition-transform"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2.5 rounded-xl bg-gray-400 text-white shadow-md active:scale-95 transition-transform"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-2.5 rounded-xl bg-white/70 text-gray-600 hover:bg-white shadow-sm active:scale-95 transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      {note.authorId === currentUser.id && (
                        <button
                          onClick={() => {
                            if (window.confirm('确定要删除这张便签吗？')) {
                              onDeleteNote(note.id);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-white/70 text-gray-600 hover:bg-red-500 hover:text-white shadow-sm active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{note.authorName}</span>
                  <span>{new Date(note.createdAt).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-t-[2rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{
              animation: 'bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-14 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif-sc text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span>✨</span>
                  添加便签
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-600 mb-3">
                  🎨 选择便签类型
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['red', 'green', 'blue', 'yellow'] as const).map((color) => {
                    const labels: Record<string, string> = {
                      red: '问题',
                      green: '方案',
                      blue: '行动',
                      yellow: '其他',
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setNewNoteColor(color)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-3 transition-all duration-200 ${
                          newNoteColor === color
                            ? 'scale-105 shadow-lg ring-4 ring-blue-200'
                            : 'opacity-80 hover:opacity-100 hover:scale-102'
                        }`}
                        style={{
                          backgroundColor: NOTE_COLORS[color],
                          borderColor:
                            newNoteColor === color ? NOTE_BORDER_COLORS[color] : 'transparent',
                          borderWidth: '3px',
                        }}
                      >
                        <span className="w-6 h-6 rounded-full shadow-inner"
                          style={{ backgroundColor: NOTE_BORDER_COLORS[color] }}
                        />
                        <span className="text-xs font-semibold text-gray-700">
                          {labels[color]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  📝 便签内容
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="在这里写下你的想法..."
                  className="w-full h-40 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-base resize-none focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                  style={{
                    backgroundColor: newNoteContent ? NOTE_COLORS[newNoteColor] : '#F9FAFB',
                  }}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className={`flex-1 py-3.5 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    newNoteContent.trim()
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl active:scale-98'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={20} />
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
