import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import ItemCard from '../components/ItemCard';
import type {
  DonationItem,
  ItemCategory,
  ItemCondition,
} from '../utils/dataManager';

const categories: ItemCategory[] = ['书籍', '衣物', '文具', '玩具', '其他'];
const conditions: ItemCondition[] = ['全新', '九成新', '七成新'];

export const Toast: React.FC = () => {
  const { toast } = useAppStore();
  if (!toast.show) return null;

  const bgColor =
    toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
    toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
    'rgba(0, 0, 0, 0.8)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: '8px',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {toast.message}
    </div>
  );
};

interface RippleButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
}

export const RippleButton: React.FC<RippleButtonProps> = ({ onClick, children, disabled, style, type = 'button' }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onClick) onClick(e);
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: disabled ? '#9CA3AF' : '#22C55E',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease-out',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#16A34A';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#22C55E';
        }
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '0',
            height: '0',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            opacity: 0.6,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.5s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
    </button>
  );
};

interface PublishFormProps {
  onPublished?: () => void;
}

const PublishForm: React.FC<PublishFormProps> = ({ onPublished }) => {
  const { addItem, showToast } = useAppStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('书籍');
  const [condition, setCondition] = useState<ItemCondition>('全新');
  const [contactWechat, setContactWechat] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('图片大小不能超过2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('请输入物品名称', 'error');
      return;
    }
    if (!contactWechat.trim()) {
      showToast('请输入联系人微信', 'error');
      return;
    }

    addItem({
      name: name.trim(),
      category,
      condition,
      contactWechat: contactWechat.trim(),
      description: description.trim(),
      image,
    });

    setName('');
    setCategory('书籍');
    setCondition('全新');
    setContactWechat('');
    setDescription('');
    setImage('');
    onPublished?.();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#F0FDF4',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#065F46', margin: '0 0 20px 0' }}>
        发布捐助物品
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <label style={labelStyle}>物品名称（最多30字）</label>
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入物品名称"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            style={inputStyle}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>成色</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
            style={inputStyle}
          >
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>联系人微信</label>
          <input
            type="text"
            value={contactWechat}
            onChange={(e) => setContactWechat(e.target.value)}
            placeholder="请输入微信号"
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>图片（限1张，不超过2MB）</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ fontSize: '14px' }}
            />
            {image && (
              <div style={{ position: 'relative' }}>
                <img src={image} alt="预览" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>详细描述（最多500字）</label>
          <textarea
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述物品的详细情况..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <RippleButton type="submit" style={{ padding: '12px 32px', fontSize: '16px' }}>
          发布物品
        </RippleButton>
      </div>
    </form>
  );
};

interface WaterfallGridProps {
  items: DonationItem[];
}

const WaterfallGrid: React.FC<WaterfallGridProps> = ({ items }) => {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnItems = useMemo(() => {
    const result: DonationItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => {
      result[index % columns].push(item);
    });
    return result;
  }, [items, columns]);

  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9CA3AF',
          fontSize: '16px',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
        暂无物品，快来发布第一个捐助物品吧！
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {column.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
};

const HomePage: React.FC = () => {
  const { items, loadData } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | ''>('');
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (debouncedSearch && !item.name.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
        return false;
      }
      if (selectedCondition && item.condition !== selectedCondition) {
        return false;
      }
      return true;
    });
  }, [items, debouncedSearch, selectedCategories, selectedCondition]);

  useEffect(() => {
    setListKey((k) => k + 1);
  }, [filteredItems.length]);

  const toggleCategory = (cat: ItemCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <PublishForm onPublished={() => loadData()} />

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as ItemCondition | '')}
              style={{
                padding: '10px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                outline: 'none',
              }}
            >
              <option value="">全部成色</option>
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="category-filter-container" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', alignSelf: 'center', marginRight: '4px' }}>
            分类：
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`category-tag ${isSelected ? 'category-tag--selected' : ''}`}
              >
                {cat}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="category-clear-btn"
            >
              清除
            </button>
          )}
        </div>

        <div style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
          共找到 <strong style={{ color: '#10B981' }}>{filteredItems.length}</strong> 件物品
        </div>
      </div>

      <div key={listKey}>
        <WaterfallGrid items={filteredItems} />
      </div>

      <style>{`
        .category-tag {
          padding: 6px 14px;
          border-radius: 20px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          background-color: #F3F4F6;
          color: #6B7280;
          transition: all 0.2s ease-out;
        }
        .category-tag:hover {
          background-color: #E5E7EB;
        }
        .category-tag--selected {
          background-color: #D1FAE5 !important;
          color: #065F46 !important;
        }
        .category-clear-btn {
          padding: 6px 12px;
          border-radius: 20px;
          border: none;
          font-size: 13px;
          cursor: pointer;
          background-color: transparent;
          color: #6B7280;
        }
        .category-clear-btn:hover {
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
