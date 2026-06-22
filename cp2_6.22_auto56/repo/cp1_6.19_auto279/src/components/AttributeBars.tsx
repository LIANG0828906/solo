import { motion } from 'framer-motion';

interface AttributeBarsProps {
  firepower: number;
  shield: number;
  speed: number;
}

const BarComponent = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  const isMaxed = value >= 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span
        style={{
          fontSize: '13px',
          color: '#A0B0C0',
          width: '48px',
          textAlign: 'right',
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: '200px',
          height: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
          }}
          key={value}
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: '8px',
            boxShadow: `0 0 8px ${color}`,
          }}
        >
          <motion.div
            animate={{
              filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
            }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', height: '100%' }}
          />
        </motion.div>
        {isMaxed && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '10px',
              height: '10px',
              color: '#fff',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ★
          </motion.div>
        )}
      </div>
      <span
        style={{
          fontSize: '13px',
          color: '#E6EDF3',
          width: '36px',
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
};

function AttributeBars({ firepower, shield, speed }: AttributeBarsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <BarComponent label="火力" value={firepower} color="#E74C3C" />
      <BarComponent label="护盾" value={shield} color="#3498DB" />
      <BarComponent label="航速" value={speed} color="#2ECC71" />
    </div>
  );
}

export default AttributeBars;
