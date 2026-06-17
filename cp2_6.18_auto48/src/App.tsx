import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from './store';
import ItemCard from './components/ItemCard';
import StatsDashboard from './components/StatsDashboard';
import type {
  DonationItem,
  ItemCategory,
  ItemCondition,
} from './utils/dataManager';
import {
  getClaimsByItemId,
  formatRelativeTime,
} from './utils/dataManager';

const categories: ItemCategory[] = ['书籍', '衣物', '文具', '玩具', '其他'];
const conditions: ItemCondition[] = ['全新', '九成新', '七成新'];

const Toast: React.FC = () => {
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

const RippleButton: React.FC<RippleButtonProps> = ({ onClick, children, disabled, style, type = 'button' }) => {
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

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount, notifications, markAllNotificationsRead } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAdminClick = () => {
    const password = prompt('请输入管理员密码：');
    if (password === 'admin123') {
      navigate('/dashboard');
    } else if (password !== null) {
      alert('密码错误！');
    }
    setShowMenu(false);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          height: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#10B981',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '24px' }}>💚</span>
          <span>公益捐助</span>
        </Link>

        <div style={{ flex: 1, maxWidth: '400px', display: 'flex' }}>
          <input
            type="text"
            placeholder="搜索物品..."
            style={{
              width: '100%',
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                navigate(`/?search=${encodeURIComponent(target.value)}`);
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', display: 'none' }} className="desktop-notif">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>通知</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      style={{
                        fontSize: '12px',
                        color: '#10B981',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      全部已读
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                    暂无通知
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: n.read ? 'transparent' : '#F0FDF4',
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#1F2937' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', display: 'none' }} className="desktop-admin">
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                padding: '6px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              管理
            </button>
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  minWidth: '150px',
                }}
              >
                <button
                  onClick={handleAdminClick}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  统计看板
                </button>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '8px 0',
          }}
        >
          <div
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              color: '#374151',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            🔔 通知 ({unreadCount})
          </div>
          <button
            onClick={handleAdminClick}
            style={{
              width: '100%',
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            📊 统计看板
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 640px) {
          .mobile-menu-btn { display: none !important; }
          .desktop-notif { display: block !important; }
          .desktop-admin { display: block !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
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

        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', alignSelf: 'center', marginRight: '4px' }}>
            分类：
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#D1FAE5' : '#F3F4F6',
                  color: isSelected ? '#065F46' : '#6B7280',
                  transition: 'all 0.2s ease-out',
                }}
              >
                {cat}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#6B7280',
              }}
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
    </div>
  );
};

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loadData, claimItem, completeDonation } = useAppStore();
  const [claims, setClaims] = useState(getClaimsByItemId(id || ''));
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimantName, setClaimantName] = useState('');
  const [claimantContact, setClaimantContact] = useState('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (id) {
      setClaims(getClaimsByItemId(id));
    }
  }, [id, items]);

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: '#6B7280', marginBottom: '16px' }}>物品不存在</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  const handleClaimSubmit = () => {
    if (!claimantName.trim() || !claimantContact.trim()) {
      alert('请填写完整的认领信息');
      return;
    }
    if (claimantName.length > 10) {
      alert('昵称不能超过10个字符');
      return;
    }
    claimItem({
      itemId: item.id,
      claimantName: claimantName.trim(),
      claimantContact: claimantContact.trim(),
    });
    setShowClaimModal(false);
    setClaimantName('');
    setClaimantContact('');
    setClaims(getClaimsByItemId(item.id));
  };

  const pendingClaims = claims.filter((c) => c.status === '待确认');

  return (
    <div style={{ padding: '24px 0', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          background: 'none',
          color: '#10B981',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        ← 返回列表
      </button>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '400px',
            backgroundColor: '#F3F4F6',
            overflow: 'hidden',
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                color: '#D1D5DB',
              }}
            >
              📦
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
              {item.name}
            </h1>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor:
                  item.status === '待认领' ? '#D1FAE5' :
                  item.status === '已认领' ? '#FFEDD5' : '#E5E7EB',
                color:
                  item.status === '待认领' ? '#065F46' :
                  item.status === '已认领' ? '#9A3412' : '#6B7280',
              }}
            >
              {item.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {item.condition}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              📍 {item.location}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#F3E8FF',
                color: '#6B21A8',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {item.category}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
            发布于 {formatRelativeTime(item.createdAt)}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px 0' }}>
              物品描述
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {item.description || '暂无描述'}
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px 0' }}>
              联系方式
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
              微信：<span style={{ fontWeight: 600 }}>{item.contactWechat}</span>
            </p>
          </div>

          {pendingClaims.length > 0 && item.status === '已认领' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 12px 0' }}>
                认领信息
              </h3>
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#1F2937', marginBottom: '4px' }}>
                    <strong>认领人：</strong>{claim.claimantName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1F2937', marginBottom: '12px' }}>
                    <strong>联系方式：</strong>{claim.claimantContact}
                  </div>
                  <button
                    onClick={() => completeDonation(item.id)}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    确认捐赠完成
                  </button>
                </div>
              ))}
            </div>
          )}

          {item.status === '待认领' && (
            <RippleButton onClick={() => setShowClaimModal(true)} style={{ padding: '14px 40px', fontSize: '16px' }}>
              认领此物品
            </RippleButton>
          )}
          {item.status === '已完成' && (
            <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#6B7280' }}>
              此物品已完成捐赠
            </div>
          )}
        </div>
      </div>

      {showClaimModal && (
        <div
          style={{
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
            padding: '16px',
          }}
          onClick={() => setShowClaimModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', margin: '0 0 20px 0' }}>
              认领物品
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                您的昵称（最多10字）
              </label>
              <input
                type="text"
                value={claimantName}
                maxLength={10}
                onChange={(e) => setClaimantName(e.target.value)}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                联系方式（微信或手机号，必填）
              </label>
              <input
                type="text"
                value={claimantContact}
                onChange={(e) => setClaimantContact(e.target.value)}
                placeholder="请输入微信或手机号"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClaimModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <RippleButton onClick={handleClaimSubmit}>
                确认认领
              </RippleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, loadData } = useAppStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = () => {
    if (password === 'admin123') {
      setAuthenticated(true);
    } else {
      alert('密码错误！');
    }
  };

  if (!authenticated) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
              管理员登录
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0 0 0' }}>
              请输入管理员密码访问统计看板
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="请输入密码"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
          />

          <RippleButton onClick={handleLogin} style={{ width: '100%', padding: '12px' }}>
            登录
          </RippleButton>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              border: 'none',
              background: 'none',
              color: '#6B7280',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          background: 'none',
          color: '#10B981',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ← 返回首页
      </button>
      <StatsDashboard items={items} />
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ECFDF5' }}>
      <Navbar />
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 24px 40px 24px',
        }}
      >
        {children}
      </main>
      <Toast />
      <style>{`
        @keyframes ripple {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 160px; height: 160px; opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
