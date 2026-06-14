import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mountain, Trees, Waves, Brush, Shovel, Wind, Museum } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import type { SiteType, ToolType } from '../types';

interface SiteOption {
  id: SiteType;
  name: string;
  desc: string;
  gradient: string;
  borderGlow: string;
  Icon: typeof Mountain;
}

const SITES: SiteOption[] = [
  {
    id: 'desert',
    name: '金沙大漠',
    desc: '古埃及与罗马帝国的秘密埋藏于漫漫黄沙之下',
    gradient: 'from-amber-700 via-orange-500 to-yellow-300',
    borderGlow: 'ring-amber-400/60',
    Icon: Mountain,
  },
  {
    id: 'jungle',
    name: '密境丛林',
    desc: '玛雅与古希腊的遗迹沉睡在藤蔓深处',
    gradient: 'from-emerald-800 via-green-600 to-lime-400',
    borderGlow: 'ring-emerald-400/60',
    Icon: Trees,
  },
  {
    id: 'ocean',
    name: '深蓝秘境',
    desc: '商瓷与楔形泥板静卧于海底千年暗涌之间',
    gradient: 'from-indigo-900 via-blue-600 to-cyan-400',
    borderGlow: 'ring-cyan-400/60',
    Icon: Waves,
  },
];

interface ToolOption {
  id: ToolType;
  name: string;
  desc: string;
  Icon: typeof Brush;
}

const TOOLS: ToolOption[] = [
  { id: 'brush', name: '软毛刷', desc: '温柔清除灰尘', Icon: Brush },
  { id: 'shovel', name: '考古铲', desc: '快速剥离土层', Icon: Shovel },
  { id: 'vacuum', name: '吸尘器', desc: '吸附细小颗粒', Icon: Wind },
];

export default function Home() {
  const navigate = useNavigate();
  const setSite = useGameStore((s) => s.setSite);
  const setTool = useGameStore((s) => s.setTool);
  const currentSite = useGameStore((s) => s.currentSite);
  const currentTool = useGameStore((s) => s.currentTool);
  const [selectedSite, setSelectedSite] = useState<SiteType | null>(currentSite);
  const [selectedTool, setSelectedTool] = useState<ToolType>(currentTool);

  const handleStart = () => {
    if (!selectedSite) return;
    setSite(selectedSite);
    setTool(selectedTool);
    navigate(`/dig-site/${selectedSite}`);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative"
      style={{
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(139,90,43,0.18) 0%, transparent 50%),radial-gradient(ellipse at 80% 100%, rgba(30,58,95,0.22) 0%, transparent 55%),linear-gradient(135deg,#1a1410 0%,#0f1419 60%,#10161b 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-[0.04 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><circle cx='50' cy='50' r='1' fill='white'/></svg>")',
          backgroundSize: '40px 40px,
        }}
      />

      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-14 pb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Museum className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-[Cinzel] text-2xl font-bold tracking-wider text-amber-100">
              考古工坊
            </h1>
            <p className="font-[Lora] text-xs tracking-widest text-amber-200/60 mt-0.5">
              ARCHAE RESTORATION ATELIER
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/exhibition')}
          className="group flex items-center gap-2 px-5 h-11 rounded-xl border border-amber-500/30 bg-amber-900/40 hover:bg-amber-900/70 text-amber-200 hover:text-amber-50 transition-all duration-200 hover:scale-[1.04 hover:shadow-lg hover:shadow-amber-700/30 font-[Lora]"
        >
          <Museum className="w-5 h-5 transition-transform group-hover:rotate-6" />
          <span className="font-medium">收藏展览柜</span>
        </button>
      </header>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h2 className="font-[Cinzel] text-4xl md:text-5xl font-bold tracking-wide text-amber-50 mb-4">
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent">
              踏入历史的长廊
            </span>
          </h2>
          <p className="font-[Lora] text-amber-100/70 text-lg max-w-2xl mx-auto leading-relaxed">
            挖掘沉睡千年的文物，亲手修复历史的碎片，在指尖之下沉睡千年的故事，复原文明的痕迹
          </p>
        </div>

        <div className="mb-12">
          <h3 className="font-[Cinzel] text-xl text-amber-200 mb-5 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-gradient-to-r from-amber-600 to-transparent inline-block" />
            <span>选择挖掘场地</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SITES.map((s => {
              const isSel = selectedSite === s.id;
              const { Icon } = s;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSite(s.id)}
                  className={`group relative overflow-hidden rounded-2xl p-6 h-60 text-left transition-all duration-300 transform hover:scale-[1.03 ${
                    isSel
                      ? `ring-2 ${s.borderGlow} shadow-2xl shadow-black/60`
                      : 'shadow-lg shadow-black/30 hover:shadow-xl'
                  }`}
                  style={{
                    background: isSel
                      ? `linear-gradient(165deg, rgba(0,0,0,0.2),var(--tw-gradient-stops)'
                      : 'linear-gradient(165deg, rgba(0,0,0,0.5),rgba(0,0,0,0.35)',
                  }}
                >
                  <div
                  className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div
                        className={`w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center ${
                          isSel
                            ? 'bg-white/25 ring-2 ring-white/60'
                            : 'bg-black/30'
                        }`}
                      >
                        <Icon className="w-7 h-7 text-white drop-shadow-md" />
                      </div>
                      {isSel && (
                        <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,0.6)" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-[Cinzel] text-2xl font-bold text-white drop-shadow-lg mb-1.5">
                        {s.name}
                      </h4>
                      <p className="font-[Lora] text-white/80 text-sm leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-[Cinzel] text-xl text-amber-200 mb-5 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-gradient-to-r from-orange-600 to-transparent inline-block" />
            <span>选择挖掘工具</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOOLS.map(t => {
              const isSel = selectedTool === t.id;
              const { Icon } = t;
              return (
                <button
                  key={t.id}
              onClick={() => setSelectedTool(t.id)}
                className={`group flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 hover:scale-[1.03 ${
                  isSel
                    ? 'bg-orange-600/40 border-orange-400/60 shadow-lg shadow-orange-900/40'
                    : 'bg-amber-950/40 border-amber-800/40 hover:border-amber-600/50'
              }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isSel
                      ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md'
                      : 'bg-amber-900/60 text-amber-200'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <div className="text-left">
                  <div className={`font-[Cinzel] text-lg font-semibold ${isSel ? 'text-amber-50' : 'text-amber-200'}`}>
                    {t.name}
                  </div>
                  <div className="font-[Lora] text-amber-300/60 text-sm">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleStart}
            disabled={!selectedSite}
            className={`group relative overflow-hidden px-12 py-4 rounded-2xl font-[Cinzel] text-xl font-bold tracking-wider transition-all duration-300 ${
              selectedSite
                ? 'hover:scale-105 hover:shadow-2xl text-white cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              background: selectedSite
                ? 'linear-gradient(135deg,#b45309,#d97706,#ea580c)'
                : 'linear-gradient(135deg,#44403c,#57534e)',
              boxShadow: selectedSite
                ? '0 20px 50px -10px rgba(217,119,6,0.5)'
                : 'none',
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Shovel className="w-6 h-6" />
              开启挖掘之旅
            </span>
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
            />
          </button>
        </div>
      </section>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 mt-16 pb-10 text-center">
        <p className="font-[Lora] text-amber-200/30 text-xs tracking-widest">
          © 考古工坊 · 每一片碎片都承载着一段被遗忘的传说
        </p>
      </footer>
    </div>
  );
}
