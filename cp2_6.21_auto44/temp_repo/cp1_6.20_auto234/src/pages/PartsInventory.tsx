import { useState, useEffect, useRef, useCallback } from 'react';
import type { Part, PaginatedResponse } from '../types';

const ROW_HEIGHT = 56;

export default function PartsInventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [stockModal, setStockModal] = useState<{ part: Part; operation: 'in' | 'out' } | null>(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: number | null }>({ id: '', value: null });

  const containerRef = useRef<HTMLDivElement>(null);

  const loadParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parts?pageSize=2000');
      const data: PaginatedResponse<Part> = await res.json();
      setParts(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const handleStockOperation = async () => {
    if (!stockModal || stockQuantity <= 0) return;
    const res = await fetch(`/api/parts/${stockModal.part.id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: stockQuantity, operation: stockModal.operation })
    });
    if (res.ok) {
      setParts((prev) =>
        prev.map((p) =>
          p.id === stockModal.part.id
            ? {
                ...p,
                quantity:
                  stockModal.operation === 'in' ? p.quantity + stockQuantity : p.quantity - stockQuantity
              }
            : p
        )
      );
      setStockModal(null);
      setStockQuantity(1);
    } else {
      const data = await res.json();
      alert(data.error || '操作失败');
    }
  };

  const handlePriceUpdate = async (partId: string) => {
    if (editingPrice.value === null) return;
    const res = await fetch(`/api/parts/${partId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_price: editingPrice.value })
    });
    if (res.ok) {
      setParts((prev) =>
        prev.map((p) => (p.id === partId ? { ...p, unit_price: editingPrice.value! } : p))
      );
    } else {
      const data = await res.json();
      alert(data.error || '更新失败');
    }
    setEditingPrice({ id: '', value: null });
  };

  const totalRows = parts.length;
  const containerHeight = containerRef.current?.clientHeight || 600;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + 10);
  const visibleParts = parts.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>备件库存</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>管理备件库存，支持入库出库操作</p>
      </div>

      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
            padding: '12px 16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '12px',
            fontWeight: '600',
            color: '#666'
          }}
        >
          <div>备件名称</div>
          <div>型号</div>
          <div style={{ textAlign: 'center' }}>库存数量</div>
          <div style={{ textAlign: 'right' }}>单价 (¥)</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>

        <div
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          ref={containerRef}
          style={{
            height: '600px',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          <div style={{ height: `${totalRows * ROW_HEIGHT}px`, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleParts.map((part) => {
                const isLowStock = part.quantity < 10;
                return (
                  <div
                    key={part.id}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      display: 'grid',
                      gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                      padding: '0 16px',
                      alignItems: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: isLowStock ? '#ffebee' : 'white',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      animation: isLowStock ? 'pulse 2s ease-in-out infinite' : undefined,
                      border: isLowStock ? '2px solid transparent' : '2px solid transparent',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{part.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{part.model}</div>
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: isLowStock ? 'bold' : '500',
                          backgroundColor: isLowStock ? 'rgba(239, 83, 80, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                          color: isLowStock ? '#ef5350' : '#667eea'
                        }}
                      >
                        {part.quantity}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {editingPrice.id === part.id ? (
                        <input
                          type="number"
                          value={editingPrice.value ?? part.unit_price}
                          onChange={(e) =>
                            setEditingPrice({ id: part.id, value: parseFloat(e.target.value) || 0 })
                          }
                          onBlur={() => handlePriceUpdate(part.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(part.id)}
                          autoFocus
                          min={0}
                          step={0.01}
                          style={{
                            width: '80px',
                            padding: '4px 8px',
                            border: '1px solid #667eea',
                            borderRadius: '4px',
                            fontSize: '13px',
                            textAlign: 'right'
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingPrice({ id: part.id, value: part.unit_price })}
                          style={{
                            cursor: 'pointer',
                            fontSize: '14px',
                            textDecoration: 'underline',
                            color: '#667eea'
                          }}
                        >
                          ¥{part.unit_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setStockModal({ part, operation: 'in' });
                          setStockQuantity(1);
                        }}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          color: '#4caf50',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        入库
                      </button>
                      <button
                        onClick={() => {
                          setStockModal({ part, operation: 'out' });
                          setStockQuantity(1);
                        }}
                        disabled={part.quantity <= 0}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: part.quantity <= 0 ? '#eee' : 'rgba(239, 83, 80, 0.1)',
                          color: part.quantity <= 0 ? '#ccc' : '#ef5350',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: part.quantity <= 0 ? 'not-allowed' : 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseDown={(e) => {
                          if (part.quantity > 0) e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        出库
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>加载中...</div>}

      {!loading && parts.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>暂无备件</div>
      )}

      {stockModal && (
        <div
          onClick={() => setStockModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '360px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'modalIn 0.3s ease-out'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stockModal.operation === 'in' ? '入库' : '出库'} - {stockModal.part.name}
            </h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
              当前库存: {stockModal.part.quantity}
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                数量
              </label>
              <input
                type="number"
                value={stockQuantity}
                min={1}
                onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            {stockModal.operation === 'out' && stockQuantity > stockModal.part.quantity && (
              <p style={{ color: '#ef5350', fontSize: '12px', marginTop: '8px' }}>库存不足</p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setStockModal(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'transform 0.15s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                取消
              </button>
              <button
                onClick={handleStockOperation}
                disabled={stockModal.operation === 'out' && stockQuantity > stockModal.part.quantity}
                style={{
                  flex: 1,
                  padding: '10px',
                  background:
                    stockModal.operation === 'in'
                      ? 'linear-gradient(135deg, #66bb6a, #43a047)'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor:
                    stockModal.operation === 'out' && stockQuantity > stockModal.part.quantity
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
