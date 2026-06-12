import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../utils/api';

const jewelryTypes = [
  { value: 'ring', label: '戒指', icon: '💍' },
  { value: 'bracelet', label: '手镯', icon: '📿' },
  { value: 'pendant', label: '吊坠', icon: '🔮' },
  { value: 'earring', label: '耳环', icon: '✨' }
];

const materials = [
  { value: '925银', label: '925银', desc: '硬度适中，日常佩戴首选' },
  { value: '999银', label: '999足银', desc: '纯度更高，更柔软细腻' },
  { value: '银镀金', label: '银镀金', desc: '表面镀金，华丽典雅' }
];

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    jewelry_type: '',
    material: '',
    engraving: '',
    size: '',
    deadline: '',
    customer_name: '',
    customer_phone: '',
    customer_email: ''
  });
  const [sketch, setSketch] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors(prev => ({ ...prev, sketch: '仅支持 JPG 或 PNG 格式' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, sketch: '文件大小不能超过 5MB' }));
      return;
    }

    setSketch(file);
    setErrors(prev => ({ ...prev, sketch: '' }));

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.jewelry_type) newErrors.jewelry_type = '请选择饰品类型';
    if (!form.material) newErrors.material = '请选择材质';
    if (form.engraving.length > 8) newErrors.engraving = '刻字内容最多8个字符';
    if (!form.size) newErrors.size = '请填写期望尺寸';
    if (!form.deadline) newErrors.deadline = '请选择交付截止日期';
    if (!form.customer_name.trim()) newErrors.customer_name = '请填写您的姓名';
    if (!/^1[3-9]\d{9}$/.test(form.customer_phone)) newErrors.customer_phone = '请输入有效的手机号码';
    if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = '请输入有效的邮箱地址';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await orderApi.create({ ...form, sketch: sketch || undefined });
      setSuccessOrder(result.order_number);
    } catch (err: any) {
      alert(err.message || '提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px' }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(78,52,46,0.08)',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C0A080, #A08060)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 36, color: 'white'
          }}>✓</div>
          <h2 style={{ color: '#4E342E', fontSize: 24, marginBottom: 12 }}>订单提交成功！</h2>
          <p style={{ color: '#6D4C41', marginBottom: 24, fontSize: 14, lineHeight: 1.8 }}>
            感谢您的信任，我们将尽快审核您的定制需求。<br />
            请记住您的订单编号以便查询进度。
          </p>
          <div style={{
            background: '#F5F0EB',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 32
          }}>
            <div style={{ fontSize: 12, color: '#8D6E63', marginBottom: 8 }}>订单编号</div>
            <div style={{
              fontSize: 22, fontWeight: 600,
              color: '#C0A080', letterSpacing: 2
            }}>{successOrder}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              返回首页
            </button>
            <button className="btn" onClick={() => navigate('/orders')}>
              查询订单进度
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, color: '#4E342E', marginBottom: 12 }}>银饰定制申请</h1>
        <p style={{ color: '#8D6E63', fontSize: 15 }}>填写以下信息，开启您的专属定制之旅</p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: 16,
        padding: '40px 48px',
        boxShadow: '0 4px 20px rgba(78,52,46,0.06)'
      }}>
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 15, color: '#4E342E', fontWeight: 600, marginBottom: 16, display: 'block' }}>
            1. 选择饰品类型
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12
          }}>
            {jewelryTypes.map(t => (
              <div
                key={t.value}
                onClick={() => { setForm(p => ({ ...p, jewelry_type: t.value })); setErrors(e => ({ ...e, jewelry_type: '' })); }}
                style={{
                  padding: '20px 16px',
                  borderRadius: 12,
                  border: `2px solid ${form.jewelry_type === t.value ? '#C0A080' : '#E8DFD6'}`,
                  background: form.jewelry_type === t.value ? 'rgba(192,160,128,0.08)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                className="card-hover"
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 500, color: '#4E342E' }}>{t.label}</div>
              </div>
            ))}
          </div>
          {errors.jewelry_type && <div style={{ color: '#E57373', fontSize: 13, marginTop: 8 }}>{errors.jewelry_type}</div>}
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 15, color: '#4E342E', fontWeight: 600, marginBottom: 16, display: 'block' }}>
            2. 选择材质
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {materials.map(m => (
              <div
                key={m.value}
                onClick={() => { setForm(p => ({ ...p, material: m.value })); setErrors(e => ({ ...e, material: '' })); }}
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: `2px solid ${form.material === m.value ? '#C0A080' : '#E8DFD6'}`,
                  background: form.material === m.value ? 'rgba(192,160,128,0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#4E342E' }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: '#8D6E63', marginTop: 4 }}>{m.desc}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${form.material === m.value ? '#C0A080' : '#D7CCC8'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {form.material === m.value && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C0A080' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.material && <div style={{ color: '#E57373', fontSize: 13, marginTop: 8 }}>{errors.material}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="form-group">
            <label>刻字内容 <span style={{ color: '#8D6E63', fontWeight: 400 }}>(最多8字符，可选)</span></label>
            <input
              type="text"
              name="engraving"
              value={form.engraving}
              onChange={handleChange}
              placeholder="例如：FOREVER / 名字缩写"
              maxLength={8}
            />
            <div style={{ fontSize: 12, color: '#8D6E63', marginTop: 4 }}>
              {form.engraving.length}/8 字符
              {errors.engraving && <span style={{ color: '#E57373', marginLeft: 8 }}>{errors.engraving}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>期望尺寸</label>
            <input
              type="text"
              name="size"
              value={form.size}
              onChange={handleChange}
              placeholder="戒指圈号/手镯内径/吊坠尺寸"
            />
            {errors.size && <div style={{ color: '#E57373', fontSize: 13, marginTop: 4 }}>{errors.size}</div>}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label>期望交付截止日期</label>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            min={today}
          />
          {errors.deadline && <div style={{ color: '#E57373', fontSize: 13, marginTop: 4 }}>{errors.deadline}</div>}
        </div>

        <div className="form-group" style={{ marginBottom: 32 }}>
          <label>设计草图上传 <span style={{ color: '#8D6E63', fontWeight: 400 }}>(JPG/PNG, ≤5MB, 可选)</span></label>
          <div
            onClick={() => document.getElementById('sketch-input')?.click()}
            style={{
              border: `2px dashed ${errors.sketch ? '#E57373' : '#D7CCC8'}`,
              borderRadius: 12,
              padding: preview ? 16 : '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: preview ? '#FAF7F4' : 'white'
            }}
          >
            {preview ? (
              <div>
                <img src={preview} alt="预览" style={{
                  maxHeight: 180, borderRadius: 8, marginBottom: 12
                }} />
                <div style={{ fontSize: 13, color: '#8D6E63' }}>点击更换图片</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <div style={{ color: '#6D4C41', marginBottom: 4 }}>点击或拖拽上传设计草图</div>
                <div style={{ fontSize: 12, color: '#A1887F' }}>手绘、照片皆可，帮助我们更好理解您的需求</div>
              </div>
            )}
            <input
              id="sketch-input"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          {errors.sketch && <div style={{ color: '#E57373', fontSize: 13, marginTop: 8 }}>{errors.sketch}</div>}
        </div>

        <div style={{
          borderTop: '1px solid #E8DFD6',
          paddingTop: 32,
          marginBottom: 24
        }}>
          <label style={{ fontSize: 15, color: '#4E342E', fontWeight: 600, marginBottom: 16, display: 'block' }}>
            3. 您的联系信息
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="请输入您的姓名"
              />
              {errors.customer_name && <div style={{ color: '#E57373', fontSize: 13, marginTop: 4 }}>{errors.customer_name}</div>}
            </div>
            <div className="form-group">
              <label>手机号码 *</label>
              <input
                type="tel"
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                placeholder="11位手机号"
                maxLength={11}
              />
              {errors.customer_phone && <div style={{ color: '#E57373', fontSize: 13, marginTop: 4 }}>{errors.customer_phone}</div>}
            </div>
          </div>
          <div className="form-group">
            <label>邮箱地址 <span style={{ color: '#8D6E63', fontWeight: 400 }}>(用于接收进度通知，可选)</span></label>
            <input
              type="email"
              name="customer_email"
              value={form.customer_email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
            {errors.customer_email && <div style={{ color: '#E57373', fontSize: 13, marginTop: 4 }}>{errors.customer_email}</div>}
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 16,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '提交中...' : '提交定制申请'}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
