import { useState, useEffect } from 'react';
import { Mouse, Move, ZoomIn, X, Hand, Sliders, Wand2, Save, CheckCircle } from 'lucide-react';

export function InteractionHint() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 8000);
    const timer2 = setTimeout(() => setVisible(false), 8600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  const viewHints = [
    { icon: <Mouse size={12} />, text: '左键旋转' },
    { icon: <ZoomIn size={12} />, text: '滚轮缩放' },
    { icon: <Move size={12} />, text: '右键平移' },
  ];

  const editHints = [
    { icon: <Hand size={12} />, text: '拖拽切割件' },
    { icon: <CheckCircle size={12} />, text: '碰撞变红' },
    { icon: <Sliders size={12} />, text: '调整参数' },
    { icon: <Wand2 size={12} />, text: '自动优化' },
    { icon: <Save size={12} />, text: '保存方案' },
  ];

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="glass-panel rounded-xl px-5 py-3.5 flex flex-col gap-2.5 shadow-xl">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em]">
            视角操作
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setVisible(false)}
            className="text-white/20 hover:text-white/50 transition-colors p-0.5"
          >
            <X size={12} />
          </button>
        </div>

        <div className="flex items-center gap-5">
          {viewHints.map((hint, i) => (
            <div key={`v-${i}`} className="flex items-center gap-1.5">
              <span className="text-white/35">{hint.icon}</span>
              <span className="text-[10px] text-white/50">{hint.text}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/5 -mx-2" />

        <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em]">
          排版操作
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {editHints.map((hint, i) => (
            <div key={`e-${i}`} className="flex items-center gap-1.5">
              <span className="text-accent-green/50">{hint.icon}</span>
              <span className="text-[10px] text-white/45">{hint.text}</span>
            </div>
          ))}
        </div>

        <div className="text-[8.5px] text-white/25 leading-relaxed pt-1 border-t border-white/5">
          提示：调整参数后点击"应用布局"确认修改，避免频繁重排。拖拽时碰撞区域会显示红色高亮。
        </div>
      </div>
    </div>
  );
}
