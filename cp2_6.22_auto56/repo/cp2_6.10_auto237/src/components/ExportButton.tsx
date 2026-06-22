import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Download, Image, Loader2 } from 'lucide-react';

export default function ExportButton() {
  const { exportImage, sewnOrder } = useGameStore((state) => ({
    exportImage: state.exportImage,
    sewnOrder: state.sewnOrder
  }));

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || sewnOrder.length === 0) return;
    
    setIsExporting(true);
    try {
      await exportImage();
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <motion.button
      whileHover={sewnOrder.length > 0 ? { scale: 1.05 } : {}}
      whileTap={sewnOrder.length > 0 ? { scale: 0.95 } : {}}
      onClick={handleExport}
      disabled={isExporting || sewnOrder.length === 0}
      className={`
        w-full py-3 rounded-xl font-bold text-sm
        flex items-center justify-center gap-2
        transition-all duration-300
        ${isExporting
          ? 'bg-[#4a3b2c] text-[#b87333] cursor-wait'
          : sewnOrder.length === 0
          ? 'bg-[#2c1810] text-[#b87333]/50 cursor-not-allowed border border-[#b87333]/20'
          : 'bg-gradient-to-r from-[#2a6f97] to-[#4682B4] text-white hover:shadow-lg hover:shadow-[#2a6f97]/30'
        }
      `}
    >
      {isExporting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          导出中...
        </>
      ) : (
        <>
          <Download size={16} />
          导出图片
        </>
      )}
    </motion.button>
  );
}
