import useVisualizerStore from '@/store/useVisualizerStore';
import type { ThemeType } from '@/types';
import { cn } from '@/lib/utils';

const themeLabels: Record<ThemeType, string> = {
  aurora: '极光',
  neon: '霓虹',
  ink: '水墨',
};

export default function ThemeSelector() {
  const { theme, setTheme } = useVisualizerStore();

  return (
    <div className="flex gap-2">
      {(Object.keys(themeLabels) as ThemeType[]).map((themeKey) => (
        <button
          key={themeKey}
          onClick={() => setTheme(themeKey)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
            theme === themeKey
              ? 'bg-cyan-500 text-white shadow-inner'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
          )}
        >
          {themeLabels[themeKey]}
        </button>
      ))}
    </div>
  );
}
