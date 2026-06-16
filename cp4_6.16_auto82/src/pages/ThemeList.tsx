import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, FileText, Clock } from 'lucide-react';
import { useStore } from '@/store';

export default function ThemeList() {
  const themes = useStore(s => s.themes);
  const works = useStore(s => s.works);
  const addTheme = useStore(s => s.addTheme);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });

  const getWorkCount = (themeId: string) => works.filter(w => w.themeId === themeId).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    addTheme(form.title.trim(), form.description.trim(), form.startDate, form.endDate);
    setForm({ title: '', description: '', startDate: '', endDate: '' });
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-sans text-bark">每周主题</h1>
          <p className="text-bark-muted text-sm font-sans mt-1">围绕主题提交原创作品，匿名互评，评选最佳</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建主题
        </button>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-bark-muted/40 mx-auto mb-4" />
          <p className="text-bark-muted font-sans">还没有主题，点击上方按钮创建第一个</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {themes.map((theme, idx) => (
            <div
              key={theme.id}
              className="theme-card animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={() => navigate(`/theme/${theme.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-sans font-bold text-bark text-base leading-tight">{theme.title}</h3>
                <span className={`text-xs font-sans px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  theme.status === 'open'
                    ? 'bg-ink/10 text-ink'
                    : 'bg-bark-muted/10 text-bark-muted'
                }`}>
                  {theme.status === 'open' ? '进行中' : '已截止'}
                </span>
              </div>

              {theme.description && (
                <p className="text-sm text-bark-muted font-serif line-clamp-2 mb-3" style={{ textIndent: 0 }}>
                  {theme.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-bark-muted font-sans">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(theme.startDate)} - {formatDate(theme.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {getWorkCount(theme.id)} 篇
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-parchment-light rounded-xl p-6 w-full max-w-md shadow-xl border border-parchment-dark/30 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-sans font-bold text-lg text-bark mb-5">创建新主题</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-bark-light mb-1">主题标题</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：秋日诗会"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-sans text-bark-light mb-1">主题描述</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="简要描述本期主题..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-sans text-bark-light mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans text-bark-light mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    截止日期
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.startDate || !form.endDate}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
