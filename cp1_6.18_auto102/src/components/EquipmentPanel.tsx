import React, { useState, useCallback, useMemo } from 'react';
import {
  useEquipmentStore,
  CATEGORIES,
  STATUSES,
  CATEGORY_COLORS,
  type Category,
  type Status,
} from '@/stores/equipmentStore';
import EquipmentCard from './EquipmentCard';
import styles from './EquipmentPanel.module.css';

const EquipmentPanel: React.FC = () => {
  const equipments = useEquipmentStore((s) => s.equipments);
  const plans = useEquipmentStore((s) => s.plans);
  const filterCategory = useEquipmentStore((s) => s.filterCategory);
  const filterStatus = useEquipmentStore((s) => s.filterStatus);
  const addEquipment = useEquipmentStore((s) => s.addEquipment);
  const removeEquipment = useEquipmentStore((s) => s.removeEquipment);
  const filterByCategory = useEquipmentStore((s) => s.filterByCategory);
  const filterByStatus = useEquipmentStore((s) => s.filterByStatus);
  const savePlan = useEquipmentStore((s) => s.savePlan);
  const loadPlan = useEquipmentStore((s) => s.loadPlan);
  const deletePlan = useEquipmentStore((s) => s.deletePlan);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('露营');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<Status>('已拥有');
  const [planName, setPlanName] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 50);
  }, []);

  const handleAdd = useCallback(() => {
    if (!name.trim() || !weight) return;
    addEquipment({
      name: name.trim(),
      category,
      weight: Number(weight),
      status,
    });
    setName('');
    setWeight('');
    triggerShake();
  }, [name, weight, category, status, addEquipment, triggerShake]);

  const handleFilterCategory = useCallback(
    (cat: Category | null) => {
      filterByCategory(cat);
      triggerShake();
    },
    [filterByCategory, triggerShake]
  );

  const handleSavePlan = useCallback(() => {
    if (!planName.trim()) return;
    savePlan(planName.trim());
    setPlanName('');
    triggerShake();
  }, [planName, savePlan, triggerShake]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      if (filterCategory && eq.category !== filterCategory) return false;
      if (filterStatus && eq.status !== filterStatus) return false;
      return true;
    });
  }, [equipments, filterCategory, filterStatus]);

  const handleExport = useCallback(() => {
    const packingItems = useEquipmentStore.getState().packingItems;
    const allEquipments = useEquipmentStore.getState().equipments;
    const lines = packingItems.map((pi) => {
      const eq = allEquipments.find((e) => e.id === pi.equipmentId);
      if (!eq) return '';
      return `${eq.name}-${eq.weight}g-${pi.checked ? '已勾选' : '未勾选'}`;
    }).filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '打包清单.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>装备库</h2>

      <div className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="装备名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className={styles.input}
          type="number"
          placeholder="重量(克)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min={0}
        />
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className={styles.addBtn} onClick={handleAdd}>
          添加装备
        </button>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${!filterCategory ? styles.filterActive : ''}`}
          onClick={() => handleFilterCategory(null)}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`${styles.filterBtn} ${filterCategory === c ? styles.filterActive : ''}`}
            style={filterCategory === c ? { borderColor: CATEGORY_COLORS[c] } : undefined}
            onClick={() => handleFilterCategory(c)}
          >
            {c}
          </button>
        ))}
        <select
          className={styles.statusFilter}
          value={filterStatus || ''}
          onChange={(e) => filterByStatus((e.target.value as Status) || null)}
        >
          <option value="">全部状态</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.equipmentList} ${shake ? styles.shake : ''}`}>
        {filteredEquipments.length === 0 && (
          <div className={styles.emptyList}>暂无装备，请添加</div>
        )}
        {filteredEquipments.map((eq) => (
          <div key={eq.id} className={styles.equipmentWrapper}>
            <EquipmentCard equipment={eq} />
            <button
              className={styles.deleteBtn}
              onClick={() => removeEquipment(eq.id)}
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className={styles.planSection}>
        <h3 className={styles.planTitle}>方案管理</h3>
        <div className={styles.planInput}>
          <input
            className={styles.input}
            type="text"
            placeholder="方案名称"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
          />
          <button className={styles.saveBtn} onClick={handleSavePlan}>
            保存
          </button>
        </div>
        <div className={styles.planList}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.planItem}>
              <span
                className={styles.planName}
                onClick={() => loadPlan(plan.id)}
                title="点击加载"
              >
                {plan.name}
              </span>
              <button
                className={styles.planDeleteBtn}
                onClick={() => deletePlan(plan.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className={styles.exportBtn} onClick={handleExport}>
          导出清单
        </button>
      </div>
    </div>
  );
};

export default EquipmentPanel;
