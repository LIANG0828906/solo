import { motion } from 'framer-motion';
import { Lamp, Download, Share2, RotateCcw, HelpCircle } from 'lucide-react';
import { useFigureStore } from '@/store/useFigureStore';

interface TopNavbarProps {
  onSave: () => void;
  onShare: () => void;
  onReset: () => void;
  onShowHelp: () => void;
}

export const TopNavbar = ({ onSave, onShare, onReset, onShowHelp }: TopNavbarProps) => {
  const { figureName } = useFigureStore();

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="h-[60px] flex items-center justify-between px-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #4e342e 0%, #3e2723 100%)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path
            d="M0,30 Q30,10 60,30 T120,30 T180,30 T240,30 T300,30 T360,30 T420,30 T480,30 T540,30 T600,30 T660,30 T720,30 T780,30 T840,30 T900,30 T960,30 T1020,30 T1080,30 T1140,30 T1200,30"
            fill="none"
            stroke="#f5f0e8"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="flex items-center gap-3 z-10">
        <motion.div
          className="w-10 h-14 relative"
          animate={{
            filter: [
              'drop-shadow(0 0 8px #ffd54f)',
              'drop-shadow(0 0 16px #ffb74d)',
              'drop-shadow(0 0 8px #ffd54f)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 40 56" className="w-full h-full">
            <ellipse cx="20" cy="8" rx="14" ry="6" fill="#5d4037" />
            <rect x="10" y="8" width="20" height="38" fill="#6d4c41" rx="2" />
            <ellipse cx="20" cy="46" rx="14" ry="6" fill="#4e342e" />
            <ellipse cx="20" cy="8" rx="10" ry="4" fill="#ffd54f" opacity="0.6" />
            <ellipse cx="20" cy="20" rx="6" ry="8" fill="#ffab40" opacity="0.8" />
            <ellipse cx="20" cy="32" rx="5" ry="7" fill="#ff8f00" opacity="0.6" />
          </svg>
        </motion.div>

        <div className="text-[#f5f0e8]">
          <h1 className="text-xl font-semibold tracking-wider">{figureName}</h1>
          <p className="text-xs opacity-70">宋代泥塑造像彩绘与装銮</p>
        </div>
      </div>

      <div className="text-[#f5f0e8] text-lg font-medium tracking-widest z-10">
        女娲庙·泥塑作坊
      </div>

      <div className="flex items-center gap-3 z-10">
        <motion.div
          className="w-10 h-14 relative"
          animate={{
            filter: [
              'drop-shadow(0 0 8px #ffd54f)',
              'drop-shadow(0 0 16px #ffb74d)',
              'drop-shadow(0 0 8px #ffd54f)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <svg viewBox="0 0 40 56" className="w-full h-full">
            <ellipse cx="20" cy="8" rx="14" ry="6" fill="#5d4037" />
            <rect x="10" y="8" width="20" height="38" fill="#6d4c41" rx="2" />
            <ellipse cx="20" cy="46" rx="14" ry="6" fill="#4e342e" />
            <ellipse cx="20" cy="8" rx="10" ry="4" fill="#ffd54f" opacity="0.6" />
            <ellipse cx="20" cy="20" rx="6" ry="8" fill="#ffab40" opacity="0.8" />
            <ellipse cx="20" cy="32" rx="5" ry="7" fill="#ff8f00" opacity="0.6" />
          </svg>
        </motion.div>

        <div className="h-8 w-px bg-[#5d4037] mx-2" />

        <NavButton icon={<HelpCircle size={18} />} label="帮助" onClick={onShowHelp} />
        <NavButton icon={<RotateCcw size={18} />} label="重置" onClick={onReset} />
        <NavButton icon={<Share2 size={18} />} label="分享" onClick={onShare} />
        <NavButton icon={<Download size={18} />} label="保存" onClick={onSave} primary />
      </div>
    </motion.nav>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

const NavButton = ({ icon, label, onClick, primary }: NavButtonProps) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ y: 0 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
      ${primary
        ? 'bg-[#8d6e63] text-white border-b-2 border-[#5d4037] hover:bg-[#a1887f]'
        : 'text-[#d7ccc8] hover:bg-[#5d4037] border-b-2 border-transparent hover:border-[#8d6e63]'
      }`}
    style={{ fontFamily: "'Noto Serif SC', serif" }}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);
