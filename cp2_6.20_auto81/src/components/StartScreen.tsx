import { useState } from 'react';

interface StartScreenProps {
  onStart: (theme?: string) => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [theme, setTheme] = useState('');

  const presets = [
    { icon: '🏰', name: '中世纪奇幻', theme: 'medieval fantasy' },
    { icon: '🚀', name: '太空科幻', theme: 'space sci-fi' },
    { icon: '🔍', name: '侦探推理', theme: 'detective mystery' },
    { icon: '👻', name: '恐怖惊悚', theme: 'horror thriller' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1
            className="font-mono text-4xl md:text-5xl font-bold mb-4 tracking-wider"
            style={{ color: 'var(--text-accent)', textShadow: '0 0 20px var(--glow-accent)' }}
          >
            ╔══ TERMINAL ADVENTURE ══╗
          </h1>
          <div
            className="font-mono text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <p className="mb-2">╚══════════════════════════╝</p>
            <p>欢迎来到复古终端文字冒险系统</p>
            <p>输入故事主题或选择预设模板开始你的旅程...</p>
          </div>
        </div>

        <div
          className="font-mono text-xs uppercase tracking-wider mb-3 text-left"
          style={{ color: 'var(--text-accent)' }}
        >
          {'>'} 输入故事主题 (可选):
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart(theme || undefined);
          }}
          className="mb-6"
        >
          <div
            className="flex items-center gap-2 p-3 rounded border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span style={{ color: 'var(--text-accent)' }}>$</span>
            <span className="animate-cursor-blink">_</span>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例如: 海盗冒险、时间旅行、魔法学院..."
              className="flex-1 bg-transparent outline-none font-mono text-base"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
            <button
              type="submit"
              className="btn-press font-mono text-sm px-4 py-1.5 rounded"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: '#ffffff',
                border: '1px solid var(--bg-card-hover)',
              }}
            >
              开始 ▶
            </button>
          </div>
        </form>

        <div
          className="font-mono text-xs uppercase tracking-wider mb-3 text-left"
          style={{ color: 'var(--text-accent)' }}
        >
          {'>'} 或选择预设模板:
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.theme}
              onClick={() => onStart(preset.theme)}
              className="btn-press font-mono text-sm p-4 rounded border transition-all duration-200 flex flex-col items-center gap-2"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.15)';
                e.currentTarget.style.borderColor = 'var(--bg-card-hover)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(31, 111, 235, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-xs">{preset.name}</span>
            </button>
          ))}
        </div>

        <div
          className="mt-8 font-mono text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          <p>提示: 你可以在游戏中随时点击右下角 💾 按钮保存进度</p>
          <p className="mt-1 opacity-60">v1.0.0 | Built with React + FastAPI</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
