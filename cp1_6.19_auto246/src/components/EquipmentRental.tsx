import React, { useState, useCallback } from 'react';
import { useTourStore } from '../store/tourStore';

interface EquipmentFormState {
  equipmentName: string;
  days: number;
  unitPrice: number;
}

const EquipmentRental: React.FC<{ tourEventId: string }> = ({ tourEventId }) => {
  const { getEquipmentForTour, addEquipment, removeEquipment, fetchEquipment } = useTourStore();
  const orders = getEquipmentForTour(tourEventId);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<EquipmentFormState>({
    equipmentName: '',
    days: 1,
    unitPrice: 0,
  });

  const handleSubmit = useCallback(async () => {
    if (!formState.equipmentName || formState.unitPrice <= 0) return;
    await addEquipment({
      tourEventId,
      equipmentName: formState.equipmentName.substring(0, 20),
      days: formState.days,
      unitPrice: formState.unitPrice,
    });
    setShowForm(false);
    setFormState({ equipmentName: '', days: 1, unitPrice: 0 });
  }, [formState, tourEventId, addEquipment]);

  const handleRemove = useCallback(async (id: string) => {
    await removeEquipment(id);
  }, [removeEquipment]);

  return (
    <div className="equipment-section">
      <h3>设备租赁</h3>
      {orders.length === 0 ? (
        <p style={{ fontSize: 13, color: '#BDC3C7', padding: '8px 0' }}>暂无设备订单</p>
      ) : (
        <ul className="equipment-list">
          {orders.map(order => (
            <li key={order.id}>
              <span className="eq-name" title={order.equipmentName}>{order.equipmentName}</span>
              <span className="eq-details">
                <span>{order.days}天</span>
                <span>¥{order.unitPrice}/天</span>
                <span className="eq-total">¥{(order.days * order.unitPrice).toLocaleString()}</span>
              </span>
              <button onClick={() => handleRemove(order.id)}>删除</button>
            </li>
          ))}
        </ul>
      )}
      <button className="add-equipment-btn" onClick={() => setShowForm(!showForm)}>
        + 添加设备
      </button>
      {showForm && (
        <div className="equipment-form">
          <div className="form-row">
            <label>设备名称</label>
            <input
              type="text"
              maxLength={20}
              value={formState.equipmentName}
              onChange={e => setFormState({ ...formState, equipmentName: e.target.value })}
              placeholder="最多20字符"
            />
          </div>
          <div className="form-row">
            <label>租用天数</label>
            <input
              type="range"
              min={1}
              max={14}
              value={formState.days}
              onChange={e => setFormState({ ...formState, days: Number(e.target.value) })}
            />
            <span className="slider-value">{formState.days}</span>
          </div>
          <div className="form-row">
            <label>单价 (¥)</label>
            <input
              type="number"
              min={0}
              value={formState.unitPrice || ''}
              onChange={e => setFormState({ ...formState, unitPrice: Number(e.target.value) })}
            />
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowForm(false)}>取消</button>
            <button className="submit-btn" onClick={handleSubmit}>确认添加</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentRental;
