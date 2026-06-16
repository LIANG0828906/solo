import React, { useState, useMemo, useEffect } from 'react';
import type { StockComputed, StockHolding, SortState, SortDirection } from '../../data/types';

interface StockTableProps {
  holdings: StockComputed[];
  onAdd: (stock: Omit<StockHolding, 'id'>) => void;
  onEdit: (id: string, stock: Omit<StockHolding, 'id'>) => void;
  onDelete: (id: string) => void;
  onSelect: (stock: StockComputed) => void;
  selectedId?: string | null;
}

interface FormErrors {
  code?: string;
  name?: string;
  quantity?: string;
  buyPrice?: string;
  currentPrice?: string;
}

const COLUMNS: { key: keyof StockComputed; label: string; align?: 'right' }[] = [
  { key: 'code', label: '代码' },
  { key: 'name', label: '名称' },
  { key: 'quantity', label: '数量', align: 'right' },
  { key: 'buyPrice', label: '买入价', align: 'right' },
  { key: 'currentPrice', label: '现价', align: 'right' },
  { key: 'cost', label: '成本', align: 'right' },
  { key: 'marketValue', label: '市值', align: 'right' },
  { key: 'profit', label: '盈亏', align: 'right' },
  { key: 'profitPercent', label: '盈亏%', align: 'right' },
];

const StockTable: React.FC<StockTableProps> = ({ holdings, onAdd, onEdit, onDelete, onSelect, selectedId }) => {
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingStock, setEditingStock] = useState<StockComputed | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    quantity: '',
    buyPrice: '',
    currentPrice: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const sortedHoldings = useMemo(() => {
    if (!sortState.key || !sortState.direction) return holdings;

    return [...holdings].sort((a, b) => {
      const aVal = a[sortState.key!];
      const bVal = b[sortState.key!];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortState.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [holdings, sortState]);

  const handleSort = (key: keyof StockComputed) => {
    setSortState((prev) => {
      let direction: SortDirection;
      if (prev.key !== key) {
        direction = 'asc';
      } else if (prev.direction === 'asc') {
        direction = 'desc';
      } else if (prev.direction === 'desc') {
        direction = null;
        return { key: null, direction: null };
      } else {
        direction = 'asc';
      }
      return { key, direction };
    });
  };

  const openAddModal = () => {
    setEditingStock(null);
    setFormData({ code: '', name: '', quantity: '', buyPrice: '', currentPrice: '' });
    setErrors({});
    setShowModal(true);
    setIsClosing(false);
  };

  const openEditModal = (stock: StockComputed) => {
    setEditingStock(stock);
    setFormData({
      code: stock.code,
      name: stock.name,
      quantity: String(stock.quantity),
      buyPrice: String(stock.buyPrice),
      currentPrice: String(stock.currentPrice),
    });
    setErrors({});
    setShowModal(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setEditingStock(null);
    }, 300);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = '请输入股票代码';
    }

    if (!formData.name.trim()) {
      newErrors.name = '请输入股票名称';
    }

    const qty = parseFloat(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }

    const buy = parseFloat(formData.buyPrice);
    if (!formData.buyPrice || isNaN(buy) || buy <= 0) {
      newErrors.buyPrice = '请输入有效的买入价格';
    }

    const cur = parseFloat(formData.currentPrice);
    if (!formData.currentPrice || isNaN(cur) || cur <= 0) {
      newErrors.currentPrice = '请输入有效的当前价格';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const stockData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      quantity: parseFloat(formData.quantity),
      buyPrice: parseFloat(formData.buyPrice),
      currentPrice: parseFloat(formData.currentPrice),
    };

    if (editingStock) {
      onEdit(editingStock.id, stockData);
    } else {
      onAdd(stockData);
    }

    closeModal();
  };

  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter') handleSubmit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, formData, editingStock]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (num: number): string => {
    const sign = num > 0 ? '+' : '';
    return sign + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  };

  const renderCell = (stock: StockComputed, key: keyof StockComputed) => {
    const value = stock[key];

    if (key === 'profit') {
      const num = value as number;
      const sign = num > 0 ? '+' : '';
      return (
        <span className={num >= 0 ? 'profit' : 'loss'}>
          {sign}
          {formatNumber(num)}
        </span>
      );
    }

    if (key === 'profitPercent') {
      const num = value as number;
      return <span className={num >= 0 ? 'profit' : 'loss'}>{formatPercent(num)}</span>;
    }

    if (typeof value === 'number') {
      return formatNumber(value);
    }

    return String(value);
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <h2>持仓明细</h2>
        <button className="btn" onClick={openAddModal}>
          + 添加股票
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="empty-state">
          <p>暂无持仓数据</p>
          <button className="btn" onClick={openAddModal}>
            添加第一支股票
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="stock-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{ textAlign: col.align || 'left' }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <span
                      className={`sort-icon ${sortState.key === col.key ? 'active' : ''}`}
                    >
                      {sortState.key === col.key
                        ? sortState.direction === 'asc'
                          ? '▲'
                          : sortState.direction === 'desc'
                          ? '▼'
                          : '⇅'
                        : '⇅'}
                    </span>
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((stock) => (
                <tr
                  key={stock.id}
                  className={stock.profit >= 0 ? 'profit-row' : 'loss-row'}
                  style={selectedId === stock.id ? { outline: '2px solid #8b5cf6' } : {}}
                  onClick={() => onSelect(stock)}
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {renderCell(stock, col.key)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div className="action-btns">
                      <button className="action-btn edit" onClick={() => openEditModal(stock)}>
                        编辑
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          if (confirm(`确定删除 ${stock.name} (${stock.code}) 吗？`)) {
                            onDelete(stock.id);
                          }
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingStock ? '编辑持仓' : '添加持仓'}</h3>

            <div className="form-group">
              <label>股票代码</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={errors.code ? 'error' : ''}
                placeholder="如: 600519"
                autoFocus
              />
              {errors.code && <div className="error-text">{errors.code}</div>}
            </div>

            <div className="form-group">
              <label>股票名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'error' : ''}
                placeholder="如: 贵州茅台"
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label>买入数量</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={errors.quantity ? 'error' : ''}
                placeholder="如: 100"
                step="1"
                min="1"
              />
              {errors.quantity && <div className="error-text">{errors.quantity}</div>}
            </div>

            <div className="form-group">
              <label>买入价格</label>
              <input
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                className={errors.buyPrice ? 'error' : ''}
                placeholder="如: 1500.00"
                step="0.01"
                min="0.01"
              />
              {errors.buyPrice && <div className="error-text">{errors.buyPrice}</div>}
            </div>

            <div className="form-group">
              <label>当前价格</label>
              <input
                type="number"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                className={errors.currentPrice ? 'error' : ''}
                placeholder="如: 1600.00"
                step="0.01"
                min="0.01"
              />
              {errors.currentPrice && <div className="error-text">{errors.currentPrice}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                取消
              </button>
              <button className="btn" onClick={handleSubmit}>
                {editingStock ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTable;
