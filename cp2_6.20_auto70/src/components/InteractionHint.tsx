import { useState, useEffect } from 'react';
import { Mouse, Move, ZoomIn, X } from 'lucide-react';

export function InteractionHint() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 5000);
    const timer2 = setTimeout(() => setVisible(false), 5600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  const hints = [
    { icon: <Mouse size={12} />, text: '左键拖拽旋转' },
    { icon: <ZoomIn size={12} />, text: '滚轮缩放' },
    { icon: <Move size={12} />, text: '右键平移' },
  ];

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-lg px-4 py-2.5 flex items-center gap-4 transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {hints.map((hint, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-white/40">{hint.icon}</span>
          <span className="text-[10px] text-white/50">{hint.text}</span>
        </div>
      ))}
      <button
        onClick={() => setVisible(false)}
        className="ml-1 text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
