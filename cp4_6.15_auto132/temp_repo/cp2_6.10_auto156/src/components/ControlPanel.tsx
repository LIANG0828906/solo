import { motion } from 'framer-motion';
import { useSpiceStore } from '../store/spiceStore';
import { Sparkles, RotateCcw, Trash2 } from 'lucide-react';

function ControlPanel() {
  const mixture = useSpiceStore(state => state.mixture);
  const generateScentReview = useSpiceStore(state => state.generateScentReview);
  const randomRecipe = useSpiceStore(state => state.randomRecipe);
  const clearMixture = useSpiceStore(state => state.clearMixture);

  const hasMixture = mixture.length > 0;

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    disabled: { opacity: 0.5, cursor: 'not-allowed' }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 mt-8 p-6 rounded-2xl"
      style={{
        background: 'rgba(42, 11, 11, 0.8)',
        border: '2px solid #DAA520'
      }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.button
        onClick={generateScentReview}
        disabled={!hasMixture}
        variants={itemVariants}
        whileHover={hasMixture ? buttonVariants.hover : buttonVariants.disabled}
        whileTap={hasMixture ? buttonVariants.tap : {}}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all"
        style={{
          background: hasMixture
            ? 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)'
            : 'linear-gradient(135deg, #666 0%, #444 100%)',
          color: hasMixture ? '#2A0B0B' : '#999',
          border: '2px solid #8B6914',
          boxShadow: hasMixture
            ? '0 4px 15px rgba(218, 165, 32, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            : 'none',
          fontFamily: "'Noto Serif SC', serif"
        }}
        aria-label="闻香品鉴"
      >
        <Sparkles size={20} />
        闻 香
      </motion.button>

      <motion.button
        onClick={randomRecipe}
        variants={itemVariants}
        whileHover={buttonVariants.hover}
        whileTap={buttonVariants.tap}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg"
        style={{
          background: 'linear-gradient(135deg, #8B0000 0%, #5C0000 100%)',
          color: '#DAA520',
          border: '2px solid #DAA520',
          boxShadow: '0 4px 15px rgba(139, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          fontFamily: "'Noto Serif SC', serif"
        }}
        aria-label="随机配方"
      >
        <RotateCcw size={20} />
        随机配方
      </motion.button>

      <motion.button
        onClick={clearMixture}
        disabled={!hasMixture}
        variants={itemVariants}
        whileHover={hasMixture ? buttonVariants.hover : buttonVariants.disabled}
        whileTap={hasMixture ? buttonVariants.tap : {}}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all"
        style={{
          background: hasMixture
            ? 'linear-gradient(135deg, #5C4033 0%, #3D2914 100%)'
            : 'linear-gradient(135deg, #444 0%, #333 100%)',
          color: hasMixture ? '#F5DEB3' : '#666',
          border: hasMixture ? '2px solid #8B4513' : '2px solid #555',
          boxShadow: hasMixture
            ? '0 4px 15px rgba(92, 64, 51, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'none',
          fontFamily: "'Noto Serif SC', serif"
        }}
        aria-label="清空秤盘"
      >
        <Trash2 size={20} />
        清 空
      </motion.button>
    </motion.div>
  );
}

export default ControlPanel;
