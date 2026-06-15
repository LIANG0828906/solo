import { motion } from 'framer-motion';
import { stepNames } from '@/constants/poseList';
import { useFigureStore } from '@/store/useFigureStore';

export const ProgressBar = () => {
  const { figureData, setCurrentStep } = useFigureStore();
  const { currentStep } = figureData;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      className="h-20 flex items-center justify-center gap-2 bg-gradient-to-t from-[#2c1e14] to-transparent px-8"
    >
      <div className="flex items-center gap-2 w-full max-w-3xl">
        {stepNames.map((name, index) => (
          <StepNode
            key={index}
            index={index}
            name={name}
            isCompleted={index < currentStep}
            isCurrent={index === currentStep}
            isLast={index === stepNames.length - 1}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface StepNodeProps {
  index: number;
  name: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
  onClick: () => void;
}

const StepNode = ({ index, name, isCompleted, isCurrent, isLast, onClick }: StepNodeProps) => {
  return (
    <div className="flex items-center flex-1">
      <motion.button
        onClick={onClick}
        className="flex flex-col items-center gap-1 group"
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          className="relative"
          animate={isCurrent ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={isCurrent ? {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        >
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              border-2 transition-all cursor-pointer
              ${isCompleted
                ? 'bg-[#3e2723] border-[#8d6e63] text-[#f5f0e8]'
                : isCurrent
                ? 'bg-[#5d4037] border-[#ffd54f] text-[#ffd54f] shadow-lg shadow-[#ffd54f]/30'
                : 'bg-transparent border-[#bdbdbd] text-[#bdbdbd] group-hover:border-[#8d6e63] group-hover:text-[#8d6e63]'
              }`}
            whileHover={!isCompleted && !isCurrent ? { borderColor: '#8d6e63', color: '#8d6e63' } : {}}
          >
            {isCompleted ? '✓' : index + 1}
          </motion.div>
          {isCurrent && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#ffd54f]"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
        <span
          className={`text-xs whitespace-nowrap ${isCompleted || isCurrent ? 'text-[#d7ccc8]' : 'text-[#6d4c41]'}`}
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          {name}
        </span>
      </motion.button>
      {!isLast && (
        <div className="flex-1 h-0.5 mx-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#5d4037]" />
          {isCompleted && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#8d6e63]"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
            />
          )}
        </div>
      )}
    </div>
  );
};
