import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, Priority } from '../shared/StoreContext';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    deadline: string;
    totalTasks: number;
    priority: Priority;
  }) => void;
  editingProject?: Project | null;
}

interface FormErrors {
  name?: string;
  deadline?: string;
  totalTasks?: string;
}

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export function ProjectForm({
  isOpen,
  onClose,
  onSubmit,
  editingProject,
}: ProjectFormProps) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalTasks, setTotalTasks] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDeadline(editingProject.deadline);
      setTotalTasks(editingProject.totalTasks.toString());
      setPriority(editingProject.priority);
    } else {
      setName('');
      setDeadline('');
      setTotalTasks('');
      setPriority('medium');
    }
    setErrors({});
  }, [editingProject, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = '请输入项目名称';
    } else if (name.length > 50) {
      newErrors.name = '项目名称不能超过50个字符';
    }

    if (!deadline) {
      newErrors.deadline = '请选择截止日期';
    } else {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        newErrors.deadline = '截止日期不能早于今天';
      }
    }

    const tasksNum = parseInt(totalTasks, 10);
    if (!totalTasks || isNaN(tasksNum)) {
      newErrors.totalTasks = '请输入有效的任务数量';
    } else if (tasksNum < 1) {
      newErrors.totalTasks = '任务数量至少为1';
    } else if (tasksNum > 999) {
      newErrors.totalTasks = '任务数量不能超过999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: name.trim(),
        deadline,
        totalTasks: parseInt(totalTasks, 10),
        priority,
      });
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={styles.overlay}
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, type: 'spring', damping: 25 }}
          style={styles.modal}
        >
          <h2 style={styles.title}>
            {editingProject ? '编辑项目' : '添加新项目'}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>项目名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入项目名称"
                style={{
                  ...styles.input,
                  ...(errors.name ? styles.inputError : {}),
                }}
                maxLength={50}
              />
              {errors.name && <span style={styles.error}>{errors.name}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>截止日期</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.deadline ? styles.inputError : {}),
                }}
              />
              {errors.deadline && (
                <span style={styles.error}>{errors.deadline}</span>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>总任务数量</label>
              <input
                type="number"
                value={totalTasks}
                onChange={(e) => setTotalTasks(e.target.value)}
                placeholder="请输入总任务数量"
                min="1"
                max="999"
                style={{
                  ...styles.input,
                  ...(errors.totalTasks ? styles.inputError : {}),
                }}
              />
              {errors.totalTasks && (
                <span style={styles.error}>{errors.totalTasks}</span>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>优先级</label>
              <div style={styles.priorityGroup}>
                {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      ...styles.priorityBtn,
                      ...styles[`priority_${p}` as keyof typeof styles],
                      ...(priority === p
                        ? styles.priorityBtnActive
                        : {}),
                    }}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                style={styles.cancelBtn}
              >
                取消
              </button>
              <button type="submit" style={styles.submitBtn}>
                {editingProject ? '保存修改' : '添加项目'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#2B2D42',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    color: '#E0E0E0',
    fontSize: '14px',
    fontWeight: 500,
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid transparent',
    backgroundColor: '#1E1E2E',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#FF4757',
  },
  error: {
    color: '#FF4757',
    fontSize: '12px',
  },
  priorityGroup: {
    display: 'flex',
    gap: '12px',
  },
  priorityBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid transparent',
    backgroundColor: '#1E1E2E',
    color: '#E0E0E0',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  priorityBtnActive: {
    borderColor: '#FFFFFF',
    color: '#FFFFFF',
  },
  priority_high: {
    ':hover': {
      backgroundColor: 'rgba(255, 71, 87, 0.2)',
    },
  },
  priority_medium: {
    ':hover': {
      backgroundColor: 'rgba(255, 165, 2, 0.2)',
    },
  },
  priority_low: {
    ':hover': {
      backgroundColor: 'rgba(46, 213, 115, 0.2)',
    },
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3A3D5C',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
