import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { InvoiceTemplate, templateLabels, InvoiceItem } from '../types';
import InvoicePreview from '../components/InvoicePreview';
import './InvoiceCreate.css';

const InvoiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const { createInvoice } = useInvoiceStore();

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [template, setTemplate] = useState<InvoiceTemplate>('minimal-white');
  const [taxRate, setTaxRate] = useState(0.06);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      alert('请输入客户名称');
      return;
    }
    if (items.every(item => !item.description.trim())) {
      alert('请至少添加一个项目');
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);

    try {
      const newInvoice = await createInvoice({
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerEmail: customerEmail.trim(),
        items: validItems,
        taxRate,
        template,
        dueDate,
        notes: notes.trim(),
      });
      navigate(`/invoices/${newInvoice.id}`);
    } catch (error) {
      alert('创建发票失败，请重试');
    }
  };

  const previewInvoice = {
    customerName: customerName || '客户名称',
    customerAddress: customerAddress || '客户地址',
    customerEmail: customerEmail || '客户邮箱',
    items: items.filter(i => i.description.trim()),
    taxRate,
    template,
    dueDate,
    issueDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '预览发票',
    notes,
  };

  const templates: InvoiceTemplate[] = ['minimal-white', 'business-blue', 'warm-tone'];

  return (
    <div className="invoice-create-page">
      <div className="page-header">
        <h1>创建发票</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/invoices')}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            保存发票
          </button>
        </div>
      </div>

      <div className="create-layout">
        <div className="form-section">
          <div className="form-card">
            <h2>客户信息</h2>
            <div className="form-group">
              <label>客户名称 *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="请输入客户名称"
              />
            </div>
            <div className="form-group">
              <label>客户地址</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="请输入客户地址"
              />
            </div>
            <div className="form-group">
              <label>客户邮箱</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="请输入客户邮箱"
              />
            </div>
          </div>

          <div className="form-card">
            <h2>项目明细</h2>
            <div className="items-header">
              <span className="col-desc">描述</span>
              <span className="col-qty">数量</span>
              <span className="col-price">单价</span>
              <span className="col-action"></span>
            </div>
            {items.map((item, index) => (
              <div key={item.id} className="item-row">
                <input
                  type="text"
                  className="col-desc"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="项目描述"
                />
                <input
                  type="number"
                  className="col-qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                  min="1"
                />
                <input
                  type="number"
                  className="col-price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
                <button
                  className="col-action btn-delete"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  🗑️
                </button>
              </div>
            ))}
            <button className="btn-add-item" onClick={addItem}>
              ➕ 添加项目
            </button>
          </div>

          <div className="form-card">
            <h2>发票设置</h2>
            <div className="form-row">
              <div className="form-group">
                <label>税率</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                >
                  <option value={0}>免税 (0%)</option>
                  <option value={0.03}>3%</option>
                  <option value={0.06}>6%</option>
                  <option value={0.09}>9%</option>
                  <option value={0.13}>13%</option>
                </select>
              </div>
              <div className="form-group">
                <label>截止日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加备注信息..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-card">
            <h2>选择模板</h2>
            <div className="template-options">
              {templates.map((t) => (
                <button
                  key={t}
                  className={`template-option ${template === t ? 'active' : ''}`}
                  onClick={() => setTemplate(t)}
                >
                  <div
                    className="template-preview"
                    style={{
                      backgroundColor: t === 'warm-tone' ? '#FFFBF5' : '#FFFFFF',
                      borderTop: `4px solid ${
                        t === 'minimal-white' ? '#2C3E50' :
                        t === 'business-blue' ? '#2980B9' : '#E67E22'
                      }`,
                    }}
                  >
                    <div className="template-line template-line-short"></div>
                    <div className="template-line"></div>
                    <div className="template-line"></div>
                  </div>
                  <span className="template-name">{templateLabels[t]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="preview-section">
          <div className="preview-sticky">
            <h2>预览</h2>
            <div className="preview-container">
              <InvoicePreview invoice={previewInvoice as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
