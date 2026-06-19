import { motion, AnimatePresence } from 'framer-motion';

interface SaveFleetModalProps {
  fleetName: string;
  onFleetNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function SaveFleetModal({
  fleetName,
  onFleetNameChange,
  onConfirm,
  onCancel,
}: SaveFleetModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100,
        }}
        onClick={onCancel}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          backgroundColor: '#1E1E1E',
          borderRadius: '12px',
          padding: '24px',
          zIndex: 101,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h3
          style={{
            color: '#E6EDF3',
            fontSize: '18px',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          命名舰队
        </h3>

        <input
          type="text"
          value={fleetName}
          onChange={(e) => onFleetNameChange(e.target.value)}
          placeholder="请输入舰队名称"
          autoFocus
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            backgroundColor: '#2A2E35',
            border: '1px solid #3A3E45',
            borderRadius: '8px',
            color: '#E6EDF3',
            fontSize: '14px',
            outline: 'none',
            marginBottom: '20px',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm();
          }}
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0 20px',
              height: '36px',
              backgroundColor: '#3A3E45',
              borderRadius: '6px',
              color: '#E6EDF3',
              fontSize: '14px',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!fleetName.trim()}
            style={{
              padding: '0 20px',
              height: '36px',
              backgroundColor: fleetName.trim() ? '#5B7A3E' : '#3A4A2E',
              borderRadius: '6px',
              color: fleetName.trim() ? '#fff' : '#888',
              fontSize: '14px',
              cursor: fleetName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            确认保存
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default SaveFleetModal;
