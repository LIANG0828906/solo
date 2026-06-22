import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiceStore } from '../store/spiceStore';
import { getSpiceById } from '../utils/spiceData';
import { X } from 'lucide-react';

function RecipeCard() {
  const mixture = useSpiceStore(state => state.mixture);
  const scentDescription = useSpiceStore(state => state.scentDescription);
  const scentReview = useSpiceStore(state => state.scentReview);
  const removeSpice = useSpiceStore(state => state.removeSpice);

  const sortedMixture = useMemo(() =>
    [...mixture].sort((a, b) => b.amount - a.amount),
    [mixture]
  );

  const allTags = useMemo(() => {
    const tags: string[] = [];
    mixture.forEach(m => {
      const spice = getSpiceById(m.spiceId);
      if (spice) {
        tags.push(...spice.scentTags);
      }
    });
    return [...new Set(tags)];
  }, [mixture]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      className="flex flex-col items-stretch p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(245, 222, 179, 0.98) 0%, rgba(222, 184, 135, 0.98) 100%)',
        border: '3px solid #8B0000',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div
        className="absolute top-0 left-0 right-0 h-6"
        style={{
          background: 'linear-gradient(180deg, #8B0000 0%, rgba(139, 0, 0, 0.8) 100%)',
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-6"
        style={{
          background: 'linear-gradient(0deg, #8B0000 0%, rgba(139, 0, 0, 0.8) 100%)',
          clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)'
        }}
      />

      <motion.h2
        className="text-2xl font-bold mb-6 text-center pt-2"
        style={{
          color: '#8B0000',
          fontFamily: "'Noto Serif SC', serif",
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
        }}
        variants={itemVariants}
      >
        配 方 秘 籍
      </motion.h2>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <motion.div variants={itemVariants}>
          <h3
            className="text-sm font-bold mb-3 pb-2 border-b-2 border-dashed"
            style={{ color: '#8B4513', borderColor: '#CD853F', fontFamily: "'Noto Serif SC', serif" }}
          >
            香 料 组 合
          </h3>

          {sortedMixture.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: '#8B4513', fontFamily: "'Noto Sans SC', sans-serif" }}>
              尚未添加香料<br />请从左侧香料架选取
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {sortedMixture.map((m, index) => {
                  const spice = getSpiceById(m.spiceId);
                  if (!spice) return null;

                  return (
                    <motion.div
                      key={m.spiceId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 p-2 rounded-lg group"
                      style={{ backgroundColor: 'rgba(139, 69, 19, 0.1)' }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: spice.color,
                          boxShadow: `0 0 6px ${spice.color}`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#5C4033', fontFamily: "'Noto Sans SC', sans-serif" }}>
                          {spice.nameCN}
                        </p>
                        <p className="text-xs" style={{ color: '#8B4513' }}>
                          {spice.origin}
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#8B0000', fontFamily: "'Noto Serif SC', serif" }}>
                        {m.amount}%
                      </span>
                      <button
                        onClick={() => removeSpice(m.spiceId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100"
                        aria-label={`移除${spice.nameCN}`}
                      >
                        <X size={14} style={{ color: '#8B0000' }} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {allTags.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3
              className="text-sm font-bold mb-3 pb-2 border-b-2 border-dashed"
              style={{ color: '#8B4513', borderColor: '#CD853F', fontFamily: "'Noto Serif SC', serif" }}
            >
              气 味 标 签
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(139, 0, 0, 0.1)',
                    color: '#8B0000',
                    border: '1px solid rgba(139, 0, 0, 0.3)',
                    fontFamily: "'Noto Sans SC', sans-serif"
                  }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {scentDescription && (
          <motion.div variants={itemVariants}>
            <h3
              className="text-sm font-bold mb-3 pb-2 border-b-2 border-dashed"
              style={{ color: '#8B4513', borderColor: '#CD853F', fontFamily: "'Noto Serif SC', serif" }}
            >
              香 气 描 述
            </h3>
            <motion.p
              key={scentDescription}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm leading-relaxed italic"
              style={{ color: '#5C4033', fontFamily: "'Noto Serif SC', serif" }}
            >
              "{scentDescription}"
            </motion.p>
          </motion.div>
        )}

        <AnimatePresence>
          {scentReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              variants={itemVariants}
            >
              <h3
                className="text-sm font-bold mb-3 pb-2 border-b-2 border-dashed"
                style={{ color: '#8B4513', borderColor: '#CD853F', fontFamily: "'Noto Serif SC', serif" }}
              >
                闻 香 品 鉴
              </h3>
              <motion.div
                key={scentReview}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.1) 0%, rgba(139, 69, 19, 0.1) 100%)',
                  border: '1px solid rgba(139, 0, 0, 0.2)'
                }}
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#5C4033', fontFamily: "'Noto Serif SC', serif" }}
                >
                  {scentReview}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default RecipeCard;
