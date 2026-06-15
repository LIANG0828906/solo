import { useState } from 'react';
import {
  FileText, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X, Check,
} from 'lucide-react';
import { useDocStore } from '../store/useDocStore';
import { useSocket } from '../hooks/useSocket';

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const documents = useDocStore((s) => s.documents);
  const activeDocId = useDocStore((s) => s.activeDocId);
  const setActiveDocId = useDocStore((s) => s.setActiveDocId);
  const { getSocket } = useSocket();

  const handleSelect = (docId: string) => {
    setActiveDocId(docId);
    const socket = getSocket();
    if (socket) {
      if (activeDocId) socket.emit('leave-document', { docId: activeDocId });
      socket.emit('join-document', { docId });
    }
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      setCreating(false);
      return;
    }
    const socket = getSocket();
    if (socket) {
      socket.emit('create-document', { title: newTitle.trim() });
    }
    setNewTitle('');
    setCreating(false);
  };

  const handleRename = (docId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    const socket = getSocket();
    if (socket) {
      socket.emit('rename-document', { docId, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = (docId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('delete-document', { docId });
      if (activeDocId === docId) {
        setActiveDocId(null);
      }
    }
  };

  const startEditing = (docId: string, title: string) => {
    setEditingId(docId);
    setEditTitle(title);
  };

  return (
    <>
      <div
        className={`sidebar-transition h-full bg-navy flex flex-col relative ${
          expanded ? 'w-60' : 'w-12'
        }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => {
          setExpanded(false);
          setCreating(false);
          setEditingId(null);
        }}
      >
        <div className="flex items-center justify-between px-3 py-4 min-h-[56px]">
          {expanded ? (
            <>
              <span className="text-white text-sm font-bold tracking-wide">文档</span>
              <button
                onClick={() => setCreating(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          ) : (
            <FileText className="w-5 h-5 text-white/60 mx-auto" />
          )}
        </div>

        {expanded && (
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {creating && (
              <div className="mb-1 p-2 bg-white/5 rounded-lg">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="文档标题"
                  className="w-full px-2 py-1.5 text-sm bg-white/10 text-white placeholder:text-white/40 rounded border border-white/10 focus:outline-none focus:border-emerald"
                  autoFocus
                />
                <div className="flex gap-1 mt-1.5">
                  <button
                    onClick={handleCreate}
                    className="px-2 py-1 text-xs bg-emerald text-white rounded hover:bg-emerald-600 transition-colors"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewTitle(''); }}
                    className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`group mb-0.5 rounded-lg transition-colors ${
                  activeDocId === doc.id
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                {editingId === doc.id ? (
                  <div className="p-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)}
                      className="w-full px-2 py-1 text-sm bg-white/10 text-white rounded border border-white/20 focus:outline-none focus:border-emerald"
                      autoFocus
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleRename(doc.id)}
                        className="p-1 text-emerald hover:bg-white/10 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-white/60 hover:bg-white/10 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    onClick={() => handleSelect(doc.id)}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate flex-1">{doc.title}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(doc.id, doc.title); }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-1 hover:bg-red-500/20 text-red-300 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {documents.length === 0 && !creating && (
              <div className="text-center py-8 text-white/30 text-sm">
                暂无文档
              </div>
            )}
          </div>
        )}

        <div className="px-2 py-2 border-t border-white/10">
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              收起
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center py-1.5 text-white/40 hover:text-white/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-white/10 z-40">
        <div className="flex items-center overflow-x-auto px-2 py-1 gap-1">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 px-3 py-2 text-white/70 hover:text-white text-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs shrink-0 transition-colors ${
                activeDocId === doc.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span className="max-w-16 truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
