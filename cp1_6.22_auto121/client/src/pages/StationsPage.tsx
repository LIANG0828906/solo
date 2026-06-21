import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stationApi } from '../api';
import type { Station } from '../types';

interface ToastState {
  message: string;
  id: number;
  fading: boolean;
}

const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '31.2304',
    longitude: '121.4737',
    contact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const s = await stationApi.getAll();
      setStations(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (message: string) => {
    const id = Date.now();
    setToast({ message, id, fading: false });
    setTimeout(() => {
      setToast((t) => (t && t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 300);
    }, 2700);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '请输入站点名称';
    if (!form.address.trim()) e.address = '请输入站点地址';
    if (!form.latitude || isNaN(Number(form.latitude))) e.latitude = '请输入有效纬度';
    if (!form.longitude || isNaN(Number(form.longitude))) e.longitude = '请输入有效经度';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const s = await stationApi.create({
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        contact: form.contact.trim() || undefined,
      });
      setStations((prev) => [...prev, s]);
      setForm({ name: '', address: '', latitude: '31.2304', longitude: '121.4737', contact: '' });
      setErrors({});
      showToast(`✅ 站点「${s.name}」添加成功！`);
    } catch (err: any) {
      const msg = err.response?.data?.error || '添加失败，请重试';
      setErrors({ _form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '10px 12px',
    border: `2px solid ${errors[field] ? '#FF5252' : '#1976D2'}`,
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    marginBottom: errors[field] ? '4px' : '14px',
  });

  const renderTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#1565C0', color: '#fff' }}>
            <th style={thStyle}>站点名称</th>
            <th style={thStyle}>地址</th>
            <th style={thStyle}>坐标</th>
            <th style={thStyle}>联系方式</th>
            <th style={thStyle}>在架图书</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s, i) => (
            <tr
              key={s.id}
              style={{
                borderBottom: i < stations.length - 1 ? '1px solid #eee' : 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#F5F9FF')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
            >
              <td style={tdStyle}>
                <div style={{ fontWeight: 600, color: '#1565C0' }}>{s.name}</div>
              </td>
              <td style={{ ...tdStyle, maxWidth: '200px' }}>{s.address}</td>
              <td style={tdStyle}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </span>
              </td>
              <td style={tdStyle}>{s.contact || '-'}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: s.bookCount > 10 ? '#E8F5E9' : '#FFEBEE',
                    color: s.bookCount > 10 ? '#4CAF50' : '#FF5252',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  {s.bookCount} 本
                </span>
              </td>
              <td style={tdStyle}>
                <Link
                  to={`/stations/${s.id}`}
                  style={{
                    color: '#1976D2',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  详情 →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {stations.map((s) => (
        <div
          key={s.id}
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontWeight: 600, color: '#1565C0', fontSize: '15px' }}>📍 {s.name}</div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '12px',
                background: s.bookCount > 10 ? '#E8F5E9' : '#FFEBEE',
                color: s.bookCount > 10 ? '#4CAF50' : '#FF5252',
                fontWeight: 600,
                fontSize: '12px',
                height: 'fit-content',
              }}
            >
              {s.bookCount} 本
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>{s.address}</div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
            📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
            {s.contact && ` | 📞 ${s.contact}`}
          </div>
          <Link
            to={`/stations/${s.id}`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px',
              background: '#1565C0',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            查看详情
          </Link>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {toast && (
        <div
          className={toast.fading ? 'toast-fade-out' : 'toast-slide-in'}
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#4CAF50',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
            zIndex: 2000,
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          {toast.message}
        </div>
      )}

      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>
        📍 站点管理
      </h2>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                站点列表
                <span style={{ marginLeft: '8px', color: '#888', fontWeight: 400, fontSize: '13px' }}>
                  共 {stations.length} 个
                </span>
              </h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>
            ) : stations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                暂无站点，请在右侧添加
              </div>
            ) : isMobile ? (
              renderCards()
            ) : (
              renderTable()
            )}
          </div>
        </div>

        <div style={{ width: isMobile ? '100%' : '360px', flexShrink: 0 }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1976D2' }}>
              ➕ 添加新站点
            </h3>

            {errors._form && (
              <div
                style={{
                  background: '#FFEBEE',
                  color: '#FF5252',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '13px',
                }}
              >
                {errors._form}
              </div>
            )}

            <label style={labelStyle}>站点名称 *</label>
            <input
              style={inputStyle('name')}
              placeholder="例如：静安寺社区图书角"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <div style={errStyle}>{errors.name}</div>}

            <label style={labelStyle}>详细地址 *</label>
            <input
              style={inputStyle('address')}
              placeholder="例如：上海市静安区南京西路1688号"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            {errors.address && <div style={errStyle}>{errors.address}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>纬度 *</label>
                <input
                  style={inputStyle('latitude')}
                  type="number"
                  step="0.0001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
                {errors.latitude && <div style={errStyle}>{errors.latitude}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>经度 *</label>
                <input
                  style={inputStyle('longitude')}
                  type="number"
                  step="0.0001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
                {errors.longitude && <div style={errStyle}>{errors.longitude}</div>}
              </div>
            </div>

            <label style={labelStyle}>联系信息</label>
            <input
              style={inputStyle('contact')}
              placeholder="电话或邮箱（选填）"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />

            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(25,118,210,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(25,118,210,0.2)';
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: submitting ? '#90CAF9' : '#1976D2',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
              }}
            >
              {submitting ? '添加中...' : '提交并添加站点'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: '#333',
  verticalAlign: 'middle',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#1976D2',
  marginBottom: '6px',
};

const errStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#FF5252',
  marginBottom: '10px',
};

export default StationsPage;
