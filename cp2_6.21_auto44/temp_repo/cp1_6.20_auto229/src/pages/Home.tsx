import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Coffee } from 'lucide-react';
import BeanCard from '@/components/BeanCard';
import FlavorTimeline from '@/components/FlavorTimeline';
import { beanApi, brewApi } from '@/utils/storage';
import type { CoffeeBean, BrewRecord } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBean, setNewBean] = useState({
    name: '',
    origin: '',
    roastLevel: 'medium' as CoffeeBean['roastLevel'],
    processMethod: '',
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [beansData, brewsData] = await Promise.all([
        beanApi.getAll(),
        brewApi.getAll(),
      ]);
      setBeans(beansData);
      setBrews(brewsData);
      if (beansData.length > 0 && !selectedBean) {
        setSelectedBean(beansData[0]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getBrewCount = (beanId: string) => {
    return brews.filter((b) => b.beanId === beanId).length;
  };

  const getBeanBrews = (beanId: string) => {
    return brews.filter((b) => b.beanId === beanId);
  };

  const handleAddBean = async () => {
    if (!newBean.name || !newBean.origin) return;
    try {
      await beanApi.create(newBean);
      setShowAddModal(false);
      setNewBean({
        name: '',
        origin: '',
        roastLevel: 'medium',
        processMethod: '',
        latitude: 0,
        longitude: 0,
      });
      loadData();
    } catch (err) {
      console.error('Failed to add bean:', err);
    }
  };

  return (
    <div className="home-container" style={styles.container}>
      <div className="home-left" style={styles.leftPanel}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <Coffee size={24} style={{ marginRight: 10 }} />
            我的咖啡豆
          </h2>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            添加豆子
          </button>
        </div>

        <div className="beans-grid" style={styles.beansGrid}>
          {beans.map((bean) => (
            <BeanCard
              key={bean.id}
              bean={bean}
              brewCount={getBrewCount(bean.id)}
              onClick={() => setSelectedBean(bean)}
            />
          ))}
        </div>

        {selectedBean && (
          <div style={styles.quickAction}>
            <button
              style={styles.brewBtn}
              onClick={() => navigate(`/brew/new?beanId=${selectedBean.id}`)}
            >
              为「{selectedBean.name}」创建冲煮记录
            </button>
          </div>
        )}
      </div>

      <div className="home-right" style={styles.rightPanel}>
        <FlavorTimeline
          brews={selectedBean ? getBeanBrews(selectedBean.id) : brews}
          beanName={selectedBean?.name}
        />

        <div style={styles.statsCard}>
          <h4 style={styles.statsTitle}>冲煮统计</h4>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{brews.length}</span>
              <span style={styles.statLabel}>总记录</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{beans.length}</span>
              <span style={styles.statLabel}>豆子种类</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {brews.length > 0
                  ? (
                      brews.reduce((sum, b) => sum + b.overallScore, 0) /
                      brews.length
                    ).toFixed(1)
                  : '0'}
              </span>
              <span style={styles.statLabel}>平均评分</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>添加咖啡豆</h3>

            <div style={styles.formField}>
              <label style={styles.formLabel}>名称</label>
              <input
                type="text"
                value={newBean.name}
                onChange={(e) => setNewBean({ ...newBean, name: e.target.value })}
                style={styles.formInput}
                placeholder="如：耶加雪菲 科契尔"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.formLabel}>产地</label>
              <input
                type="text"
                value={newBean.origin}
                onChange={(e) => setNewBean({ ...newBean, origin: e.target.value })}
                style={styles.formInput}
                placeholder="如：埃塞俄比亚 耶加雪菲"
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>烘焙度</label>
                <select
                  value={newBean.roastLevel}
                  onChange={(e) =>
                    setNewBean({
                      ...newBean,
                      roastLevel: e.target.value as CoffeeBean['roastLevel'],
                    })
                  }
                  style={styles.formSelect}
                >
                  <option value="light">浅烘</option>
                  <option value="medium">中烘</option>
                  <option value="medium-dark">中深烘</option>
                  <option value="dark">深烘</option>
                </select>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>处理法</label>
                <input
                  type="text"
                  value={newBean.processMethod}
                  onChange={(e) =>
                    setNewBean({ ...newBean, processMethod: e.target.value })
                  }
                  style={styles.formInput}
                  placeholder="水洗/日晒/蜜处理"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>纬度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newBean.latitude}
                  onChange={(e) =>
                    setNewBean({ ...newBean, latitude: Number(e.target.value) })
                  }
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>经度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newBean.longitude}
                  onChange={(e) =>
                    setNewBean({ ...newBean, longitude: Number(e.target.value) })
                  }
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button style={styles.submitBtn} onClick={handleAddBean}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 24,
    height: '100%',
  },
  leftPanel: {
    flex: '0 0 65%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflow: 'auto',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#eee',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  beansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
  },
  quickAction: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  brewBtn: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#16213e',
    color: '#e94560',
    border: '1px solid #e94560',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#eee',
    margin: '0 0 16px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 8px',
    backgroundColor: '#0f1729',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e94560',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 28,
    width: '90%',
    maxWidth: 420,
    color: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 20px 0',
    color: '#eee',
  },
  formField: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  formLabel: {
    fontSize: 13,
    color: '#aaa',
  },
  formInput: {
    padding: '10px 12px',
    backgroundColor: '#0f3460',
    border: '1px solid #1a4080',
    borderRadius: 8,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
  },
  formSelect: {
    padding: '10px 12px',
    backgroundColor: '#0f3460',
    border: '1px solid #1a4080',
    borderRadius: 8,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#aaa',
    border: '1px solid #333',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
