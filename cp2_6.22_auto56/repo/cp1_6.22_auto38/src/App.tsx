import { useState, useEffect, useCallback } from 'react';
import FlavorWheel from './components/FlavorWheel';
import FlavorLog from './components/FlavorLog';
import { getFlavors, submitLog, FlavorLogItem } from './modules/api';
import { flatToHierarchy, filterByRoastAndOrigin, HierarchyDatum } from './modules/data';

type RoastLevel = 'light' | 'medium' | 'dark';
type Origin = 'africa' | 'central_south_america' | 'asia';

type LoadingState = 'loading' | 'error' | 'success';

const ROAST_OPTIONS: { value: RoastLevel | null; label: string }[] = [
  { value: null, label: '全部' },
  { value: 'light', label: '浅烘' },
  { value: 'medium', label: '中烘' },
  { value: 'dark', label: '深烘' },
];

const ORIGIN_OPTIONS: { value: Origin | null; label: string }[] = [
  { value: null, label: '全部' },
  { value: 'africa', label: '非洲' },
  { value: 'central_south_america', label: '中南美' },
  { value: 'asia', label: '亚洲' },
];

export default function App() {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [hierarchyData, setHierarchyData] = useState<HierarchyDatum | null>(null);
  const [filteredData, setFilteredData] = useState<HierarchyDatum | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<FlavorLogItem[]>([]);
  const [roastFilter, setRoastFilter] = useState<RoastLevel | null>(null);
  const [originFilter, setOriginFilter] = useState<Origin | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [beanName, setBeanName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = useCallback(async () => {
    setLoadingState('loading');
    try {
      const data = await getFlavors();
      const hierarchy = flatToHierarchy(data);
      setHierarchyData(hierarchy);
      setFilteredData(hierarchy);
      setLoadingState('success');
    } catch {
      setLoadingState('error');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (hierarchyData) {
      const roastArr = roastFilter ? [roastFilter] : null;
      const originArr = originFilter ? [originFilter] : null;
      setFilteredData(filterByRoastAndOrigin(hierarchyData, roastArr, originArr));
    }
  }, [hierarchyData, roastFilter, originFilter]);

  const handleSelectFlavor = (flavor: FlavorLogItem) => {
    setSelectedFlavors((prev) => {
      if (prev.some((f) => f.id === flavor.id)) {
        return prev;
      }
      return [...prev, flavor];
    });
  };

  const handleRemoveFlavor = (id: string) => {
    setSelectedFlavors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearFlavors = () => {
    setSelectedFlavors([]);
  };

  const handleReorderFlavors = (flavors: FlavorLogItem[]) => {
    setSelectedFlavors(flavors);
  };

  const handleOpenSave = () => {
    if (selectedFlavors.length === 0) return;
    setShowModal(true);
    setModalClosing(false);
  };

  const handleCloseModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
    }, 300);
  };

  const handleSave = async () => {
    if (selectedFlavors.length === 0) return;

    try {
      await submitLog({
        beanName: beanName || '未命名咖啡豆',
        flavors: selectedFlavors,
        timestamp: new Date().toISOString(),
      });

      handleCloseModal();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setSelectedFlavors([]);
      setBeanName('');
    } catch {
      console.error('保存失败');
    }
  };

  const getRoastBtnClass = (value: RoastLevel | null) => {
    if (roastFilter !== value) return 'filter-btn';
    if (value === 'light') return 'filter-btn active-light';
    if (value === 'medium') return 'filter-btn active-medium';
    if (value === 'dark') return 'filter-btn active-dark';
    return 'filter-btn active';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>☕ 咖啡豆风味轮盘</h1>
        <p>探索与记录您的咖啡风味之旅</p>
      </header>

      <div className="main-container">
        <section className="wheel-section">
          <div className="filter-section">
            <div className="filter-group">
              <span className="filter-label">烘焙程度</span>
              <div className="button-group">
                {ROAST_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    className={getRoastBtnClass(opt.value)}
                    onClick={() => setRoastFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">产地</span>
              <div className="button-group">
                {ORIGIN_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    className={`filter-btn ${originFilter === opt.value ? 'active' : ''}`}
                    onClick={() => setOriginFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 'auto' }}>
              <button
                className="action-btn primary"
                onClick={handleOpenSave}
                disabled={selectedFlavors.length === 0}
                style={{ width: 'auto', padding: '10px 28px' }}
              >
                保存记录
              </button>
            </div>
          </div>

          {isMobile && (
            <button
              className="mobile-toggle"
              onClick={() => setLogCollapsed((prev) => !prev)}
            >
              {logCollapsed ? '展开风味记录' : '收起风味记录'}
            </button>
          )}

          {loadingState === 'loading' && (
            <div className="loading-container">
              <span className="coffee-bean-loader">☕</span>
              <span className="loading-text">正在加载风味数据...</span>
            </div>
          )}

          {loadingState === 'error' && (
            <div className="error-container">
              <span style={{ fontSize: 64 }}>😢</span>
              <span className="loading-text">加载风味数据失败</span>
              <button className="retry-btn" onClick={loadData}>
                重新加载
              </button>
            </div>
          )}

          {loadingState === 'success' && filteredData && (
            <FlavorWheel
              data={filteredData}
              onSelectFlavor={handleSelectFlavor}
              selectedIds={selectedFlavors.map((f) => f.id)}
            />
          )}
        </section>

        <FlavorLog
          flavors={selectedFlavors}
          onRemove={handleRemoveFlavor}
          onClear={handleClearFlavors}
          onReorder={handleReorderFlavors}
          mobileCollapsed={isMobile && logCollapsed}
        />
      </div>

      {showModal && (
        <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div
            className={`modal-content ${modalClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">保存风味记录</h2>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">咖啡豆名称</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="例如：埃塞俄比亚 耶加雪菲"
                  value={beanName}
                  onChange={(e) => setBeanName(e.target.value)}
                />
              </div>

              <div className="summary-section">
                <div className="summary-label">已选风味（{selectedFlavors.length}个）</div>
                <div className="summary-flavors">
                  {selectedFlavors.map((f) => (
                    <span key={f.id} className="summary-tag">
                      {f.name}
                    </span>
                  ))}
                </div>
                <div className="summary-timestamp">
                  记录时间：{new Date().toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="modal-actions">
                <button className="action-btn secondary" onClick={handleCloseModal}>
                  取消
                </button>
                <button className="action-btn primary" onClick={handleSave}>
                  确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${showToast ? 'show' : ''}`}>✓ 记录已保存</div>
    </div>
  );
}
