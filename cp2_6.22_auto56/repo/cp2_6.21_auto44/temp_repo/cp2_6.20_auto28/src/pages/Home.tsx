import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/store';
import { storyApi } from '@/services/api';
import { FileText, Plus, ArrowRight, Sparkles, Users, Link2, Play } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const store = useEditorStore();
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const title = storyTitle.trim() || `未命名故事 ${Date.now()}`;
    setIsCreating(true);
    try {
      const result = await storyApi.createStory({ title, description: storyDesc });
      store.setStory(result.id, result.title);
      setTimeout(() => {
        navigate(`/story/${result.id}`);
      }, 300);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDemo = () => {
    navigate(`/story/story-1`);
  };

  return (
    <div className="h-full w-full overflow-auto bg-[#1a1a2e]">
      <div
        className="relative min-h-full"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 20%, rgba(233, 69, 96, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(15, 52, 96, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 30%, rgba(245, 193, 108, 0.05) 0%, transparent 40%)
          `,
        }}
      >
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0f3460]/40 border border-[#e94560]/20 mb-6">
              <Sparkles size={12} className="text-[#f5c16c]" />
              <span className="text-[11px] font-medium text-slate-300">多人实时协作叙事创作平台</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
              NarrativeForge
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-2 font-light">
              分支剧情编辑器 · 角色关系图谱 · 剧情模拟器
            </p>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              为编剧团队打造的非线性故事创作协作平台，实时同步剧情线，直观管理角色关系，一键测试分支逻辑
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-[#16213e]/60 backdrop-blur-sm rounded-2xl p-6 card-shadow border border-white/5 animate-float-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
                  <Plus size={18} className="text-[#e94560]" />
                </div>
                <h2 className="font-display font-bold text-white text-lg">创建新故事</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">故事名称</label>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="输入故事名称..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#1a1a2e] border border-white/10 text-white placeholder-slate-600 focus:border-[#e94560] outline-none transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">故事简介（可选）</label>
                  <textarea
                    value={storyDesc}
                    onChange={(e) => setStoryDesc(e.target.value)}
                    placeholder="简要描述故事背景..."
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#1a1a2e] border border-white/10 text-white placeholder-slate-600 focus:border-[#e94560] outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#e94560] to-[#c73650] text-white hover:shadow-lg hover:shadow-[#e94560]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      创建故事
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-[#16213e]/60 backdrop-blur-sm rounded-2xl p-6 card-shadow border border-white/5 animate-float-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f5c16c]/15 flex items-center justify-center">
                  <FileText size={18} className="text-[#f5c16c]" />
                </div>
                <h2 className="font-display font-bold text-white text-lg">快速开始</h2>
              </div>

              <div className="space-y-3 mb-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#0f3460]/40 to-[#16213e] border border-[#f5c16c]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f5c16c]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={18} className="text-[#f5c16c]" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white text-sm mb-1">迷雾古堡</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        一个神秘悬疑的互动叙事示例，包含 4 个剧情节点、3 条分支线、4 个角色与复杂的关系网络
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenDemo}
                className="w-full py-3 rounded-xl text-sm font-bold btn-gradient text-white flex items-center justify-center gap-2 group"
              >
                打开示例故事
                <Play size={16} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {[
              {
                icon: FileText,
                color: '#e94560',
                title: '分支剧情编辑器',
                desc: '可视化节点编辑器，拖拽创建节点和连线，支持分支触发条件配置和实时协同编辑',
              },
              {
                icon: Link2,
                color: '#4ade80',
                title: '角色关系图谱',
                desc: '力导向图可视化角色网络，盟友/敌对/恋人/未知关系类型，点击查看角色详情',
              },
              {
                icon: Play,
                color: '#f5c16c',
                title: '剧情模拟器',
                desc: '手动或自动推进剧情，高亮显示路径，生成关键选择摘要卡片和版本快照',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="group p-5 rounded-xl bg-[#16213e]/30 border border-white/5 hover:border-white/10 hover:bg-[#16213e]/50 transition-all animate-float-up"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${f.color}15` }}
                >
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-8 text-[10px] text-slate-600 pb-8">
            <div className="flex items-center gap-1.5">
              <Users size={11} />
              <span>WebSocket 实时同步</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={11} />
              <span>完整版本历史</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>流畅 60fps 交互</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
