import { motion } from 'framer-motion';
import { useTimelineStore } from '@/store/timelineStore';
import type { ThemeType } from '@/types';
import { Scroll, Zap, Minimize2 } from 'lucide-react';
import '@/styles/ThemeSwitcher.css';

const themeOptions: { key: ThemeType; label: string; icon: typeof Scroll }[] = [
  { key: 'classic', label: '古典', icon: Scroll },
  { key: 'cyberpunk', label: '赛博', icon: Zap },
  { key: 'minimal', label: '极简', icon: Minimize2 },
];

export const ThemeSwitcher = () => {
  const { currentTheme, setTheme } = useTimelineStore();

  return (
    <div className="theme-switcher">
      {themeOptions.map(({ key, label, icon: Icon }) => (
        <motion.button
          key={key}
          className={`theme-btn ${currentTheme === key ? 'active' : ''}`}
          onClick={() => setTheme(key)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <Icon size={16} />
          <span>{label}</span>
          {currentTheme === key && (
            <motion.div
              className="active-indicator"
              layoutId="theme-active"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
