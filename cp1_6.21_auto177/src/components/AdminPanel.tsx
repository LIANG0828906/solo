import React, { useContext, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuctionContext } from '../App';
import type { AuctionItem } from '../types';

const AdminPanel: React.FC = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error('AuctionContext 未找到');

  const { items, setItems, auctionActive, setAuctionActive } = context;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startPrice: '',
    description: '',
    image: ''
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ name: '', startPrice: '', description: '', image: '' });
    setEditingId(null);
  };

  const toggleAuction = async () => {
    try {
      const res = await axios.post('/api/items/status', { active: !auctionActive });
      setAuctionActive(res.data.active);
    } catch (error) {
      console.error('切换拍卖状态失败:', error);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startPrice) return;

    try {
      if (editingId) {
        const res = await axios.put(`/api/items/${editingId}`, {
          name: formData.name,
          startPrice: Number(formData.startPrice),
          description: formData.description,
          image: formData.image
        });
        setItems(prev => prev.map(i => (i.id === editingId ? res.data : i)));
      } else {
        const res = await axios.post('/api/items', {
          name: formData.name,
          startPrice: Number(formData.startPrice),
          description: formData.description,
          image: formData.image
        });
        setItems(prev => [...prev, res.data]);
      }
      resetForm();
    } catch (error) {
      console.error('保存物品失败:', error);
    }
  };

  const handleEdit = (item: AuctionItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      startPrice: String(item.startPrice),
      description: item.description,
      image: item.image
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此拍卖品吗？')) return;
    try {
      await axios.delete(`/api/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('删除物品失败:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">管理后台</h1>
        <div className="auction-toggle">
          <span className="toggle-label">拍卖流程</span>
          <div
            className={`toggle-switch ${auctionActive ? 'active' : ''}`}
            onClick={toggleAuction}
          />
          <span className="toggle-label">{auctionActive ? '已开启' : '已关闭'}</span>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2 className="form-title">{editingId ? '编辑拍卖品' : '添加拍卖品'}</h2>

        <div className="form-row">
          <label className="form-label">物品名称</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入物品名称"
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">起拍价（元）</label>
          <input
            type="number"
            className="form-input"
            value={formData.startPrice}
            onChange={e => setFormData(prev => ({ ...prev, startPrice: e.target.value }))}
            placeholder="请输入起拍价"
            min={0}
            step={10}
            required
          />
        </div>

        <div className="form-row">
          <label className="form-label">物品描述</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="请输入物品描述"
          />
        </div>

        <div className="form-row">
          <label className="form-label">物品图片</label>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <p>拖拽图片到此处，或点击选择文件</p>
            {formData.image && (
              <img src={formData.image} alt="预览" className="upload-preview" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="submit-btn">
            {editingId ? '保存修改' : '添加物品'}
          </button>
          {editingId && (
            <button
              type="button"
              className="submit-btn"
              onClick={resetForm}
              style={{ background: '#374151', flex: 0, padding: '14px 28px' }}
            >
              取消
            </button>
          )}
        </div>
      </form>

      <div className="items-list">
        <h2 className="form-title">拍卖品列表（{items.length}件）</h2>
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <img src={item.image} alt={item.name} className="item-card-image" />
              <div className="item-card-name">{item.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="item-card-price">起拍 ¥{item.startPrice}</div>
                {item.sold ? (
                  <span className="item-sold-badge">已拍出</span>
                ) : (
                  <span className="item-available-badge">待拍</span>
                )}
              </div>
              <p className="item-card-desc">{item.description || '暂无描述'}</p>
              <div className="item-card-actions">
                <button className="edit-btn" onClick={() => handleEdit(item)}>编辑</button>
                <button className="delete-btn" onClick={() => handleDelete(item.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
