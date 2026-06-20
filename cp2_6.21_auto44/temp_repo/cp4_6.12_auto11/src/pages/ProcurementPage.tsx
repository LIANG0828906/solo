import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFabricById } from '../api/fabricApi';
import { Fabric } from '../types';

const ProcurementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState(10);

  useEffect(() => {
    if (id) {
      fetchFabricById(Number(id))
        .then((f) => {
          setFabric(f);
          setOrderQuantity(Math.max(10, Math.ceil((10 - f.stockMeters) / 5) * 5));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (!fabric) {
    return <div style={styles.loading}>布料不存在</div>;
  }

  const suggestedAmount = Math.max(10, Math.ceil((10 - fabric.stockMeters) / 5) * 5);
  const estimatedCost = orderQuantity * fabric.pricePerMeter;
  const totalAfterOrder = fabric.stockMeters + orderQuantity;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← 返回
        </button>
        <h1 style={styles.title}>📦 采购建议</h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.fabricSwatch, background: fabric.gradient }} />
            <div style={styles.fabricInfo}>
              <h2 style={styles.fabricName}>{fabric.name}</h2>
              <div style={styles.fabricMeta}>
                <span style={styles.tag}>{fabric.color}色</span>
                <span style={styles.tag}>{fabric.pattern}</span>
                <span style={styles.priceTag}>¥{fabric.pricePerMeter}/米</span>
              </div>
            </div>
          </div>

          <div style={styles.alert}>
            <span style={styles.alertIcon}>⚠️</span>
            <div>
              <div style={styles.alertTitle}>库存预警</div>
              <div style={styles.alertText}>
                当前库存仅 <b>{fabric.stockMeters} 米</b>，低于安全库存 5 米，建议及时补货。
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>补货建议</div>
            <div style={styles.suggestionBox}>
              <div style={styles.suggestionRow}>
                <span style={styles.suggestionLabel}>安全库存量</span>
                <span style={styles.suggestionValue}>10 米</span>
              </div>
              <div style={styles.suggestionRow}>
                <span style={styles.suggestionLabel}>建议补货量</span>
                <span style={{ ...styles.suggestionValue, color: '#B87333', fontWeight: 700 }}>
                  {suggestedAmount} 米
                </span>
              </div>
              <div style={styles.suggestionRow}>
                <span style={styles.suggestionLabel}>补货后库存</span>
                <span style={styles.suggestionValue}>
                  {fabric.stockMeters} + {suggestedAmount} = {totalAfterOrder} 米
                </span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>调整采购数量</div>
            <div style={styles.quantitySelector}>
              <button
                onClick={() => setOrderQuantity(Math.max(5, orderQuantity - 5))}
                style={styles.qtyBtn}
              >
                −
              </button>
              <input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
                style={styles.qtyInput}
                min={1}
                step={1}
              />
              <button
                onClick={() => setOrderQuantity(orderQuantity + 5)}
                style={styles.qtyBtn}
              >
                +
              </button>
              <span style={styles.qtyUnit}>米</span>
            </div>
            <div style={styles.quickBtns}>
              {[5, 10, 15, 20, 30].map((q) => (
                <button
                  key={q}
                  onClick={() => setOrderQuantity(q)}
                  style={{
                    ...styles.quickBtn,
                    background: orderQuantity === q ? '#B87333' : '#F5F0E8',
                    color: orderQuantity === q ? '#FFFAF4' : '#5D4037',
                  }}
                >
                  {q}米
                </button>
              ))}
            </div>
          </div>

          <div style={styles.costSummary}>
            <div style={styles.costRow}>
              <span style={styles.costLabel}>采购数量</span>
              <span style={styles.costValue}>{orderQuantity} 米</span>
            </div>
            <div style={styles.costRow}>
              <span style={styles.costLabel}>单价</span>
              <span style={styles.costValue}>¥{fabric.pricePerMeter} / 米</span>
            </div>
            <div style={styles.divider} />
            <div style={{ ...styles.costRow, marginTop: 12 }}>
              <span style={{ ...styles.costLabel, fontSize: 16, fontWeight: 600 }}>预估总金额</span>
              <span style={{ ...styles.costValue, fontSize: 24, color: '#B87333', fontWeight: 700 }}>
                ¥{estimatedCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              onClick={() => navigate('/admin/fabrics')}
              style={styles.primaryBtn}
            >
              ✓ 确认采购计划
            </button>
            <button
              onClick={() => navigate(-1)}
              style={styles.secondaryBtn}
            >
              取消
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
    padding: 32,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 600,
    background: '#FFFAF4',
    borderRadius: 20,
    padding: 32,
    border: '1px solid #E8DDD0',
    boxShadow: '0 8px 32px rgba(93, 64, 55, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: '1px solid #E8DDD0',
  },
  fabricSwatch: {
    width: 80,
    height: 80,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(93, 64, 55, 0.15)',
    border: '3px solid #FFFAF4',
  },
  fabricInfo: {
    flex: 1,
  },
  fabricName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#5D4037',
    margin: '0 0 8px 0',
  },
  fabricMeta: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    background: '#F5F0E8',
    color: '#5D4037',
    padding: '2px 10px',
    borderRadius: 10,
    fontSize: 11,
  },
  priceTag: {
    background: 'rgba(184, 115, 51, 0.1)',
    color: '#B87333',
    padding: '2px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  },
  alert: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    background: '#FCE8E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    border: '1px solid #F5C8C8',
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTitle: {
    fontWeight: 700,
    color: '#C94A4A',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#C94A4A',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#5D4037',
    marginBottom: 12,
  },
  suggestionBox: {
    background: '#F5F0E8',
    borderRadius: 12,
    padding: 16,
  },
  suggestionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: 14,
    color: '#5D4037',
  },
  suggestionLabel: {
    color: '#8D6E63',
  },
  suggestionValue: {
    fontWeight: 500,
  },
  quantitySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    fontSize: 18,
    fontWeight: 600,
    color: '#5D4037',
    cursor: 'pointer',
  },
  qtyInput: {
    width: 100,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    color: '#5D4037',
    outline: 'none',
    fontFamily: 'inherit',
  },
  qtyUnit: {
    fontSize: 14,
    color: '#8D6E63',
  },
  quickBtns: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickBtn: {
    padding: '6px 14px',
    borderRadius: 16,
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  costSummary: {
    background: '#F5F0E8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  costRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  costLabel: {
    fontSize: 13,
    color: '#8D6E63',
  },
  costValue: {
    fontSize: 14,
    color: '#5D4037',
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: '#D7C4A1',
    margin: '8px 0',
  },
  actions: {
    display: 'flex',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    padding: '14px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    padding: '14px 24px',
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default ProcurementPage;
