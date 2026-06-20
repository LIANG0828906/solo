import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, X, BookOpen } from 'lucide-react';
import { useStoryboardStore } from '@/store/useStoryboardStore';
import { getDaysSince } from '@/utils/helpers';

export default function StoryboardList() {
  const navigate = useNavigate();
  const { storyboards, materials, addStoryboard, deleteStoryboard } = useStoryboardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    const sb = addStoryboard(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setShowCreate(false);
    navigate(`/storyboard/${sb.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-6 py-10 md:py-16">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={32} className="text-white/90" />
            <h1
              className="text-3xl md:text-4xl font-bold text-white tracking-tight"
              style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
            >
              Storyboard Studio
            </h1>
          </div>
          <p className="text-white/70 text-base md:text-lg font-light max-w-xl" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            创建个性化数字故事板，以视觉化方式整理灵感素材
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-[#667eea] transition-all duration-200 backdrop-blur-sm text-sm font-medium"
            style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
          >
            <Plus size={18} />
            创建故事板
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {storyboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <LayoutGrid size={56} className="mb-4 opacity-20" />
            <p className="text-lg font-light" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>还没有故事板</p>
            <p className="text-sm text-gray-600 mt-1">点击上方按钮创建你的第一个故事板</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyboards.map((sb) => {
              const count = materials.filter((m) => m.storyboardId === sb.id).length;
              const days = getDaysSince(sb.createdAt);
              return (
                <div
                  key={sb.id}
                  className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
                  onClick={() => navigate(`/storyboard/${sb.id}`)}
                >
                  <div
                    className="aspect-[16/10] p-6 flex flex-col justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${sb.gradientFrom}, ${sb.gradientTo})`,
                    }}
                  >
                    <div>
                      <h3
                        className="text-xl font-semibold text-white mb-2 line-clamp-2"
                        style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
                      >
                        {sb.title}
                      </h3>
                      <p className="text-white/70 text-sm line-clamp-2 font-light" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
                        {sb.description || '暂无描述'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-white/60 text-xs">
                        {count} 个素材 · {days} 天前创建
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteStoryboard(sb.id); }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-red-500/80 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="删除故事板"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowCreate(false)}>
          <div
            className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>
                创建故事板
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1.5" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>标题</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入故事板标题..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0f1a] text-white border border-white/10 focus:border-purple-500/50 focus:outline-none transition-colors text-sm placeholder:text-gray-600"
                  style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述一下这个故事板..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0f1a] text-white border border-white/10 focus:border-purple-500/50 focus:outline-none transition-colors text-sm resize-none placeholder:text-gray-600"
                  style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
              >
                创建并进入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
