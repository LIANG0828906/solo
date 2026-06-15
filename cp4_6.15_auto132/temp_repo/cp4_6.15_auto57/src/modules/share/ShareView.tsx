import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, FileText, User, Eye, Share2 } from 'lucide-react';
import { useStoryboardStore } from '@/store/useStoryboardStore';
import { getDaysSince } from '@/utils/helpers';
import TimelineView from '@/modules/timeline/TimelineView';
import { useState } from 'react';

export default function ShareView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { getStoryboardByShareCode, getMaterialsByStoryboard } = useStoryboardStore();
  const [viewMode, setViewMode] = useState<'free' | 'timeline'>('free');

  const storyboard = getStoryboardByShareCode(code || '');
  const materials = storyboard ? getMaterialsByStoryboard(storyboard.id) : [];

  if (!storyboard) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={30} className="text-purple-400 opacity-70" />
          </div>
          <p className="text-gray-400 text-base mb-2" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            故事板不存在或链接已失效
          </p>
          <p className="text-gray-600 text-xs mb-6">可能分享码已过期或被删除</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm font-medium"
          >
            <ArrowLeft size={15} />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const days = getDaysSince(storyboard.createdAt);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 text-purple-300/80">
              <Eye size={14} />
              <span className="text-xs font-medium shrink-0">只读分享视图</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all shrink-0"
            title="复制链接"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${storyboard.gradientFrom}, ${storyboard.gradientTo})`,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs">
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${storyboard.gradientFrom}cc` }}
              >
                <User size={11} />
              </div>
              <span className="font-medium truncate" style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>
                {storyboard.authorNickname || '匿名创作者'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs">
              <Calendar size={11} />
              <span>创建于 {days} 天前</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs">
              <FileText size={11} />
              <span>{materials.length} 张素材</span>
            </div>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight"
            style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
          >
            {storyboard.title}
          </h1>
          {storyboard.description && (
            <p className="text-white/75 text-sm sm:text-base max-w-2xl font-light leading-relaxed" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
              {storyboard.description}
            </p>
          )}

          <div className="mt-6 sm:mt-8 flex items-center gap-2">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('free')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                  viewMode === 'free' ? 'bg-white text-[#667eea] shadow-md font-medium' : 'text-white/80 hover:text-white'
                }`}
              >
                <FileText size={13} />
                自由视图
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                  viewMode === 'timeline' ? 'bg-white text-[#667eea] shadow-md font-medium' : 'text-white/80 hover:text-white'
                }`}
              >
                <Calendar size={13} />
                时间轴
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        {viewMode === 'free' ? (
          materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                <FileText size={24} className="text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">故事板暂无素材</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="group relative rounded-2xl overflow-hidden bg-[#1a1a2e] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative w-full overflow-hidden">
                    <img
                      src={mat.imageUrl}
                      alt=""
                      className="w-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  {mat.note && (
                    <div className="px-4 py-3 bg-gradient-to-b from-[#1a1a2e] to-[#141424] border-t border-white/5">
                      <p className="text-xs text-gray-400 line-clamp-2 font-light leading-relaxed">
                        {mat.note}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <TimelineView
            materials={materials}
            onSelectMaterial={() => {}}
            selectedId={null}
            readOnly
          />
        )}
      </main>

      <footer className="border-t border-white/5 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-300/50 text-xs mb-2">
            <BookOpen size={13} />
            <span style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}>Storyboard Studio</span>
          </div>
          <p className="text-gray-600 text-[10px]">
            用视觉化方式整理灵感 · 让创作更自由
          </p>
        </div>
      </footer>
    </div>
  );
}
