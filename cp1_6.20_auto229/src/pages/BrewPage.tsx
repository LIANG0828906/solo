import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import BrewForm from '@/components/BrewForm';
import RadarChart from '@/components/RadarChart';
import { beanApi, brewApi } from '@/utils/storage';
import type { BrewParams, FlavorProfile, CoffeeBean } from '@/types';

export default function BrewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const beanId = searchParams.get('beanId');

  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [selectedBeanId, setSelectedBeanId] = useState<string>(beanId || '');
  const [params, setParams] = useState<BrewParams>({
    waterTemp: 92,
    grindSize: 5,
    waterRatio: 15,
    pourTime: 150,
  });
  const [flavor, setFlavor] = useState<FlavorProfile>({
    acidity: 5,
    bitterness: 5,
    sweetness: 5,
    body: 5,
    aftertaste: 5,
    cleanliness: 5,
  });
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [animatedParams, setAnimatedParams] = useState<BrewParams | null>(null);

  useEffect(() => {
    beanApi.getAll().then(setBeans);
  }, []);

  useEffect(() => {
    const copied = sessionStorage.getItem('copiedBrew');
    if (copied) {
      try {
        const brew = JSON.parse(copied);
        const targetParams = brew.params;
        setAnimatedParams(targetParams);
        setFlavor(brew.flavor);
        setNotes(brew.notes || '');
        setSelectedBeanId(brew.beanId);

        const startValues = { waterTemp: 85, grindSize: 1, waterRatio: 10, pourTime: 30 };
        const startTime = performance.now();
        const duration = 400;

        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 2);

          setParams({
            waterTemp: startValues.waterTemp + (targetParams.waterTemp - startValues.waterTemp) * eased,
            grindSize: startValues.grindSize + (targetParams.grindSize - startValues.grindSize) * eased,
            waterRatio: startValues.waterRatio + (targetParams.waterRatio - startValues.waterRatio) * eased,
            pourTime: startValues.pourTime + (targetParams.pourTime - startValues.pourTime) * eased,
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
        sessionStorage.removeItem('copiedBrew');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const selectedBean = beans.find((b) => b.id === selectedBeanId);

  const handleSave = async () => {
    if (!selectedBeanId) {
      alert('请选择咖啡豆');
      return;
    }
    setIsSaving(true);
    try {
      await brewApi.create({
        beanId: selectedBeanId,
        beanName: selectedBean?.name || '',
        params,
        flavor,
        notes,
        isPublic,
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const overallScore =
    Object.values(flavor).reduce((a, b) => a + b, 0) / 6;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          返回
        </button>
        <h2 style={styles.title}>创建冲煮记录</h2>
        <div style={{ width: 80 }} />
      </div>

      <div className="brew-page-content" style={styles.content}>
        <div className="brew-left" style={styles.leftPanel}>
          <div style={styles.section}>
            <label style={styles.sectionLabel}>选择咖啡豆</label>
            <select
              value={selectedBeanId}
              onChange={(e) => setSelectedBeanId(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择咖啡豆</option>
              {beans.map((bean) => (
                <option key={bean.id} value={bean.id}>
                  {bean.name}
                </option>
              ))}
            </select>
          </div>

          <BrewForm params={params} onChange={setParams} />

          <div style={styles.notesSection}>
            <label style={styles.sectionLabel}>冲煮笔记</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="记录这次冲煮的感受和发现..."
              rows={3}
            />
          </div>

          <div style={styles.publicToggle}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={styles.checkbox}
              />
              分享到社区
            </label>
          </div>
        </div>

        <div className="brew-right" style={styles.rightPanel}>
          <div style={styles.radarSection}>
            <div style={styles.radarHeader}>
              <h3 style={styles.sectionTitle}>风味评分</h3>
              <div style={styles.scoreBadge}>
                <span style={styles.scoreValue}>{overallScore.toFixed(1)}</span>
                <span style={styles.scoreLabel}>综合分</span>
              </div>
            </div>
            <p style={styles.radarHint}>拖拽各维度端点调整评分（1-10分）</p>
            <div style={styles.radarContainer}>
              <RadarChart value={flavor} onChange={setFlavor} size={280} />
            </div>
          </div>

          <button
            style={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? '保存中...' : '保存记录'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    color: '#eee',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottom: '1px solid #2a3f5f',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    color: '#aaa',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  content: {
    flex: 1,
    display: 'flex',
    gap: 24,
    paddingTop: 24,
    overflow: 'auto',
  },
  leftPanel: {
    flex: '0 0 60%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  select: {
    padding: '12px 14px',
    backgroundColor: '#16213e',
    border: '1px solid #2a3f5f',
    borderRadius: 8,
    color: '#eee',
    fontSize: 15,
    outline: 'none',
    cursor: 'pointer',
  },
  notesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  textarea: {
    padding: '12px 14px',
    backgroundColor: '#16213e',
    border: '1px solid #2a3f5f',
    borderRadius: 8,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  publicToggle: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: '#aaa',
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: '#e94560',
    cursor: 'pointer',
  },
  radarSection: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  radarHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    padding: '8px 16px',
    borderRadius: 10,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e94560',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#e94560',
  },
  radarHint: {
    fontSize: 12,
    color: '#888',
    margin: 0,
  },
  radarContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '16px 24px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 'auto',
  },
};
