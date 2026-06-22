import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { usePodcastStore } from '@/store';
import ConfirmDialog, { useConfirmDialog } from '@/components/ConfirmDialog';

export default function GuestManager() {
  const { guests, programs, addGuest, updateGuest, deleteGuest } = usePodcastStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { dialogState, confirm, cancel } = useConfirmDialog();

  const [form, setForm] = useState({
    name: '',
    bio: '',
    avatarUrl: '' as string | null,
    rating: 0,
  });

  const resetForm = () => {
    setForm({ name: '', bio: '', avatarUrl: null, rating: 0 });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) {
      updateGuest(editId, { ...form });
    } else {
      addGuest({ ...form, color: '' });
    }
    resetForm();
  };

  const handleEdit = (e: React.MouseEvent, guestId: string) => {
    e.stopPropagation();
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    setForm({
      name: guest.name,
      bio: guest.bio,
      avatarUrl: guest.avatarUrl,
      rating: guest.rating,
    });
    setEditId(guestId);
    setShowForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, guestId: string) => {
    e.stopPropagation();
    await confirm('删除嘉宾', '确定要删除这位嘉宾吗？关联的节目将解除关联。');
    deleteGuest(guestId);
  };

  const getProgramCount = (guestId: string) => {
    return programs.filter((p) => p.guestIds.includes(guestId)).length;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">嘉宾管理</h1>
          <p className="text-sm text-slate-400 mt-1">管理播客嘉宾信息与关联节目</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新建嘉宾
        </button>
      </div>

      {guests.length === 0 && (
        <div className="card-base text-center py-16">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="font-display font-semibold text-lg text-slate-600 mb-2">还没有嘉宾</h3>
          <p className="text-sm text-slate-400 mb-4">点击上方按钮添加你的第一位播客嘉宾</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {guests.map((guest) => {
          const programCount = getProgramCount(guest.id);
          return (
            <div
              key={guest.id}
              onClick={() => navigate(`/guest/${guest.id}`)}
              className="card-base cursor-pointer group relative transition-shadow hover:shadow-md animate-fade-in"
            >
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleEdit(e, guest.id)}
                  className="btn-press p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, guest.id)}
                  className="btn-press p-1.5 rounded-md bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center pt-2">
                {guest.avatarUrl ? (
                  <img
                    src={guest.avatarUrl}
                    alt={guest.name}
                    className="w-16 h-16 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3"
                    style={{ backgroundColor: guest.color }}
                  >
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="font-display font-semibold text-base text-slate-800 mb-1">
                  {guest.name}
                </h3>
                {guest.bio && (
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{guest.bio}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span>{programCount} 期节目</span>
                  {guest.rating > 0 && <span>评分 {guest.rating}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(showForm || editId) && (
        <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-md w-full space-y-4">
            <h3 className="font-display font-semibold text-lg text-slate-800">
              {editId ? '编辑嘉宾' : '新建嘉宾'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">简介</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">头像</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-600"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setForm({ ...form, avatarUrl: url });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">评分 (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-press px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
                >
                  {editId ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={cancel}
      />
    </div>
  );
}
