import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

const statusText: Record<string, string> = {
  unweighed: '未称',
  pounding: '捣药中',
  weighing: '称量中',
  completed: '已入药',
};

export default function Prescription() {
  const { state, dispatch } = useStore();
  const completedCount = state.prescription.filter(
    (item) => item.status === 'completed'
  ).length;

  const handleComplete = () => {
    if (completedCount === state.prescription.length) {
      dispatch({ type: 'START_PILL_ANIMATION' });
      setTimeout(() => {
        dispatch({ type: 'END_PILL_ANIMATION' });
      }, 2000);
    }
  };

  return (
    <motion.div
      className="panel-section prescription-scroll"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ marginLeft: 8, marginRight: 8 }}
    >
      <h2 className="panel-title">
        处方单 ({completedCount}/{state.prescription.length})
      </h2>

      <div>
        {state.prescription.map((item, index) => (
          <motion.div
            key={item.id}
            className="prescription-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{
              backgroundColor: 'rgba(184, 134, 11, 0.1)',
              scale: 1.02,
            }}
          >
            <span className="prescription-index">{index + 1}</span>
            <span className="prescription-herb">{item.herbName}</span>
            <span className="prescription-dosage">{item.requiredDosage}钱</span>
            <span className={`prescription-status status-${item.status}`}>
              {statusText[item.status]}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {completedCount === state.prescription.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 16, textAlign: 'center' }}
          >
            <button
              className="btn btn-gold"
              onClick={handleComplete}
              style={{ width: '100%' }}
            >
              ✨ 配药完成 ✨
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
