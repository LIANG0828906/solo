import { useState } from 'react';
import type { Note, SortType } from '@/types';
import { BookMarked, X, Clock, FileText, ArrowUpDown } from 'lucide-react';

interface NoteModuleProps {
  notes: Note[];
  onAdd: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  goalId: string;
}

export function NoteModule({ notes, onAdd, onDelete, goalId }: NoteModuleProps) {
  const [sortType, setSortType] = useState<SortType>('page');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({ page: '', highlightText: '', annotation: '' });

  const sortedNotes = [...notes].sort((a, b) => {
    if (sortType === 'page') {
      return a.page - b.page;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddNote = () => {
    if (!newNote.page || !newNote.annotation) return;
    onAdd({
      goalId,
      page: parseInt(newNote.page),
      highlightText: newNote.highlightText,
      annotation: newNote.annotation,
    });
    setNewNote({ page: '', highlightText: '', annotation: '' });
    setShowAddModal(false);
  };

  return (
    <div className="bg-[#FFF8E7] rounded-xl border-2 border-[#A0522D] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#8B4513', fontFamily: "'Noto Serif SC', serif" }}>
          <BookMarked className="w-5 h-5" />
          读书笔记
        </h3>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[#A0522D]/30 hover:bg-[#A0522D]/10 transition-all duration-250"
            style={{ color: '#8B4513' }}
            onClick={() => setSortType(sortType === 'page' ? 'time' : 'page')}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortType === 'page' ? '按页数' : '按时间'}
          </button>
          <button
            className="px-4 py-1.5 text-sm rounded-lg text-white transition-all duration-250 hover:opacity-90"
            style={{ backgroundColor: '#8B4513' }}
            onClick={() => setShowAddModal(true)}
          >
            + 添加笔记
          </button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col gap-2 py-2">
          {sortedNotes.map((note) => (
            <button
              key={note.id}
              className={`relative px-2 py-1 text-xs rounded-r-lg transition-all duration-250 ${
                selectedNote?.id === note.id ? 'w-20' : 'w-16 hover:w-20'
              }`}
              style={{
                backgroundColor: selectedNote?.id === note.id ? '#8B4513' : '#A0522D',
                color: '#FFF8E7',
              }}
              onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
            >
              <span className="whitespace-nowrap">P.{note.page}</span>
            </button>
          ))}
        </div>

        <div className="ml-24">
          {selectedNote ? (
            <div
              className="rounded-xl p-5 border border-[#A0522D]/30"
              style={{
                backgroundColor: 'rgba(139, 69, 19, 0.05)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full text-white" style={{ backgroundColor: '#8B4513' }}>
                    第 {selectedNote.page} 页
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: '#A0522D' }}>
                    <Clock className="w-3 h-3" />
                    {new Date(selectedNote.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <button
                  className="p-1 hover:bg-[#A0522D]/20 rounded transition-all duration-250"
                  onClick={() => onDelete(selectedNote.id)}
                >
                  <X className="w-4 h-4" style={{ color: '#8B4513' }} />
                </button>
              </div>
              {selectedNote.highlightText && (
                <div className="mb-3 p-3 rounded-lg border-l-4 border-[#A0522D] bg-white/50">
                  <p className="text-sm italic" style={{ color: '#8B4513' }}>
                    "{selectedNote.highlightText}"
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#8B4513' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#8B4513' }}>
                  {selectedNote.annotation}
                </p>
              </div>
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: '#A0522D' }}>
              <BookMarked className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">暂无笔记</p>
              <p className="text-xs mt-1 opacity-70">点击左侧标签或添加新笔记</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: '#A0522D' }}>
              <p className="text-sm">点击左侧标签查看笔记详情</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#FFF8E7] rounded-xl border-2 border-[#A0522D] p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold mb-4" style={{ color: '#8B4513', fontFamily: "'Noto Serif SC', serif" }}>
              添加读书笔记
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8B4513' }}>
                  页码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newNote.page}
                  onChange={(e) => setNewNote({ ...newNote, page: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#A0522D]/30 bg-white/80 focus:outline-none focus:border-[#8B4513] transition-all duration-250"
                  placeholder="输入页码"
                  style={{ color: '#8B4513' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8B4513' }}>
                  摘录内容
                </label>
                <textarea
                  value={newNote.highlightText}
                  onChange={(e) => setNewNote({ ...newNote, highlightText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#A0522D]/30 bg-white/80 focus:outline-none focus:border-[#8B4513] transition-all duration-250 resize-none"
                  rows={2}
                  placeholder="摘录书中的内容（可选）"
                  style={{ color: '#8B4513' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#8B4513' }}>
                  批注想法 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newNote.annotation}
                  onChange={(e) => setNewNote({ ...newNote, annotation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#A0522D]/30 bg-white/80 focus:outline-none focus:border-[#8B4513] transition-all duration-250 resize-none"
                  rows={3}
                  placeholder="写下你的想法和感悟"
                  style={{ color: '#8B4513' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg border border-[#A0522D]/30 hover:bg-[#A0522D]/10 transition-all duration-250"
                style={{ color: '#8B4513' }}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="px-6 py-2 rounded-lg text-white transition-all duration-250 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#8B4513' }}
                onClick={handleAddNote}
                disabled={!newNote.page || !newNote.annotation}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
