import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFoodStore } from '../store/useFoodStore';
import type { Food } from '../types';
import styles from './InventoryPage.module.css';

const commonUnits = ['个', 'g', 'kg', 'ml', 'L', '把', '包', '瓶', '盒', '袋'];

const getDaysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const FoodCard = ({
  food,
  isSelected,
  isSelectMode,
  onToggle,
  onEdit,
  onDelete,
  animationDelay,
}: {
  food: Food;
  isSelected: boolean;
  isSelectMode: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  animationDelay: number;
}) => {
  const days = getDaysUntilExpiry(food.expiryDate);
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 7;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
        animation: `fadeIn 0.3s ease-out ${animationDelay}ms forwards`,
      }}
    >
      {isSelectMode && (
        <label className={styles.checkboxWrap} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isSelected}
            onChange={onToggle}
          />
        </label>
      )}

      <div className={styles.badgeContainer}>
        {isExpired && <span className={`${styles.badge} ${styles.badgeDanger}`}>已过期</span>}
        {!isExpired && isExpiringSoon && (
          <span className={`${styles.badge} ${styles.badgeWarning}`}>{days}天到期</span>
        )}
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.foodName}>{food.name}</h3>
        <div className={styles.foodMeta}>
          <span className={styles.quantity}>
            {food.quantity} {food.unit}
          </span>
        </div>
        <div className={styles.dates}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>购买</span>
            <span className={styles.dateValue}>{food.purchaseDate}</span>
          </div>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>到期</span>
            <span
              className={`${styles.dateValue} ${
                isExpired ? styles.textDanger : isExpiringSoon ? styles.textWarning : ''
              }`}
            >
              {food.expiryDate}
            </span>
          </div>
        </div>
        {food.notes && <p className={styles.notes}>{food.notes}</p>}
      </div>

      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit}>
          编辑
        </button>
        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={onDelete}>
          删除
        </button>
      </div>
    </div>
  );
};

const FoodFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (food: Omit<Food, 'id'> & { id?: string }) => void;
  initialData?: Food;
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [unit, setUnit] = useState(initialData?.unit || '个');
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchaseDate || new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setQuantity(initialData?.quantity?.toString() || '1');
      setUnit(initialData?.unit || '个');
      setPurchaseDate(initialData?.purchaseDate || new Date().toISOString().split('T')[0]);
      setExpiryDate(initialData?.expiryDate || '');
      setNotes(initialData?.notes || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiryDate) return;
    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      unit,
      purchaseDate,
      expiryDate,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{initialData ? '编辑食材' : '添加食材'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              <span>食材名称</span>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入食材名称"
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              <span>数量</span>
              <div className={styles.quantityGroup}>
                <input
                  type="number"
                  className={styles.formInput}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                />
                <select
                  className={styles.formSelect}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {commonUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              <span>购买日期</span>
              <input
                type="date"
                className={styles.formInput}
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              <span>到期日期</span>
              <input
                type="date"
                className={styles.formInput}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              <span>备注</span>
              <textarea
                className={styles.formTextarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="可选备注信息"
                rows={2}
              />
            </label>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={styles.submitBtn}>
              {initialData ? '保存修改' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const {
    foods,
    selectedIds,
    fetchFoods,
    addFood,
    updateFood,
    deleteFood,
    batchDelete,
    batchExpire,
    toggleSelect,
    selectAll,
    clearSelection,
  } = useFoodStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | undefined>();
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    if (selectedIds.size === 0 && !isSelectMode) return;
    if (selectedIds.size === 0 && isSelectMode) {
      setIsSelectMode(false);
    }
  }, [selectedIds, isSelectMode]);

  const handleSubmit = (data: Omit<Food, 'id'> & { id?: string }) => {
    if (data.id) {
      updateFood(data.id, data);
    } else {
      const newFood: Food = {
        ...data,
        id: uuidv4(),
      } as Food;
      addFood(newFood);
    }
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个食材吗？')) {
      await deleteFood(id);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.size} 个食材吗？`)) {
      await batchDelete(Array.from(selectedIds));
    }
  };

  const handleBatchExpire = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要将选中的 ${selectedIds.size} 个食材标记为已过期吗？`)) {
      await batchExpire(Array.from(selectedIds));
    }
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      clearSelection();
    }
    setIsSelectMode(!isSelectMode);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>食材库存</h1>
          <p className={styles.pageSubtitle}>共 {foods.length} 种食材</p>
        </div>
        <div className={styles.headerActions}>
          {foods.length > 0 && (
            <button
              className={`${styles.headerBtn} ${isSelectMode ? styles.activeBtn : ''}`}
              onClick={toggleSelectMode}
            >
              {isSelectMode ? '取消选择' : '批量操作'}
            </button>
          )}
          <button
            className={styles.primaryBtn}
            onClick={() => {
              setEditingFood(undefined);
              setIsModalOpen(true);
            }}
          >
            + 添加食材
          </button>
        </div>
      </header>

      {isSelectMode && selectedIds.size > 0 && (
        <div className={styles.batchBar}>
          <span className={styles.batchInfo}>
            已选择 <strong>{selectedIds.size}</strong> 项
          </span>
          <div className={styles.batchActions}>
            <button className={styles.batchBtn} onClick={selectAll}>
              全选
            </button>
            <button className={`${styles.batchBtn} ${styles.batchExpire}`} onClick={handleBatchExpire}>
              批量设置过期
            </button>
            <button className={`${styles.batchBtn} ${styles.batchDelete}`} onClick={handleBatchDelete}>
              批量删除
            </button>
          </div>
        </div>
      )}

      {foods.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>🥗</p>
          <p className={styles.emptyText}>还没有添加食材</p>
          <p className={styles.emptyHint}>点击右上角「添加食材」开始管理你的库存</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {foods.map((food, index) => (
            <FoodCard
              key={food.id}
              food={food}
              isSelected={selectedIds.has(food.id)}
              isSelectMode={isSelectMode}
              onToggle={() => toggleSelect(food.id)}
              onEdit={() => handleEdit(food)}
              onDelete={() => handleDelete(food.id)}
              animationDelay={Math.min(index * 50, 500)}
            />
          ))}
        </div>
      )}

      <FoodFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingFood}
      />
    </div>
  );
};

export default InventoryPage;
