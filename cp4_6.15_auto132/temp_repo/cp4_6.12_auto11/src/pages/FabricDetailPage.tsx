import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFabricById } from '../api/fabricApi';
import { Fabric } from '../types';

const FabricDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchFabricById(Number(id))
        .then((f) => setFabric(f))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div style={styles.loading}>加载中...</div>
    );
  }

  if (!fabric) {
    return (
      <div style={styles.loading}>布料不存在</div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← 返回
        </button>
        <h1 style={styles.title}>布料详情</h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={styles.content}>
        <div style={styles.preview}>
          <div style={{ ...styles.previewSwatch, background: fabric.gradient }} />
          {fabric.stockMeters < 5 && (
            <div style={styles.stockWarning}>
              ⚠️ 库存不足：仅剩 {fabric.stockMeters} 米
            </div>
          )}
        </div>

        <div style={styles.details}>
          <h2 style={styles.name}>{fabric.name}</h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.label}>颜色分类</span>
              <span style={styles.value}>{fabric.color}色</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.label}>花纹类型</span>
              <span style={styles.value}>{fabric.pattern}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.label}>颜色代码</span>
              <span style={{ ...styles.value, fontFamily: 'monospace' }}>
                <span style={{ ...styles.colorDot, background: fabric.colorCode }} />
                {fabric.colorCode}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.label}>门幅宽度</span>
              <span style={styles.value}>{fabric.width} 米</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.label}>单价</span>
              <span style={{ ...styles.value, color: '#B87333', fontWeight: 700 }}>
                ¥{fabric.pricePerMeter} / 米
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.label}>当前库存</span>
              <span style={{
                ...styles.value,
                color: fabric.stockMeters < 5 ? '#C94A4A' : '#5D4037',
                fontWeight: fabric.stockMeters < 5 ? 700 : 500,
              }}>
                {fabric.stockMeters} 米
              </span>
            </div>
          </div>

          {fabric.description && (
            <div style={styles.description}>
              <div style={styles.label}>布料描述</div>
              <div style={styles.descText}>{fabric.description}</div>
            </div>
          )}

          <div style={styles.actions}>
            {fabric.stockMeters < 5 && (
              <button
                onClick={() => navigate(`/procurement/${fabric.id}`)}
                style={styles.primaryBtn}
              >
                📦 查看补货建议
              </button>
            )}
            <button
              onClick={() => navigate('/studio')}
              style={styles.secondaryBtn}
            >
              ✂️ 开始设计
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#F5F0E8',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    background: '#FFFAF4',
    borderBottom: '1px solid #D7C4A1',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#5D4037',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: 60,
    color: '#8D6E63',
  },
  content: {
    flex: 1,
    display: 'flex',
    padding: 32,
    gap: 32,
    overflowY: 'auto',
  },
  preview: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  previewSwatch: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(93, 64, 55, 0.15)',
    border: '4px solid #FFFAF4',
  },
  stockWarning: {
    background: '#FCE8E8',
    color: '#C94A4A',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 500,
  },
  details: {
    flex: 1,
    background: '#FFFAF4',
    borderRadius: 16,
    padding: 32,
    border: '1px solid #E8DDD0',
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#5D4037',
    margin: '0 0 24px 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 12,
    background: '#F5F0E8',
    borderRadius: 8,
  },
  label: {
    fontSize: 11,
    color: '#8D6E63',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#5D4037',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    display: 'inline-block',
    border: '1px solid #D7C4A1',
  },
  description: {
    marginBottom: 24,
  },
  descText: {
    marginTop: 8,
    padding: 12,
    background: '#F5F0E8',
    borderRadius: 8,
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    padding: '12px 24px',
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default FabricDetailPage;
