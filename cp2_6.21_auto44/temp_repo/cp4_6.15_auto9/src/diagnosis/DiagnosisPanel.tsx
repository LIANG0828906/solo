import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Droplets, Leaf, Thermometer, Wind, Sparkles } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { CareSuggestion, DiagnosisStatus } from '@/shared/types';

const iconMap = {
  sun: Sun,
  droplets: Droplets,
  leaf: Leaf,
  fertilizer: Sparkles,
  temperature: Thermometer,
  wind: Wind,
};

const statusConfig: Record<DiagnosisStatus, { label: string; gradient: string; severity: number; color: string }> = {
  healthy: {
    label: '健康',
    gradient: 'linear-gradient(90deg, #4CAF50, #81C784, #A5D6A7)',
    severity: 0,
    color: '#4CAF50',
  },
  nutrient_deficiency: {
    label: '营养不足',
    gradient: 'linear-gradient(90deg, #FBC02D, #FFD54F, #FFEB3B)',
    severity: 50,
    color: '#FBC02D',
  },
  diseased: {
    label: '病害',
    gradient: 'linear-gradient(90deg, #FF9800, #F44336, #E53935)',
    severity: 100,
    color: '#E53935',
  },
};

const spring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

const fadeUpVariant = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...spring, delay } },
});

function SuggestionCard({ suggestion, index }: { suggestion: CareSuggestion; index: number }) {
  const Icon = iconMap[suggestion.icon];
  return (
    <motion.div
      className="suggestion-card"
      variants={fadeUpVariant(index * 0.08)}
      initial="hidden"
      animate="visible"
      exit="hidden"
      whileHover={{ scale: 1.04, y: -4, transition: { ...spring, delay: 0 } }}
    >
      <motion.div
        className="suggestion-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...spring, delay: index * 0.08 + 0.1 }}
      >
        <Icon size={28} />
      </motion.div>
      <motion.h4
        className="suggestion-title"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...spring, delay: index * 0.08 + 0.14 }}
      >
        {suggestion.title}
      </motion.h4>
      <motion.p
        className="suggestion-desc"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...spring, delay: index * 0.08 + 0.2 }}
      >
        {suggestion.description}
      </motion.p>
    </motion.div>
  );
}

export default function DiagnosisPanel() {
  const { state } = useAppStore();
  const record = state.currentRecord;

  return (
    <AnimatePresence mode="wait">
      {state.isDiagnosing && (
        <motion.div
          key="loading"
          className="diagnosis-panel diagnosis-loading"
          layout
          initial={{ opacity: 0, y: 20, height: 'auto' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={spring}
        >
          <div className="loading-skeleton">
            <motion.div
              className="skeleton-line skeleton-1"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            />
            <motion.div
              className="skeleton-line skeleton-2"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
            />
            <motion.div
              className="skeleton-line skeleton-3"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: 0.4 }}
            />
            <div className="skeleton-cards">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="skeleton-card"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: 0.1 * i }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {!state.isDiagnosing && record && (
        <motion.div
          key="result"
          className="diagnosis-panel"
          layout
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={spring}
        >
          <motion.div
            className="severity-bar"
            style={{ background: statusConfig[record.status].gradient }}
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            <motion.span
              className="severity-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ ...spring, delay: 0.1 }}
            >
              严重等级
            </motion.span>
            <div className="severity-track">
              <motion.div
                className="severity-fill"
                initial={{ width: 0 }}
                animate={{ width: `${statusConfig[record.status].severity}%` }}
                transition={{ ...spring, delay: 0.25 }}
                style={{ background: 'rgba(255,255,255,0.35)' }}
              />
            </div>
            <motion.span
              className="severity-value"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              {statusConfig[record.status].label}
            </motion.span>
          </motion.div>

          <div className="diagnosis-content">
            <motion.div
              className="diagnosis-header"
              variants={fadeUpVariant(0.1)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div>
                <motion.span
                  className="plant-name"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.14 }}
                >
                  {record.plantName}
                </motion.span>
                <motion.h2
                  className="disease-name"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.2 }}
                >
                  {record.diseaseName}
                </motion.h2>
              </div>
              <div className="confidence-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E8F5E9" strokeWidth="8" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={statusConfig[record.status].color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    initial={{ strokeDasharray: '0 264' }}
                    animate={{ strokeDasharray: `${record.confidence * 2.64} 264` }}
                    transition={{ ...spring, delay: 0.3 }}
                  />
                </svg>
                <motion.span
                  className="confidence-value"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring, delay: 0.42 }}
                >
                  {record.confidence}%
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              className="symptoms-section"
              variants={fadeUpVariant(0.22)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.h3
                className="section-title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.26 }}
              >
                症状描述
              </motion.h3>
              <motion.p
                className="symptoms-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...spring, delay: 0.32 }}
              >
                {record.symptoms}
              </motion.p>
            </motion.div>

            <motion.div
              className="suggestions-section"
              variants={fadeUpVariant(0.3)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.h3
                className="section-title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.34 }}
              >
                护理建议
              </motion.h3>
              <div className="suggestions-scroll">
                <div className="suggestions-track">
                  <AnimatePresence>
                    {record.suggestions.map((s, i) => (
                      <SuggestionCard key={s.id} suggestion={s} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <motion.p
                className="scroll-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...spring, delay: 0.7 }}
              >
                ← 左右滑动查看更多建议 →
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
