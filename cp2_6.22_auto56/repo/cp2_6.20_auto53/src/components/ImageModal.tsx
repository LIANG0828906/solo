import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageSrc: string;
  onClose: () => void;
}

export default function ImageModal({ imageSrc, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0, 0, 0, 0.85)' }}
        onClick={onClose}
      >
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 90 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full z-10 transition-transform hover:scale-110"
          style={{
            background:
              'linear-gradient(135deg, #e8d48a 0%, #c9a84c 50%, #a58b34 100%)',
            color: '#1a2332',
            boxShadow: '0 6px 24px rgba(201, 168, 76, 0.4)',
          }}
          aria-label="关闭"
        >
          <X size={22} strokeWidth={2.5} />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 28,
            mass: 0.9,
          }}
          className="relative max-w-5xl max-h-[88vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageSrc}
            alt="查看大图"
            className="max-w-full max-h-full object-contain rounded-2xl select-none"
            style={{
              boxShadow:
                '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(201, 168, 76, 0.2)',
            }}
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
