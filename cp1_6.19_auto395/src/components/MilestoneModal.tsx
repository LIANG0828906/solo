import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const MilestoneModal = () => {
  const {
    selectedMilestoneId,
    milestones,
    updateMilestone,
    deleteMilestone,
    setIsMilestoneModalOpen,
    isMilestoneModalOpen,
  } = useAppStore();

  const milestone = milestones.find((m) => m.id === selectedMilestoneId);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    if (milestone) {
      setEditName(milestone.name);
      setEditDescription(milestone.description);
      setEditDate(milestone.date);
    }
  }, [milestone]);

  if (!milestone) return null;

  const handleClose = () => {
    updateMilestone(milestone.id, {
      name: editName,
      description: editDescription,
      date: editDate,
    });
    setIsMilestoneModalOpen(false);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个里程碑吗？')) {
      deleteMilestone(milestone.id);
      setIsMilestoneModalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isMilestoneModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              zIndex: 1001,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#FF9800',
                  transform: 'rotate(45deg)',
                }}
              />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: '18px',
                  fontWeight: '600',
                  border: 'none',
                  borderBottom: '2px solid #FF9800',
                  outline: 'none',
                  padding: '4px 0',
                  color: '#333',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            <div
              style={{
                padding: '24px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px',
                    fontWeight: '500',
                  }}
                >
                  日期
                </div>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px',
                    fontWeight: '500',
                  }}
                >
                  描述
                </div>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="输入里程碑描述..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E0E0E0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #E57373',
                  backgroundColor: 'white',
                  color: '#F44336',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFEBEE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                删除
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: '1px solid #E0E0E0',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MilestoneModal;
