import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { usePodcastStore, type ProgramStatus } from '@/store';
import ConfirmDialog, { useConfirmDialog } from '@/components/ConfirmDialog';

const STATUS_CONFIG: Record<ProgramStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#94a3b8', bg: 'bg-statusDraft' },
  recording: { label: '录制中', color: '#3b82f6', bg: 'bg-statusRecording' },
  editing: { label: '剪辑中', color: '#f59e0b', bg: 'bg-statusEditing' },
  published: { label: '发布', color: '#22c55e', bg: 'bg-statusPublished' },
};

export default function ProgramBoard() {
  const { programs, addProgram, deleteProgram, updateProgram } = usePodcastStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { dialogState, confirm, cancel } = useConfirmDialog();

  const [form, setForm] = useState({
    title: '',
    description: '',
    recordDate: '',
    status: 'draft' as ProgramStatus,
    publishDate: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ title: '', description: '', recordDate: '', status: 'draft', publishDate: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editId) {
      updateProgram(editId, { ...form });
    } else {
      addProgram({ ...form });
    }
    resetForm();
  };

  const handleEdit = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    const program = programs.find((p) => p.id === programId);
    if (!program) return;
    setForm({
      title: program.title,
      description: program.description,
      recordDate: program.recordDate,
      status: program.status,
      publishDate: program.publishDate,
      notes: program.notes,
    });
    setEditId(programId);
    setShowForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    await confirm('删除节目', '确定要删除这个节目吗？此操作不可撤销。');
    deleteProgram(programId);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">节目管理</h1>
          <p className="text-sm text-slate-400 mt-1">管理你的播客节目与制作进度</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新建节目
        </button>
      </div>

      {programs.length === 0 && (
        <div className="card-base text-center py-16">
          <div className="text-6xl mb-4">🎙️</div>
          <h3 className="font-display font-semibold text-lg text-slate-600 mb-2">还没有节目</h3>
          <p className="text-sm text-slate-400 mb-4">点击上方按钮创建你的第一个播客节目</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {programs.map((program) => {
          const statusCfg = STATUS_CONFIG[program.status];
          return (
            <div
              key={program.id}
              onClick={() => navigate(`/program/${program.id}`)}
              className="card-base cursor-pointer group relative transition-shadow hover:shadow-md animate-fade-in"
            >
              <div
                className="absolute top-4 left-4 w-3 h-3 rounded-full"
                style={{ backgroundColor: statusCfg.color }}
                title={statusCfg.label}
              />

              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleEdit(e, program.id)}
                  className="btn-press p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, program.id)}
                  className="btn-press p-1.5 rounded-md bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="pt-6">
                <h3 className="font-display font-semibold text-base text-slate-800 mb-1 pr-16 line-clamp-1">
                  {program.title}
                </h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                  {program.description || '暂无描述'}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${statusCfg.color}15`,
                      color: statusCfg.color,
                    }}
                  >
                    {statusCfg.label}
                  </span>
                  {program.recordDate && (
                    <span className="text-[11px] text-slate-300">
                      {program.recordDate}
                    </span>
                  )}
                </div>

                {program.guestIds.length > 0 && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-50">
                    <span className="text-[11px] text-slate-300">
                      {program.guestIds.length} 位嘉宾
                    </span>
                    {program.annotations.length > 0 && (
                      <span className="text-[11px] text-slate-300 ml-auto">
                        {program.annotations.length} 个标注
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(showForm || editId) && (
        <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-md w-full space-y-4">
            <h3 className="font-display font-semibold text-lg text-slate-800">
              {editId ? '编辑节目' : '新建节目'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">节目标题 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">录制日期</label>
                  <input
                    type="date"
                    value={form.recordDate}
                    onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProgramStatus })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent bg-white"
                  >
                    <option value="draft">草稿</option>
                    <option value="recording">录制中</option>
                    <option value="editing">剪辑中</option>
                    <option value="published">发布</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">发布日期</label>
                <input
                  type="date"
                  value={form.publishDate}
                  onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-accent resize-none"
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
