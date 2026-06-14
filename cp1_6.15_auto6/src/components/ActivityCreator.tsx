import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Activity, DiscountRule, Product } from '../data/mockData';
import SimulationChart from './SimulationChart';

const styles = `
  .creator-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 24px;
  }
  .card {
    background: white;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(26, 115, 232, 0.06);
    padding: 24px;
    animation: fadeInUp 0.3s ease both;
  }
  .card + .card { margin-top: 20px; }
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .card-title::before {
    content: '';
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, #1A73E8, #5DADE2);
    border-radius: 2px;
  }
  .form-group { margin-bottom: 18px; }
  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #5a6c7d;
    margin-bottom: 8px;
  }
  .form-label .required { color: #e74c3c; margin-left: 2px; }
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e1e8ef;
    border-radius: 10px;
    font-size: 14px;
    color: #2c3e50;
    background: #fafbfd;
    transition: all 0.2s ease;
    font-family: inherit;
    outline: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: #1A73E8;
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.08);
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .discount-type-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  .discount-tab {
    flex: 1;
    padding: 12px 16px;
    border: 1.5px solid #e1e8ef;
    border-radius: 10px;
    background: #fafbfd;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #5a6c7d;
  }
  .discount-tab:hover { border-color: #1A73E8; color: #1A73E8; }
  .discount-tab.active {
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  }
  .discount-tab .tab-icon { font-size: 20px; display: block; margin-bottom: 4px; }
  .rule-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
    background: #f8faff;
    border-radius: 10px;
    margin-bottom: 10px;
    border: 1px solid #e8eff8;
  }
  .rule-label {
    font-size: 12px;
    color: #7f8c8d;
    margin-bottom: 4px;
  }
  .rule-text { font-size: 13px; color: #1A73E8; font-weight: 600; text-align: center; }
  .btn-icon {
    width: 34px; height: 34px;
    border: none;
    border-radius: 8px;
    background: #fff0f0;
    color: #e74c3c;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .btn-icon:hover { background: #ffd6d6; transform: scale(1.05); }
  .btn-add {
    width: 100%;
    padding: 12px;
    border: 2px dashed #b9d0ee;
    border-radius: 10px;
    background: transparent;
    color: #1A73E8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-add:hover { border-color: #1A73E8; background: #f0f6ff; }
  .product-search {
    position: relative;
    margin-bottom: 14px;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #95a5a6;
    font-size: 15px;
  }
  .product-search .form-input { padding-left: 42px; }
  .product-list {
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid #e8eff8;
    border-radius: 10px;
  }
  .product-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #f0f4f8;
  }
  .product-item:last-child { border-bottom: none; }
  .product-item:hover { background: #f5f9ff; }
  .product-item.selected { background: #eaf2ff; }
  .product-emoji {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, #e8f1ff, #d4e6ff);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  .product-info { flex: 1; min-width: 0; }
  .product-name { font-size: 13px; font-weight: 500; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .product-meta { font-size: 11px; color: #95a5a6; margin-top: 3px; }
  .product-price { font-size: 14px; font-weight: 600; color: #1A73E8; }
  .checkbox {
    width: 20px; height: 20px;
    border: 2px solid #d0d9e3;
    border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .checkbox.checked {
    background: #1A73E8;
    border-color: #1A73E8;
    color: white;
  }
  .preview-section { position: sticky; top: 24px; }
  .preview-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px dashed #e8eff8;
    font-size: 13px;
  }
  .preview-item:last-child { border-bottom: none; }
  .preview-label { color: #7f8c8d; }
  .preview-value { font-weight: 600; color: #2c3e50; }
  .preview-value.highlight { color: #1A73E8; font-size: 15px; }
  .preview-value.savings { color: #27ae60; }
  .preview-value.urgent { color: #e74c3c; }
  .preview-box {
    background: linear-gradient(135deg, #eef4ff, #f8faff);
    border-radius: 12px;
    padding: 18px;
    margin-top: 16px;
    border: 1px solid #dce7f8;
  }
  .preview-box-title {
    font-size: 12px;
    color: #5a6c7d;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .sample-test {
    font-size: 12px;
    color: #7f8c8d;
    margin-top: 6px;
    padding: 8px 10px;
    background: white;
    border-radius: 6px;
    border-left: 3px solid #1A73E8;
  }
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }
  .btn {
    flex: 1;
    padding: 13px 24px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    font-family: inherit;
  }
  .btn-primary {
    background: linear-gradient(135deg, #1A73E8, #2E86F5);
    color: white;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26, 115, 232, 0.4); }
  .btn-primary:active { transform: translateY(0); }
  .btn-secondary {
    background: #f0f4f8;
    color: #5a6c7d;
  }
  .btn-secondary:hover { background: #e4ebf3; }
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  }
  @keyframes ripple {
    to { transform: scale(4); opacity: 0; }
  }
  .category-filter {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .cat-chip {
    padding: 5px 12px;
    border-radius: 16px;
    background: #f0f4f8;
    font-size: 12px;
    color: #5a6c7d;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }
  .cat-chip:hover { border-color: #1A73E8; color: #1A73E8; }
  .cat-chip.active { background: #1A73E8; color: white; border-color: transparent; }
  .selected-count {
    font-size: 12px;
    color: #1A73E8;
    font-weight: 500;
  }
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 14px;
  }
  .stat-mini {
    background: white;
    padding: 10px 12px;
    border-radius: 8px;
    text-align: center;
  }
  .stat-mini-val { font-size: 16px; font-weight: 700; color: #1A73E8; }
  .stat-mini-lbl { font-size: 11px; color: #95a5a6; margin-top: 2px; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 1100px) {
    .creator-layout { grid-template-columns: 1fr; }
    .preview-section { position: static; }
  }
  @media (max-width: 640px) {
    .form-row { grid-template-columns: 1fr; }
    .rule-row { grid-template-columns: 1fr 1fr; }
    .rule-text { grid-column: span 2; padding: 4px 0; }
    .discount-type-tabs { flex-direction: column; }
    .action-buttons { flex-direction: column; }
  }
`;

interface Props {
  editingActivity: Activity | null;
  onCreated: () => void;
  onShowSimulation: (params: any) => void;
}

const ActivityCreator = ({ editingActivity, onCreated, onShowSimulation }: Props) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 14);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState(today);
  const [endTime, setEndTime] = useState(defaultEnd.toISOString().split('T')[0]);
  const [discountType, setDiscountType] = useState<Activity['discountType']>('full_reduction');
  const [rules, setRules] = useState<DiscountRule[]>([
    { id: uuidv4(), condition: 200, discount: 30 },
    { id: uuidv4(), condition: 500, discount: 80 },
  ]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  useEffect(() => {
    if (editingActivity) {
      setName(editingActivity.name);
      setStartTime(editingActivity.startTime.split('T')[0]);
      setEndTime(editingActivity.endTime.split('T')[0]);
      setDiscountType(editingActivity.discountType);
      setRules(editingActivity.rules.length > 0 ? editingActivity.rules : rules);
      setSelectedProducts(editingActivity.products);
    }
  }, [editingActivity]);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProductList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(productList.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [productList]);

  const addRule = () => {
    const lastRule = rules[rules.length - 1];
    setRules([
      ...rules,
      {
        id: uuidv4(),
        condition: lastRule ? lastRule.condition + 300 : 200,
        discount: lastRule ? lastRule.discount + 50 : 30,
      },
    ]);
  };

  const updateRule = (id: string, field: 'condition' | 'discount', value: number) => {
    setRules(rules.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRule = (id: string) => {
    if (rules.length > 1) setRules(rules.filter(r => r.id !== id));
  };

  const toggleProduct = (p: Product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) return prev.filter(x => x.id !== p.id);
      return [...prev, p];
    });
  };

  const isProductSelected = (id: string) => selectedProducts.some(p => p.id === id);

  const totalProductValue = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const avgProductPrice = selectedProducts.length > 0 ? Math.round(totalProductValue / selectedProducts.length) : 0;

  const calculateDiscount = (amount: number, qty: number = 1) => {
    const sorted = [...rules].sort((a, b) => b.condition - a.condition);
    switch (discountType) {
      case 'full_reduction': {
        for (const r of sorted) {
          if (amount >= r.condition) return r.discount;
        }
        return 0;
      }
      case 'percentage': {
        for (const r of sorted) {
          if (qty >= r.condition) return Math.round(amount * (r.discount / 100));
        }
        return 0;
      }
      case 'buy_gift': {
        for (const r of sorted) {
          if (qty >= r.condition) return r.discount;
        }
        return 0;
      }
    }
  };

  const previewSamples = useMemo(() => {
    if (selectedProducts.length === 0) {
      return [
        { label: '示例订单 ¥299 x 1', amount: 299, qty: 1 },
        { label: '示例订单 ¥599 x 2', amount: 599, qty: 2 },
        { label: '示例订单 ¥1299 x 3', amount: 1299, qty: 3 },
      ];
    }
    const samples = [];
    if (selectedProducts.length >= 1) {
      const p = selectedProducts[0];
      samples.push({ label: `${p.name.slice(0, 8)} x1`, amount: p.price, qty: 1 });
    }
    if (selectedProducts.length >= 2) {
      const sum = selectedProducts[0].price + selectedProducts[1].price;
      samples.push({
        label: `${selectedProducts[0].name.slice(0, 4)}+${selectedProducts[1].name.slice(0, 4)}`,
        amount: sum,
        qty: 2,
      });
    }
    if (selectedProducts.length >= 1) {
      const p = selectedProducts[0];
      samples.push({ label: `${p.name.slice(0, 8)} x3`, amount: p.price * 3, qty: 3 });
    }
    return samples;
  }, [selectedProducts]);

  const handleSubmit = async (e: React.MouseEvent) => {
    addRipple(e);
    if (!name.trim()) {
      alert('请输入活动名称');
      return;
    }
    if (!startTime || !endTime) {
      alert('请选择活动时间范围');
      return;
    }
    if (new Date(endTime) < new Date(startTime)) {
      alert('结束时间不能早于开始时间');
      return;
    }
    if (selectedProducts.length === 0) {
      alert('请至少选择一个商品');
      return;
    }
    setLoading(true);
    try {
      const body = {
        name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime + 'T23:59:59').toISOString(),
        discountType,
        rules,
        products: selectedProducts,
      };
      const url = editingActivity
        ? `/api/activities/${editingActivity.id}`
        : '/api/activities';
      const method = editingActivity ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onCreated();
      }
    } catch (e) {
      console.error(e);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addRipple = (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    ripple.style.left = (e.clientX - rect.left - rect.width / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - rect.height / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const ruleLabels = {
    full_reduction: { cond: '满 (元)', disc: '减 (元)', text: '满{cond}元减{disc}元' },
    percentage: { cond: '满 (件)', disc: '折扣 (%)', text: '满{cond}件打{100-disc}折' },
    buy_gift: { cond: '买 (件)', disc: '送 (件)', text: '买{cond}件送{disc}件' },
  };

  return (
    <>
      <style>{styles}</style>
      <div className="creator-layout">
        <div>
          <div className="card" style={{ animationDelay: '0.05s' }}>
            <div className="card-title">基本信息</div>
            <div className="form-group">
              <label className="form-label">活动名称<span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="如：618年中大促·数码专场"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">开始时间<span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">结束时间<span className="required">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ animationDelay: '0.1s' }}>
            <div className="card-title">优惠类型</div>
            <div className="discount-type-tabs">
              {[
                { key: 'full_reduction', label: '满减优惠', icon: '💰' },
                { key: 'percentage', label: '打折促销', icon: '🏷️' },
                { key: 'buy_gift', label: '买赠活动', icon: '🎁' },
              ].map(tab => (
                <div
                  key={tab.key}
                  className={`discount-tab ${discountType === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setDiscountType(tab.key as Activity['discountType']);
                    if (tab.key === 'full_reduction') {
                      setRules([
                        { id: uuidv4(), condition: 200, discount: 30 },
                        { id: uuidv4(), condition: 500, discount: 80 },
                      ]);
                    } else if (tab.key === 'percentage') {
                      setRules([
                        { id: uuidv4(), condition: 1, discount: 10 },
                        { id: uuidv4(), condition: 3, discount: 25 },
                      ]);
                    } else {
                      setRules([{ id: uuidv4(), condition: 2, discount: 1 }]);
                    }
                  }}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  {tab.label}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              {ruleLabels[discountType] && (
                <div className="form-label" style={{ marginBottom: 12 }}>
                  折扣规则<span className="required">*</span>
                  <span style={{ fontWeight: 400, color: '#95a5a6', marginLeft: 10, fontSize: 12 }}>
                    支持设置多层级条件，用户消费满足时自动按最优规则计算
                  </span>
                </div>
              )}
              {rules.map((rule, idx) => {
                const labels = ruleLabels[discountType];
                return (
                  <div key={rule.id} className="rule-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <div>
                      <div className="rule-label">{labels.cond}</div>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={rule.condition}
                        onChange={(e) => updateRule(rule.id, 'condition', Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <div className="rule-text">
                      {discountType === 'full_reduction' && '满减'}
                      {discountType === 'percentage' && '→'}
                      {discountType === 'buy_gift' && '→'}
                    </div>
                    <div>
                      <div className="rule-label">{labels.disc}</div>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={rule.discount}
                        onChange={(e) => updateRule(rule.id, 'discount', Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => removeRule(rule.id)}
                      disabled={rules.length === 1}
                      style={{ opacity: rules.length === 1 ? 0.4 : 1, cursor: rules.length === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button className="btn-add" onClick={addRule}>
                + 添加一层条件
              </button>
            </div>
          </div>

          <div className="card" style={{ animationDelay: '0.15s' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                适用商品<span className="required">*</span>
              </span>
              <span className="selected-count">已选 {selectedProducts.length} 件</span>
            </div>

            <div className="category-filter">
              {categories.map(cat => (
                <span
                  key={cat}
                  className={`cat-chip ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? '全部' : cat}
                </span>
              ))}
            </div>

            <div className="product-search">
              <span className="search-icon">🔍</span>
              <input
                className="form-input"
                placeholder="搜索商品名称或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="product-list">
              {productList.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#95a5a6', fontSize: 13 }}>
                  未找到匹配的商品
                </div>
              ) : (
                productList.map(p => (
                  <div
                    key={p.id}
                    className={`product-item ${isProductSelected(p.id) ? 'selected' : ''}`}
                    onClick={() => toggleProduct(p)}
                  >
                    <div className={`checkbox ${isProductSelected(p.id) ? 'checked' : ''}`}>
                      {isProductSelected(p.id) && '✓'}
                    </div>
                    <div className="product-emoji">{p.image}</div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">{p.category}</div>
                    </div>
                    <div className="product-price">¥{p.price}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>效果模拟预测</div>
              <button
                className="btn-secondary"
                style={{ flex: 'none', padding: '8px 16px', fontSize: 12 }}
                onClick={() => setShowSimulation(!showSimulation)}
              >
                {showSimulation ? '收起预测' : '展开预测'}
              </button>
            </div>
            {showSimulation && (
              <SimulationChart
                params={{
                  startTime,
                  endTime,
                  discountType,
                  rules,
                  products: selectedProducts,
                }}
                onParamsUpdate={onShowSimulation}
              />
            )}
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => onCreated()}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '保存中...' : editingActivity ? '保存修改' : '创建活动'}
            </button>
          </div>
        </div>

        <div className="preview-section">
          <div className="card" style={{ animationDelay: '0.25s' }}>
            <div className="card-title">实时预览</div>

            <div className="preview-item">
              <span className="preview-label">活动名称</span>
              <span className="preview-value">{name || '未设置'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">活动时间</span>
              <span className="preview-value">
                {startTime.slice(5)} ~ {endTime.slice(5)}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">活动天数</span>
              <span className="preview-value highlight">
                {Math.max(0, Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 86400000) + 1)} 天
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">优惠类型</span>
              <span className="preview-value">
                {discountType === 'full_reduction' && '满减优惠'}
                {discountType === 'percentage' && '打折促销'}
                {discountType === 'buy_gift' && '买赠活动'}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">参与商品</span>
              <span className="preview-value highlight">{selectedProducts.length} 件</span>
            </div>

            <div className="stats-row">
              <div className="stat-mini">
                <div className="stat-mini-val">¥{totalProductValue}</div>
                <div className="stat-mini-lbl">累计价值</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-val">¥{avgProductPrice}</div>
                <div className="stat-mini-lbl">平均单价</div>
              </div>
            </div>

            <div className="preview-box">
              <div className="preview-box-title">优惠计算示例</div>
              {previewSamples.map((sample, idx) => {
                const disc = calculateDiscount(sample.amount, sample.qty);
                const final = discountType === 'buy_gift' ? sample.amount : sample.amount - disc;
                return (
                  <div key={idx} className="sample-test">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{sample.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        <span style={{ color: '#95a5a6', textDecoration: 'line-through', marginRight: 8 }}>
                          ¥{sample.amount}
                        </span>
                        {discountType === 'buy_gift' ? (
                          <span style={{ color: '#e67e22' }}>
                            {disc > 0 ? `赠${disc}件` : '无优惠'}
                          </span>
                        ) : (
                          <>
                            <span style={{ color: '#27ae60', marginRight: 6 }}>
                              {disc > 0 ? `-¥${disc}` : '无优惠'}
                            </span>
                            <span style={{ color: '#1A73E8' }}>¥{Math.max(0, final)}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityCreator;
