import { useState, useRef, useEffect } from 'react';
import { Card, GroupType } from '../../../shared/types';
import './CardItem.css';

interface GroupInfo {
  key: GroupType | string;
  label: string;
}

interface CardItemProps {
  card: Card;
  isExpanded: boolean;
  isNew: boolean;
  groups: GroupInfo[];
  onClick: () => void;
  onGroupChange: (cardId: string, group: string) => void;
}

const CardItem = ({ card, isExpanded, isNew, groups, onClick, onGroupChange }: CardItemProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNew) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGroupLabel = (groupKey: string) => {
    const group = groups.find(g => g.key === groupKey);
    return group ? group.label : groupKey;
  };

  const handleGroupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleGroupSelect = (e: React.MouseEvent, groupKey: string) => {
    e.stopPropagation();
    onGroupChange(card.id, groupKey);
    setShowDropdown(false);
  };

  return (
    <div
      className={`card-item ${isExpanded ? 'expanded' : ''} ${isNew ? 'new-card' : ''}`}
      onClick={onClick}
    >
      <div className="card-item-header">
        <div className="card-item-avatar">
          {card.avatarUrl ? (
            <img src={card.avatarUrl} alt={card.name} />
          ) : (
            <span>{card.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="card-item-info">
          <h3 className="card-item-name">{card.name}</h3>
          <p className="card-item-position">{card.position}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="card-item-details">
          <div className="detail-row">
            <span className="detail-label">公司</span>
            <span className="detail-value">{card.company || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">邮箱</span>
            <span className="detail-value">{card.email || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">电话</span>
            <span className="detail-value">{card.phone || '-'}</span>
          </div>
          {card.bio && (
            <div className="detail-row bio-row">
              <span className="detail-label">简介</span>
              <p className="detail-value bio-text">{card.bio}</p>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">交换时间</span>
            <span className="detail-value">{formatDate(card.exchangedAt)}</span>
          </div>
          
          <div className="group-selector" ref={dropdownRef}>
            <span className="detail-label">分组</span>
            <button
              className="group-dropdown-btn"
              onClick={handleGroupClick}
            >
              {getGroupLabel(card.group)}
              <span className="dropdown-arrow">▼</span>
            </button>
            {showDropdown && (
              <div className="group-dropdown-menu">
                {groups.map(group => (
                  <button
                    key={group.key}
                    className={`dropdown-option ${card.group === group.key ? 'selected' : ''}`}
                    onClick={(e) => handleGroupSelect(e, group.key)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-item-footer">
        <span className="expand-hint">{isExpanded ? '收起' : '展开详情'}</span>
      </div>

      {isNew && (
        <div className="new-badge">新</div>
      )}
    </div>
  );
};

export default CardItem;
