import { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import useVaultStore from '@/store/VaultStore';
import type { Category } from '@/modules/storage/DataStore';
import { generateRandomPassword } from '@/modules/crypto/CryptoService';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'social', label: '社交' },
  { value: 'finance', label: '金融' },
  { value: 'work', label: '工作' },
  { value: 'other', label: '其他' },
];

export default function AddEntryPanel() {
  const isAddPanelOpen = useVaultStore((s) => s.isAddPanelOpen);
  const editingEntry = useVaultStore((s) => s.editingEntry);
  const addEntry = useVaultStore((s) => s.addEntry);
  const updateEntry = useVaultStore((s) => s.updateEntry);
  const closeAddPanel = useVaultStore((s) => s.closeAddPanel);
  const setEditingEntry = useVaultStore((s) => s.setEditingEntry);

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<Category>('social');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = editingEntry !== null;

  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setUsername(editingEntry.username);
      setPassword(editingEntry.password);
      setCategory(editingEntry.category);
      setNotes(editingEntry.notes);
    } else {
      setTitle('');
      setUsername('');
      setPassword(generateRandomPassword());
      setCategory('social');
      setNotes('');
    }
  }, [editingEntry]);

  function handleClose() {
    closeAddPanel();
    setEditingEntry(null);
  }

  function handleRegeneratePassword() {
    setPassword(generateRandomPassword());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && editingEntry) {
      updateEntry({
        id: editingEntry.id,
        title: title.trim(),
        username: username.trim(),
        password,
        category,
        notes,
        createdAt: editingEntry.createdAt,
        updatedAt: editingEntry.updatedAt,
      });
    } else {
      addEntry({
        title: title.trim(),
        username: username.trim(),
        password,
        category,
        notes,
      });
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isAddPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a] border-t border-[rgba(255,255,255,0.1)] rounded-t-2xl p-6 transform transition-transform duration-300 ${
          isAddPanelOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold">
            {isEditing ? '编辑条目' : '新建条目'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-all duration-200 pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">分类</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-all duration-200 appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-[#0f172a]">
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-all duration-200 min-h-[80px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#38bdf8] to-[#818cf8] hover:opacity-90 transition-all duration-200 disabled:opacity-40"
          >
            {isEditing ? '保存修改' : '添加条目'}
          </button>
        </form>
      </div>
    </>
  );
}
