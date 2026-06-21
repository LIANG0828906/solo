import { useState } from 'react';
import { Plus, Layout } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';

export default function BoardList() {
  const { boards, currentBoardId, selectBoard, addBoard } = useBoardStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await addBoard({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-[280px] min-w-[280px] bg-slate-800 text-white h-screen overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Layout size={20} />
          <h2 className="font-semibold text-lg">看板列表</h2>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => selectBoard(board.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                currentBoardId === board.id
                  ? 'bg-slate-700 border-l-4 border-blue-500'
                  : 'hover:bg-slate-700/50'
              }`}
            >
              <div className="font-medium text-sm truncate">{board.name}</div>
              <div className="text-xs text-slate-400 truncate mt-0.5">{board.description}</div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-slate-700">
          {showForm ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="看板名称"
                className="w-full px-2 py-1.5 rounded bg-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={30}
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="看板描述"
                className="w-full px-2 py-1.5 rounded bg-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={100}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-1.5 bg-blue-500 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-1.5 bg-slate-600 rounded text-xs hover:bg-slate-500 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-700 rounded text-sm hover:bg-slate-600 transition-colors"
            >
              <Plus size={16} />
              新建看板
            </button>
          )}
        </div>
      </aside>

      <nav className="md:hidden flex overflow-x-auto bg-slate-800 text-white custom-scrollbar">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => selectBoard(board.id)}
            className={`shrink-0 px-4 py-2.5 text-sm transition-colors ${
              currentBoardId === board.id
                ? 'border-b-2 border-blue-500 text-blue-400 font-medium'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {board.name}
          </button>
        ))}
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 px-3 py-2.5 text-slate-400 hover:text-white"
        >
          <Plus size={18} />
        </button>
      </nav>

      {showForm && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-lg p-4 w-full max-w-sm space-y-3">
            <h3 className="text-white font-medium">新建看板</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="看板名称"
              className="w-full px-3 py-2 rounded bg-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={30}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="看板描述"
              className="w-full px-3 py-2 rounded bg-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={100}
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-500 rounded text-sm font-medium hover:bg-blue-600 transition-colors">
                创建
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-600 rounded text-sm hover:bg-slate-500 transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
