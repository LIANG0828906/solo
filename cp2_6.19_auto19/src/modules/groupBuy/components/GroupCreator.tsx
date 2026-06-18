import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { useGroupBuyStore } from '../store/groupBuyStore';
import type { TimeSlot } from '../../../types';

interface GroupCreatorProps {
  onClose: () => void;
}

export const GroupCreator: React.FC<GroupCreatorProps> = ({ onClose }) => {
  const { createGroupBuy, loading } = useGroupBuyStore();
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    originalPrice: '',
    groupPrice: '',
    minMembers: 3,
    durationHours: 4,
  });
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  const generateDefaultSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = dayjs();
    for (let i = 1; i <= 3; i++) {
      const date = now.add(i, 'day').format('YYYY-MM-DD');
      slots.push(
        { id: uuidv4(), date, startTime: '09:00', endTime: '11:00', maxCapacity: 20, currentCount: 0 },
        { id: uuidv4(), date, startTime: '14:00', endTime: '16:00', maxCapacity: 20, currentCount: 0 },
        { id: uuidv4(), date, startTime: '16:00', endTime: '18:00', maxCapacity: 20, currentCount: 0 },
      );
    }
    return slots;
  };

  const defaultSlots = generateDefaultSlots();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.productName.trim()) newErrors.productName = '请输入商品名称';
    if (!formData.description.trim()) newErrors.description = '请输入商品描述';
    if (!formData.originalPrice || Number(formData.originalPrice) <= 0) newErrors.originalPrice = '请输入有效原价';
    if (!formData.groupPrice || Number(formData.groupPrice) <= 0) newErrors.groupPrice = '请输入有效拼团价';
    if (Number(formData.groupPrice) >= Number(formData.originalPrice)) newErrors.groupPrice = '拼团价必须低于原价';
    if (formData.minMembers < 3 || formData.minMembers > 10) newErrors.minMembers = '成团人数需在3-10人之间';
    if (selectedSlots.length === 0) newErrors.slots = '请至少选择一个取货时段';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createGroupBuy({
        productName: formData.productName,
        description: formData.description,
        originalPrice: Number(formData.originalPrice),
        groupPrice: Number(formData.groupPrice),
        minMembers: formData.minMembers,
        endTime: dayjs().add(formData.durationHours, 'hour').toISOString(),
        availableSlots: selectedSlots,
      });
      onClose();
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  const toggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.id === slot.id);
      if (exists) {
        return prev.filter((s) => s.id !== slot.id);
      }
      return [...prev, slot];
    });
  };

  const slotDates = [...new Set(defaultSlots.map((s) => s.date))];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>发起拼团</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>商品名称</label>
            <input
              style={{ ...styles.input, ...(errors.productName ? styles.inputError : {}) }}
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="例如：进口车厘子"
            />
            {errors.productName && <span style={styles.errorText}>{errors.productName}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>商品描述</label>
            <textarea
              style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述商品特点"
              rows={2}
            />
            {errors.description && <span style={styles.errorText}>{errors.description}</span>}
          </div>

          <div style={styles.row}>
            <div style={styles.fieldHalf}>
              <label style={styles.label}>原价 (元)</label>
              <input
                type="number"
                style={{ ...styles.input, ...(errors.originalPrice ? styles.inputError : {}) }}
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="99"
              />
              {errors.originalPrice && <span style={styles.errorText}>{errors.originalPrice}</span>}
            </div>
            <div style={styles.fieldHalf}>
              <label style={styles.label}>拼团价 (元)</label>
              <input
                type="number"
                style={{ ...styles.input, ...(errors.groupPrice ? styles.inputError : {}) }}
                value={formData.groupPrice}
                onChange={(e) => setFormData({ ...formData, groupPrice: e.target.value })}
                placeholder="69"
              />
              {errors.groupPrice && <span style={styles.errorText}>{errors.groupPrice}</span>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldHalf}>
              <label style={styles.label}>成团人数</label>
              <select
                style={styles.select}
                value={formData.minMembers}
                onChange={(e) => setFormData({ ...formData, minMembers: Number(e.target.value) })}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}人</option>
                ))}
              </select>
              {errors.minMembers && <span style={styles.errorText}>{errors.minMembers}</span>}
            </div>
            <div style={styles.fieldHalf}>
              <label style={styles.label}>拼团时长</label>
              <select
                style={styles.select}
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
              >
                {[2, 4, 8, 12, 24].map((h) => (
                  <option key={h} value={h}>{h}小时</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              取货时段 ({selectedSlots.length}个已选)
              <button type="button" style={styles.toggleBtn} onClick={() => setShowSlotPicker(!showSlotPicker)}>
                {showSlotPicker ? '收起' : '展开'}
              </button>
            </label>
            {showSlotPicker && (
              <div style={styles.slotPicker}>
                {slotDates.map((date) => (
                  <div key={date} style={styles.dateSection}>
                    <div style={styles.dateTitle}>{dayjs(date).format('MM月DD日 dddd')}</div>
                    <div style={styles.slotGrid}>
                      {defaultSlots.filter((s) => s.date === date).map((slot) => {
                        const isSelected = selectedSlots.some((s) => s.id === slot.id);
                        return (
                          <div
                            key={slot.id}
                            style={{
                              ...styles.slotItem,
                              ...(isSelected ? styles.slotSelected : {}),
                            }}
                            onClick={() => toggleSlot(slot)}
                          >
                            {slot.startTime}-{slot.endTime}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.slots && <span style={styles.errorText}>{errors.slots}</span>}
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '创建中...' : '发起拼团'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFF8E7',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '20px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  fieldHalf: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 500,
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E0D5C0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#FFF',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #E0D5C0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    backgroundColor: '#FFF',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #E0D5C0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFF',
    cursor: 'pointer',
  },
  inputError: {
    borderColor: '#FF7E67',
  },
  errorText: {
    color: '#FF7E67',
    fontSize: '12px',
  },
  toggleBtn: {
    marginLeft: '8px',
    background: 'none',
    border: 'none',
    color: '#4A90D9',
    cursor: 'pointer',
    fontSize: '12px',
  },
  slotPicker: {
    backgroundColor: '#FFF',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #E0D5C0',
  },
  dateSection: {
    marginBottom: '12px',
  },
  dateTitle: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: 500,
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  slotItem: {
    padding: '8px 12px',
    textAlign: 'center',
    borderRadius: '6px',
    backgroundColor: '#F5F5F5',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none',
  },
  slotSelected: {
    backgroundColor: '#4A90D9',
    color: '#FFF',
  },
  submitBtn: {
    padding: '12px',
    backgroundColor: '#FF7E67',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  },
};
