import React, { useState, useEffect } from 'react';
import { PricingRule } from '../types';

interface PricingRuleManagerProps {
  productId: string;
  productName: string;
  onClose: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

const API_BASE = '/api';

const typeLabels: Record<string, string> = {
  daily: '日常价',
  flash_sale: '限时折扣',
  member: '会员专享'
};

const typeOptions = [
  { value: 'daily', label: '日常价' },
  { value: 'flash_sale', label: '限时折扣' },
  { value: 'member', label: '会员专享' }
];

function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PricingRuleManager({ productId, productName, onClose, onToast }: PricingRuleManagerProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formType, setFormType] = useState<'daily' | 'flash_sale' | 'member'>('daily');
  const [formPrice, setFormPrice] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/pricing-rules`);
      setRules(await res.json());
    } catch {
      onToast('获取定价规则失败', 'error');
    }
  };

  useEffect(() => { fetchRules(); }, [productId]);

  const resetForm = () => {
    setFormType('daily');
    setFormPrice('');
    setFormStart('');
    setFormEnd('');
    setErrors({});
    setEditingRule(null);
    setShowForm(false);
  };

  const startEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormType(rule.type);
    setFormPrice(rule.price.toString());
    setFormStart(formatDateTimeLocal(rule.startTime));
    setFormEnd(formatDateTimeLocal(rule.endTime));
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formPrice || isNaN(Number(formPrice)) || Number(formPrice) <= 0) e.price = '价格必须为正数';
    else {
      const decimals = formPrice.includes('.') ? formPrice.split('.')[1].length : 0;
      if (decimals > 2) e.price = '价格最多两位小数';
    }
    if (!formStart) e.start = '请选择开始时间';
    if (!formEnd) e.end = '请选择结束时间';
    if (formStart && formEnd && new Date(formStart) >= new Date(formEnd)) e.end = '结束时间须晚于开始时间';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const body = {
        type: formType,
        price: parseFloat(parseFloat(formPrice).toFixed(2)),
        startTime: new Date(formStart).toISOString(),
        endTime: new Date(formEnd).toISOString()
      };
      if (editingRule) {
        await fetch(`${API_BASE}/pricing-rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        onToast('定价规则更新成功', 'success');
      } else {
        await fetch(`${API_BASE}/products/${productId}/pricing-rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        onToast('定价规则添加成功', 'success');
      }
      resetForm();
      fetchRules();
    } catch {
      onToast('操作失败', 'error');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await fetch(`${API_BASE}/pricing-rules/${ruleId}`, { method: 'DELETE' });
      onToast('定价规则已删除', 'success');
      fetchRules();
    } catch {
      onToast('删除失败', 'error');
    }
  };

  const now = Date.now();

  const isExpired = (rule: PricingRule) => new Date(rule.endTime).getTime() < now;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{productName} — 定价规则</h2>

        <div style={styles.list}>
          {rules.length === 0 && <div style={styles.empty}>暂无定价规则，请添加</div>}
          {rules.map(rule => {
            const expired = isExpired(rule);
            return (
              <div key={rule.id} style={{ ...styles.ruleItem, opacity: expired ? 0.5 : 1 }}>
                <div style={styles.ruleHeader}>
                  <span style={{
                    ...styles.ruleType,
                    backgroundColor: rule.type === 'flash_sale' ? '#e74c3c1a' : rule.type === 'member' ? '#f0ad4e1a' : '#6c757d1a',
                    color: rule.type === 'flash_sale' ? '#e74c3c' : rule.type === 'member' ? '#f0ad4e' : '#6c757d'
                  }}>
                    {typeLabels[rule.type]}
                  </span>
                  <span style={styles.rulePrice}>¥{rule.price.toFixed(2)}</span>
                  {expired && <span style={styles.expiredTag}>已失效</span>}
                </div>
                <div style={styles.ruleTime}>
                  {new Date(rule.startTime).toLocaleString('zh-CN')} — {new Date(rule.endTime).toLocaleString('zh-CN')}
                </div>
                <div style={styles.ruleActions}>
                  <button style={styles.btnSmall} onClick={() => startEdit(rule)}>编辑</button>
                  <button style={{ ...styles.btnSmall, color: '#dc3545' }} onClick={() => handleDelete(rule.id)}>删除</button>
                </div>
              </div>
            );
          })}
        </div>

        {!showForm ? (
          <button style={styles.btnAdd} onClick={() => { resetForm(); setShowForm(true); }}>+ 添加定价规则</button>
        ) : (
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>类型</label>
                <select
                  style={styles.formField}
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                >
                  {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>价格</label>
                <input
                  type="number"
                  style={styles.formField}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                />
                {errors.price && <span style={styles.formError}>{errors.price}</span>}
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>开始时间</label>
                <input
                  type="datetime-local"
                  style={styles.formField}
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                />
                {errors.start && <span style={styles.formError}>{errors.start}</span>}
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.formLabel}>结束时间</label>
                <input
                  type="datetime-local"
                  style={styles.formField}
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                />
                {errors.end && <span style={styles.formError}>{errors.end}</span>}
              </div>
            </div>
            <div style={styles.formButtons}>
              <button type="button" style={styles.btnCancel} onClick={resetForm}>取消</button>
              <button type="submit" style={styles.btnSubmit}>{editingRule ? '保存' : '添加'}</button>
            </div>
          </form>
        )}

        <button style={styles.btnClose} onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px 32px',
    width: '90%',
    maxWidth: 600,
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
  },
  title: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#212529'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16
  },
  empty: {
    textAlign: 'center',
    color: '#adb5bd',
    padding: '20px 0',
    fontSize: '14px'
  },
  ruleItem: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px 14px',
    transition: 'opacity 300ms'
  },
  ruleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  ruleType: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 500
  },
  rulePrice: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#00d2ff'
  },
  expiredTag: {
    fontSize: '11px',
    color: '#adb5bd',
    border: '1px solid #dee2e6',
    padding: '1px 6px',
    borderRadius: '3px'
  },
  ruleTime: {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: 8
  },
  ruleActions: {
    display: 'flex',
    gap: 8
  },
  btnSmall: {
    padding: '4px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#495057',
    fontSize: '12px',
    cursor: 'pointer'
  },
  btnAdd: {
    width: '100%',
    padding: '10px',
    border: '2px dashed #00d2ff',
    borderRadius: '8px',
    backgroundColor: '#f0fcff',
    color: '#00d2ff',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: 16
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: 16,
    backgroundColor: '#fafbfc'
  },
  formRow: {
    display: 'flex',
    gap: 12
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#495057'
  },
  formField: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  formError: {
    fontSize: '11px',
    color: '#dc3545'
  },
  formButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 4
  },
  btnCancel: {
    flex: 1,
    padding: '8px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#495057',
    cursor: 'pointer'
  },
  btnSubmit: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#00d2ff',
    color: '#fff',
    fontWeight: 500,
    cursor: 'pointer'
  },
  btnClose: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
