import React, { useMemo } from 'react';
import { Medicine, FilterType, SortType } from '../types';
import MedicineCard from './MedicineCard';
import { filterMedicines, sortMedicines } from '../utils/medicineUtils';

interface MedicineListProps {
  medicines: Medicine[];
  filter: FilterType;
  sortBy: SortType;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
}

const MedicineList: React.FC<MedicineListProps> = ({
  medicines,
  filter,
  sortBy,
  onEdit,
  onDelete,
}) => {
  const displayedMedicines = useMemo(() => {
    const filtered = filterMedicines(medicines, filter);
    return sortMedicines(filtered, sortBy);
  }, [medicines, filter, sortBy]);

  if (displayedMedicines.length === 0) {
    return (
      <div className="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#bdc3c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <p>暂无药品数据</p>
        <p className="empty-subtext">点击右上角"添加药品"开始管理</p>
      </div>
    );
  }

  return (
    <div className="medicine-grid">
      {displayedMedicines.map(medicine => (
        <MedicineCard
          key={medicine.id}
          medicine={medicine}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default MedicineList;
