import React, { useState, useRef, useEffect } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const checkboxRef = useRef<HTMLDivElement>(null);
  const prevSelectedRef = useRef(selected);

  useEffect(() => {
    if (selected && !prevSelectedRef.current && checkboxRef.current) {
      checkboxRef.current.classList.remove('checkbox-pop');
      void checkboxRef.current.offsetWidth;
      checkboxRef.current.classList.add('checkbox-pop');
    }
    prevSelectedRef.current = selected;
  }, [selected]);

  const handleCheckboxClick = () => {
    onToggleSelect(product.id);
  };

  const handleDeleteClick = () => {
    if (window.confirm(`确定要删除商品 "${product.name}" 吗？`)) {
      onDelete(product.id);
    }
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: isHovered
      ? '0 8px 20px rgba(0,0,0,0.1)'
      : '0 2px 4px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const checkboxStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    left: '12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    boxSizing: 'border-box',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: selected ? '#22c55e' : '#d1d5db',
    backgroundColor: selected ? '#22c55e' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  };

  const checkIconStyle: React.CSSProperties = {
    color: '#ffffff',
    width: '14px',
    height: '14px',
    strokeWidth: 3,
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: '8px',
    right: '8px',
    bottom: '8px',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: '6px',
    transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.25s ease-out',
    zIndex: 5,
  };

  const productNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const productPriceStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ef4444',
    margin: 0,
  };

  const actionsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    bottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 10,
  };

  const actionButtonBaseStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.15s ease',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  };

  const editButtonStyle: React.CSSProperties = {
    ...actionButtonBaseStyle,
    backgroundColor: '#ffffff',
    color: '#3b82f6',
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...actionButtonBaseStyle,
    backgroundColor: '#ffffff',
    color: '#ef4444',
  };

  const actionIconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        .checkbox-pop {
          animation: checkboxPop 0.15s ease-out;
        }
        @keyframes checkboxPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.3); }
          70% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        ref={checkboxRef}
        style={checkboxStyle}
        onClick={handleCheckboxClick}
      >
        {selected && <Check style={checkIconStyle} />}
      </div>

      <div style={imageContainerStyle}>
        <img
          src={product.image}
          alt={product.name}
          style={imageStyle}
          draggable={false}
        />
        <div style={overlayStyle}>
          <p style={productNameStyle}>{product.name}</p>
          <p style={productPriceStyle}>¥{product.price.toFixed(2)}</p>
        </div>
      </div>

      <div style={actionsContainerStyle}>
        <button
          style={editButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product);
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          title="编辑"
        >
          <Pencil style={actionIconStyle} />
        </button>
        <button
          style={deleteButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fef2f2';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          title="删除"
        >
          <Trash2 style={actionIconStyle} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
