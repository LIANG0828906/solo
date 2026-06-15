import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, FileText, User } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>故事板不存在或链接已失效</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200 text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const days = getDaysSince(storyboard.createdAt);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${storyboard.gradientFrom}, ${storyboard.gradientTo})`,
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <h1
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Poppins, Noto Sans SC, sans-serif' }}
          >
            {storyboard.title}
          </h1>
          <p className="text-white/70 text-sm mb-4 font-light" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            {storyboard.description || '暂无描述'}
          </p>
          <div className="flex items-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1"><User size={12} />{storyboard.authorNickname}</span>
            <span className="flex items-center gap-1"><Calendar size={12} />创建于 {days} 天前</span>
            <span className="flex items-center gap-1"><FileText size={12} />{materials.length} 个素材</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 w-fit">
          <button
            onClick={() => setViewMode('free')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
              viewMode === 'free' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            自由排列
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all duration-200 ${
              viewMode === 'timeline' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            时间轴
          </button>
        </div>
      </div>

      {viewMode === 'free' ? (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FileText size={40} className="mb-3 opacity-20" />
              <p className="text-sm">暂无素材</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {materials.map((mat) => (
                <div key={mat.id} className="break-inside-avoid group relative rounded-xl overflow-hidden bg-[#1a1a2e] shadow-lg">
                  <img src={mat.imageUrl} alt="" className="w-full object-cover aspect-[4/3]" />
                  {mat.note && (
                    <div className="px-3 py-2 bg-[#1a1a2e] border-t border-white/5">
                      <p className="text-xs text-gray-400 line-clamp-2">{mat.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <TimelineView
            materials={materials}
            onSelectMaterial={() => {}}
            selectedId={null}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
