import React from 'react';
import { Medicine } from '../types';
import { getExpiryStatus, getExpiryText, getStockPercentage, isLowStock, ExpiryStatus } from '../utils/medicineUtils';

interface MedicineCardProps {
  medicine: Medicine;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
  style?: React.CSSProperties;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onEdit, onDelete, style }) => {
  const status = getExpiryStatus(medicine.expiryDate);
  const expiryText = getExpiryText(medicine.expiryDate);
  const stockPercent = getStockPercentage(medicine.quantity);
  const lowStock = isLowStock(medicine.quantity);

  const getCardBgClass = (status: ExpiryStatus): string => {
    switch (status) {
      case 'expired':
        return 'medicine-card expired';
      case 'expiringSoon':
        return 'medicine-card expiring-soon';
      default:
        return 'medicine-card normal';
    }
  };

  const getStatusTextClass = (status: ExpiryStatus): string => {
    switch (status) {
      case 'expired':
        return 'expiry-text expired';
      case 'expiringSoon':
        return 'expiry-text expiring-soon';
      default:
        return 'expiry-text normal';
    }
  };

  return (
    <div className={getCardBgClass(status)} style={style}>
      <div className="card-header">
        <h3 className="medicine-name">{medicine.name}</h3>
        <span className="medicine-location">{medicine.location}</span>
      </div>

      {medicine.specification && (
        <p className="medicine-spec">{medicine.specification}</p>
      )}

      <div className="stock-section">
        <div className="stock-header">
          <span className="stock-label">剩余数量</span>
          <span className={`stock-value ${lowStock ? 'low' : ''}`}>{medicine.quantity}</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${lowStock ? 'low' : ''}`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
      </div>

      <div className="expiry-section">
        <span className="expiry-label">有效期</span>
        <span className={getStatusTextClass(status)}>{expiryText}</span>
      </div>

      <div className="card-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(medicine)}
          title="编辑"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(medicine)}
          title="删除"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MedicineCard;
