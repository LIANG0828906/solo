import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface PreviewRendererProps {
  gradientCSS: string;
}

export default function PreviewRenderer({ gradientCSS }: PreviewRendererProps) {
  const [scale, setScale] = useState(1);

  const zoomIn = () => setScale((s) => Math.min(1.5, s + 0.1));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));

  const previewCardStyle =
    'hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 ease';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">实时预览</h2>
        <div className="flex items-center gap-1 bg-panel-bg rounded-lg p-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-400 w-10 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto layout-sm:overflow-visible"
        style={{ transformOrigin: 'top left' }}
      >
        <div
          className="flex flex-col gap-6 items-start layout-sm:grid layout-sm:grid-cols-2 layout-sm:gap-4 layout-sm:items-stretch p-2"
          style={{ transform: `scale(${scale})` }}
        >
          <div className={`${previewCardStyle}`}>
            <h3 className="text-xs text-slate-400 mb-2 font-medium">按钮 Button</h3>
            <button
              className="text-white text-sm font-semibold rounded-lg shadow-lg"
              style={{
                width: 160,
                height: 48,
                backgroundImage: gradientCSS,
              }}
            >
              立即开始
            </button>
          </div>

          <div className={previewCardStyle}>
            <h3 className="text-xs text-slate-400 mb-2 font-medium">卡片 Card</h3>
            <div
              className="rounded-xl shadow-xl p-5 flex flex-col justify-between"
              style={{
                width: 280,
                height: 200,
                backgroundImage: gradientCSS,
              }}
            >
              <div>
                <h4 className="text-white font-bold text-lg mb-2 drop-shadow">设计灵感</h4>
                <p className="text-white/80 text-sm leading-relaxed drop-shadow">
                  探索渐变色彩在不同场景中的视觉表现，打造独特的用户体验。
                </p>
              </div>
              <div className="flex gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                  UI设计
                </span>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                  渐变色
                </span>
              </div>
            </div>
          </div>

          <div className={`${previewCardStyle} layout-sm:col-span-2`}>
            <h3 className="text-xs text-slate-400 mb-2 font-medium">迷你页面 Mini Page</h3>
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ width: 480, maxWidth: '100%' }}>
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundImage: gradientCSS }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white/30" />
                  <span className="text-white font-semibold text-sm drop-shadow">Gradient Studio</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/80 text-xs drop-shadow">首页</span>
                  <span className="text-white/80 text-xs drop-shadow">作品</span>
                  <span className="text-white/80 text-xs drop-shadow">关于</span>
                </div>
              </div>
              <div
                className="h-24 px-4 py-3 flex flex-col justify-center"
                style={{ backgroundImage: gradientCSS, filter: 'brightness(0.92)' }}
              >
                <h4 className="text-white font-bold text-base drop-shadow">欢迎使用渐变设计器</h4>
                <p className="text-white/70 text-xs mt-1 drop-shadow">
                  自由创造，无限可能。发现属于你的独特配色方案。
                </p>
              </div>
            </div>
          </div>

          <div className={previewCardStyle}>
            <h3 className="text-xs text-slate-400 mb-2 font-medium">文字 Text</h3>
            <div
              className="font-bold"
              style={{
                fontSize: 24,
                backgroundImage: gradientCSS,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 2px 20px rgba(0,0,0,0.15)',
                lineHeight: 1.3,
              }}
            >
              Gradient Magic
              <br />
              渐变魔法
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
