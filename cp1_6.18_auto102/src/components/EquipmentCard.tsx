import React from 'react';
import { Equipment, CATEGORY_COLORS } from '@/stores/equipmentStore';
import { useDrag } from '@/hooks/useDrag';
import styles from './EquipmentCard.module.css';

interface EquipmentCardProps {
  equipment: Equipment;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment }) => {
  const dragHandlers = useDrag({ equipmentId: equipment.id, type: 'equipment' });

  const color = CATEGORY_COLORS[equipment.category];

  return (
    <div
      className={styles.card}
      {...dragHandlers}
    >
      <div className={styles.colorBar} style={{ backgroundColor: color }} />
      <div className={styles.info}>
        <span className={styles.name}>{equipment.name}</span>
        <span className={styles.category} style={{ color }}>{equipment.category}</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.weight}>{equipment.weight}g</span>
        <span
          className={`${styles.status} ${equipment.status === '已拥有' ? styles.owned : styles.pending}`}
        >
          {equipment.status}
        </span>
      </div>
    </div>
  );
};

export default EquipmentCard;
