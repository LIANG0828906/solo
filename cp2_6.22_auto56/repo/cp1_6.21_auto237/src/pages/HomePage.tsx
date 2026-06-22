import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import { Item } from '../types';
import { showToast } from '../utils/toast';

const CATEGORIES = ['全部', '电子', '服饰', '证件', '书籍', '钥匙', '其他'];

const HomePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [locationKeyword, setLocationKeyword] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '电子',
    type: 'lost' as 'lost' | 'found',
    location: '',
    description: '',
    contact: '',
    username: ''
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (debouncedLocation) params.location = debouncedLocation;
      
      const response = await axios.get('/api/items', { params });
      setItems(response.data);
    } catch {
      showToast('获取物品列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [category, debouncedLocation]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationKeyword(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedLocation(value);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.location || 
        !formData.description || !formData.contact) {
      showToast('请填写所有必填字段', 'error');
      return;
    }

    if (formData.description.length > 200) {
      showToast('描述不能超过200字', 'error');
      return;
    }

    try {
      await axios.post('/api/items', formData);
      showToast('发布成功', 'success');
      
      setFormData({
        name: '',
        category: '电子',
        type: 'lost',
        location: '',
        description: '',
        contact: '',
        username: ''
      });
      
      fetchItems();
    } catch {
      showToast('发布失败，请重试', 'error');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container">
      <form className="publish-form" onSubmit={handleSubmit}>
        <h2 className="publish-form-title">📝 发布失物/招领信息</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">物品名称 *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="例如：黑色钱包"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">类别 *</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleInputChange}
            >
              {CATEGORIES.filter(c => c !== '全部').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">类型</label>
            <select
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="lost">丢失物品（寻物启事）</option>
              <option value="found">捡到物品（失物招领）</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">丢失/捡到地点 *</label>
            <input
              type="text"
              name="location"
              className="form-input"
              placeholder="例如：图书馆二楼"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">您的称呼</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="例如：张同学（选填）"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">联系方式 *</label>
            <input
              type="text"
              name="contact"
              className="form-input"
              placeholder="手机号/微信号"
              value={formData.contact}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label className="form-label">详细描述 *</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="请详细描述物品特征、丢失或捡到的具体情况（最多200字）"
              maxLength={200}
              value={formData.description}
              onChange={handleInputChange}
            />
            <div className="char-count">{formData.description.length}/200</div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          立即发布
        </button>
      </form>

      <div className="filter-bar">
        <span className="filter-label">类别筛选：</span>
        <select
          className="filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <span className="filter-label">地点关键词：</span>
        <input
          type="text"
          className="filter-input"
          placeholder="输入地点关键词实时过滤..."
          value={locationKeyword}
          onChange={handleLocationChange}
        />
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">暂无物品信息，快来发布第一条吧！</div>
        </div>
      ) : (
        <div className="items-grid" key={`${category}-${debouncedLocation}`}>
          {items.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
