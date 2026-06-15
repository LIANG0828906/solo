import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { UI_CONSTANTS, COLORS } from '@/utils/constants';

export default function FloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleSidebar = useNavigationStore((state) => state.toggleSidebar);

  useEffect(() => {
    const checkWidth = () => {
      setIsVisible(window.innerWidth < UI_CONSTANTS.MOBILE_BREAKPOINT);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleSidebar}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
      style={{
        backgroundColor: 'rgba(11, 22, 40, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Menu
        size={24}
        style={{ color: COLORS.ACCENT }}
      />
    </motion.button>
  );
}
