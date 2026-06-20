import React, { useState, useCallback } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import type { OrderPreview } from '../types';

const MATERIAL_COLORS: Record<string, string> = {
  wood: '#8B5E3C',
  fabric: '#B565A7',
  metal: '#708090',
};

export const OrderPanel: React.FC = () => {
  const items = useOrderStore((s) => s.items);
  const getTotalPrice = useOrderStore((s) => s.getTotalPrice);
  const generateOrderPreview = useOrderStore((s) => s.generateOrderPreview);
  const generateOrderText = useOrderStore((s) => s.generateOrderText);
  const clear = useOrderStore((s) => s.clear);
  const clearParts = useWorkspaceStore((s) => s.clearParts);

  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [copied, setCopied] = useState(false);

  const total = getTotalPrice();

  const handleGenerate = useCallback(() => {
    if (items.length === 0) return;
    setPreview(generateOrderPreview());
    setCopied(false);
  }, [items.length, generateOrderPreview]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateOrderText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [generateOrderText]);

  const handleClear = useCallback(() => {
    clear();
    clearParts();
    setPreview(null);
  }, [clear, clearParts]);

  return (
    <div
      style={{
        width: 260,
        background: '#E8E0D0',
        borderRadius: 12,
        padding: 16,
        boxSizing: 'border-box',
        overflowY: 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: '#5C4033', letterSpacing: 1 }}>
        材料包清单
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 40 }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 12, color: '#8B5E3C', opacity: 0.6, textAlign: 'center', padding: '16px 0' }}>
            暂无零件，开始拼搭吧
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.templateId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFBF5',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: MATERIAL_COLORS[it.material],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: '#5C4033', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.name}
                </span>
              </div>
              <span style={{ color: '#BF8C6F', fontWeight: 600 }}>×{it.quantity}</span>
              <span style={{ color: '#5C4033', fontWeight: 600, width: 46, textAlign: 'right' }}>
                ¥{it.totalPrice.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px dashed rgba(139,94,60,0.3)',
          fontSize: 14,
          fontWeight: 700,
          color: '#5C4033',
        }}
      >
        <span>合计</span>
        <span>¥{total.toFixed(2)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleGenerate}
          disabled={items.length === 0}
          style={{
            padding: '10px 12px',
            background: items.length === 0 ? '#C9B8A0' : '#D4A373',
            color: '#FFFBF5',
            border: '1px solid #BF8C6F',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 200ms',
          }}
          onMouseEnter={(e) => {
            if (items.length > 0) (e.currentTarget as HTMLButtonElement).style.background = '#BF8C6F';
          }}
          onMouseLeave={(e) => {
            if (items.length > 0) (e.currentTarget as HTMLButtonElement).style.background = '#D4A373';
          }}
        >
          生成订单预览
        </button>
        <button
          onClick={handleClear}
          disabled={items.length === 0}
          style={{
            padding: '8px 12px',
            background: 'transparent',
            color: items.length === 0 ? '#C9B8A0' : '#8B5E3C',
            border: '1px solid rgba(191,140,111,0.5)',
            borderRadius: 8,
            fontSize: 12,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 200ms',
          }}
          onMouseEnter={(e) => {
            if (items.length > 0) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(191,140,111,0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          清空工作区
        </button>
      </div>

      {preview && (
        <div
          style={{
            background: '#FFFBF5',
            border: '1px solid rgba(191,140,111,0.3)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 12,
            color: '#5C4033',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, borderBottom: '1px dashed rgba(139,94,60,0.3)', paddingBottom: 6 }}>
            📦 订单预览
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><b>收货人：</b>{preview.receiver}</div>
            <div><b>电话：</b>{preview.phone}</div>
            <div><b>地址：</b>{preview.address}</div>
            <div><b>预计发货：</b>{preview.estimatedDelivery}</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: '#BF8C6F' }}>
              应付金额：¥{preview.totalPrice.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 10px',
              background: copied ? '#4ADE80' : '#D4A373',
              color: '#FFFBF5',
              border: '1px solid #BF8C6F',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 200ms',
            }}
          >
            {copied ? '✓ 已复制' : '复制清单文本'}
          </button>
        </div>
      )}
    </div>
  );
};
