import { useState, useEffect, useRef, useCallback } from 'react';
import SceneManager from './SceneManager';
import { eventBus } from './eventBus';
import { dataProvider, MineralNode, RegionData, RockLayer } from './DataProvider';

interface Statistics {
  totalMinerals: number;
  totalLayers: number;
  typeCount: Record<string, number>;
  totalReserve: Record<string, number>;
}

const MINERAL_ICONS: Record<string, string> = {
  '金矿': '🥇',
  '铜矿': '🟠',
  '铁矿': '⚙️',
  '煤矿': '⬛'
};

const REGION_ICONS: Record<string, string> = {
  '华北平原': '🌾',
  '长江流域': '🏞️',
  '青藏高原': '🏔️',
  '塔里木盆地': '🏜️',
  '松辽平原': '🌲'
};

function formatReserve(value: number): string {
  if (value >= 100000000) return (value / 100000000).toFixed(2) + ' 亿吨';
  if (value >= 10000) return (value / 10000).toFixed(2) + ' 万吨';
  return value.toFixed(0) + ' 吨';
}

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [regions] = useState<RegionData[]>(() => dataProvider.getRegions());
  const [currentRegionId, setCurrentRegionId] = useState<string>(regions[0]?.id || '');
  const [layers, setLayers] = useState<RockLayer[]>(() => dataProvider.getLayers());
  const [minDepth, setMinDepth] = useState<number>(0);
  const [maxDepth, setMaxDepth] = useState<number>(100);
  const [selectedMineral, setSelectedMineral] = useState<MineralNode | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [drillPosition, setDrillPosition] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showMineralPopup, setShowMineralPopup] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    sceneManagerRef.current = new SceneManager(canvasRef.current);
    return () => {
      sceneManagerRef.current?.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleMineralClicked = (mineral: MineralNode) => {
      setSelectedMineral(mineral);
      setShowMineralPopup(true);
    };
    const handleStats = (stats: Statistics) => setStatistics(stats);
    const handleDrill = (pos: { x: number; z: number }) => setDrillPosition(pos);

    eventBus.on('mineralClicked', handleMineralClicked);
    eventBus.on('statisticsUpdated', handleStats);
    eventBus.on('drillPositionChanged', handleDrill);

    return () => {
      eventBus.off('mineralClicked', handleMineralClicked);
      eventBus.off('statisticsUpdated', handleStats);
      eventBus.off('drillPositionChanged', handleDrill);
    };
  }, []);

  useEffect(() => {
    eventBus.emit('depthRangeChanged', minDepth, maxDepth);
  }, [minDepth, maxDepth]);

  const handleRegionChange = useCallback((regionId: string) => {
    setCurrentRegionId(regionId);
    dataProvider.selectRegion(regionId);
    setLayers(dataProvider.getLayers());
    eventBus.emit('regionChanged', regionId);
    eventBus.emit('statisticsUpdated', dataProvider.getStatistics());
  }, []);

  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible } : l));
    eventBus.emit('layerVisibilityChanged', layerId, visible);
  }, []);

  const handleResetView = useCallback(() => {
    eventBus.emit('resetView');
  }, []);

  const SidebarContent = () => (
    <>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={{ fontSize: '22px' }}>🌍</span>
          <span style={styles.title}>地质可视化</span>
        </div>
        <div style={styles.subtitle}>3D 剖面与矿物分布</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>📍</span>
          <span>区域选择</span>
        </div>
        <div style={styles.selectWrapper}>
          <select
            value={currentRegionId}
            onChange={(e) => handleRegionChange(e.target.value)}
            style={styles.select}
          >
            {regions.map(r => (
              <option key={r.id} value={r.id}>
                {REGION_ICONS[r.name] || '🗺️'} {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>📏</span>
          <span>深度范围</span>
        </div>
        <div style={styles.depthDisplay}>
          <span style={styles.depthValue}>{minDepth}m</span>
          <span style={styles.depthSeparator}>—</span>
          <span style={styles.depthValue}>{maxDepth}m</span>
        </div>
        <div style={styles.sliderContainer}>
          <label style={styles.sliderLabel}>表层深度</label>
          <input
            type="range"
            min={0}
            max={99}
            step={1}
            value={minDepth}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), maxDepth - 1);
              setMinDepth(v);
            }}
            style={styles.slider}
          />
        </div>
        <div style={styles.sliderContainer}>
          <label style={styles.sliderLabel}>底层深度</label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={maxDepth}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), minDepth + 1);
              setMaxDepth(v);
            }}
            style={styles.slider}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>🪨</span>
          <span>地层控制</span>
        </div>
        <div style={styles.layerList}>
          {layers.map(layer => (
            <label key={layer.id} style={styles.layerItem}>
              <div style={styles.layerCheckboxWrapper}>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(e) => handleLayerToggle(layer.id, e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={{
                  ...styles.layerColorDot,
                  backgroundColor: layer.color,
                  opacity: layer.visible ? 1 : 0.3
                }} />
                <span style={{
                  ...styles.layerName,
                  opacity: layer.visible ? 1 : 0.5
                }}>
                  {layer.name}
                </span>
              </div>
              <span style={styles.layerThickness}>
                {Math.round(layer.thickness)}m
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>💎</span>
          <span>统计信息</span>
        </div>
        {statistics && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>矿物总数</div>
              <div style={styles.statValue}>{statistics.totalMinerals}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>地层层数</div>
              <div style={styles.statValue}>{statistics.totalLayers}</div>
            </div>
          </div>
        )}
        {statistics && (
          <div style={styles.mineralStats}>
            {Object.entries(statistics.typeCount).map(([name, count]) => (
              <div key={name} style={styles.mineralStatItem}>
                <span style={styles.mineralStatIcon}>
                  {MINERAL_ICONS[name] || '💠'}
                </span>
                <div style={styles.mineralStatInfo}>
                  <div style={styles.mineralStatName}>{name}</div>
                  <div style={styles.mineralStatMeta}>
                    {count} 处 · {formatReserve(statistics.totalReserve[name] || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <span>🔴</span>
          <span>钻孔位置</span>
        </div>
        <div style={styles.drillInfo}>
          <div style={styles.drillCoord}>
            <span style={styles.coordLabel}>X:</span>
            <span style={styles.coordValue}>{drillPosition.x.toFixed(2)}</span>
          </div>
          <div style={styles.drillCoord}>
            <span style={styles.coordLabel}>Z:</span>
            <span style={styles.coordValue}>{drillPosition.z.toFixed(2)}</span>
          </div>
        </div>
        <div style={styles.hintBox}>
          💡 点击地表任意位置移动钻孔标记
        </div>
      </div>

      <div style={styles.actionSection}>
        <button onClick={handleResetView} style={styles.resetButton}>
          🔄 重置视角
        </button>
      </div>

      <div style={styles.legendSection}>
        <div style={styles.legendTitle}>操作说明</div>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>🖱️ 左键拖拽：旋转视角</div>
          <div style={styles.legendItem}>🖱️ 右键拖拽：平移</div>
          <div style={styles.legendItem}>🖱️ 滚轮：缩放</div>
          <div style={styles.legendItem}>💠 点击矿物：查看详情</div>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-container" style={styles.appContainer}>
      <div className="canvas-container" ref={canvasRef} style={{ flex: 1, position: 'relative' }} />

      {!isMobile && (
        <aside style={styles.sidebar}>
          <div style={styles.sidebarInner}>
            <SidebarContent />
          </div>
        </aside>
      )}

      {isMobile && (
        <>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={styles.hamburger}
            aria-label="菜单"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          {isMobileMenuOpen && (
            <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
              <aside
                style={styles.mobileSidebar}
                onClick={(e) => e.stopPropagation()}
              >
                <SidebarContent />
              </aside>
            </div>
          )}
        </>
      )}

      {showMineralPopup && selectedMineral && (
        <div
          style={styles.popupOverlay}
          onClick={() => setShowMineralPopup(false)}
        >
          <div
            style={styles.popup}
            onClick={(e) => e.stopPropagation()}
            className="mineral-popup"
          >
            <div style={styles.popupHeader}>
              <span style={{ fontSize: '28px' }}>
                {MINERAL_ICONS[selectedMineral.name] || '💎'}
              </span>
              <div style={styles.popupTitle}>{selectedMineral.name}</div>
              <button
                style={styles.popupClose}
                onClick={() => setShowMineralPopup(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.popupDivider} />
            <div style={styles.popupBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>矿物类型</span>
                <div style={styles.detailValueBadge}>
                  <span
                    style={{
                      ...styles.detailColorDot,
                      backgroundColor: selectedMineral.color
                    }}
                  />
                  <span style={styles.detailText}>{selectedMineral.name}</span>
                </div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>埋藏深度</span>
                <span style={styles.detailValue}>
                  {selectedMineral.depth.toFixed(2)} 米
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>矿石密度</span>
                <span style={styles.detailValue}>
                  {selectedMineral.density} g/cm³
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>节点半径</span>
                <span style={styles.detailValue}>
                  {selectedMineral.radius.toFixed(2)} 单位
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>所在岩层</span>
                <span style={styles.detailValue}>
                  {layers.find(l => l.id === selectedMineral.layerId)?.name || '未知'}
                </span>
              </div>
              <div style={{ ...styles.detailRow, marginTop: '12px' }}>
                <span style={styles.detailLabel}>预估储量</span>
                <span style={{ ...styles.detailValue, color: '#00CCFF', fontWeight: 'bold' }}>
                  {formatReserve(selectedMineral.reserve)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>空间坐标</span>
                <span style={styles.detailValueMono}>
                  ({selectedMineral.position.x.toFixed(1)},
                  {selectedMineral.position.y.toFixed(1)},
                  {selectedMineral.position.z.toFixed(1)})
                </span>
              </div>
            </div>
            <div style={styles.popupFooter}>
              <button
                style={styles.popupButton}
                onClick={() => setShowMineralPopup(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    height: '100vh',
    background: 'rgba(30, 30, 50, 0.85)',
    backdropFilter: 'blur(12px)',
    borderLeft: '2px solid #2a2a4a',
    borderRadius: '0',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 10,
    flexShrink: 0,
    overflow: 'hidden'
  },
  sidebarInner: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '20px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#00CCFF #1a1a2e'
  },
  header: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2a2a4a'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: '0.5px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#8888aa',
    paddingLeft: '32px'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#00CCFF',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(0, 204, 255, 0.15)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  selectWrapper: {
    position: 'relative'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(15, 15, 30, 0.8)',
    border: '1.5px solid #2a2a4a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  depthDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    padding: '8px 12px',
    background: 'rgba(0, 204, 255, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 204, 255, 0.2)'
  },
  depthValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#00CCFF',
    fontFamily: 'monospace'
  },
  depthSeparator: {
    color: '#666688'
  },
  sliderContainer: {
    marginBottom: '12px'
  },
  sliderLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#aaaacc',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#1a1a2e',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none'
  },
  layerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  layerItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: 'rgba(15, 15, 30, 0.6)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    userSelect: 'none'
  },
  layerCheckboxWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#00CCFF'
  },
  layerColorDot: {
    width: '14px',
    height: '14px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'opacity 0.3s'
  },
  layerName: {
    fontSize: '13px',
    color: '#ffffff',
    transition: 'opacity 0.3s'
  },
  layerThickness: {
    fontSize: '11px',
    color: '#8888aa',
    fontFamily: 'monospace',
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '14px'
  },
  statCard: {
    background: 'rgba(0, 204, 255, 0.08)',
    border: '1px solid rgba(0, 204, 255, 0.2)',
    borderRadius: '8px',
    padding: '10px 12px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '10px',
    color: '#8888aa',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#00CCFF',
    fontFamily: 'monospace'
  },
  mineralStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  mineralStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    background: 'rgba(15, 15, 30, 0.6)',
    borderRadius: '6px'
  },
  mineralStatIcon: {
    fontSize: '18px'
  },
  mineralStatInfo: {
    flex: 1
  },
  mineralStatName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  },
  mineralStatMeta: {
    fontSize: '10px',
    color: '#8888aa'
  },
  drillInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '10px'
  },
  drillCoord: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    background: 'rgba(255, 51, 51, 0.1)',
    border: '1px solid rgba(255, 51, 51, 0.3)',
    borderRadius: '6px'
  },
  coordLabel: {
    fontSize: '11px',
    color: '#ff8888',
    fontWeight: 'bold'
  },
  coordValue: {
    fontSize: '13px',
    color: '#ffffff',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right'
  },
  hintBox: {
    padding: '10px 12px',
    background: 'rgba(0, 204, 255, 0.06)',
    border: '1px dashed rgba(0, 204, 255, 0.3)',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#aaddff',
    lineHeight: '1.5'
  },
  actionSection: {
    marginBottom: '20px'
  },
  resetButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(0, 204, 255, 0.2), rgba(0, 150, 255, 0.15))',
    border: '1.5px solid rgba(0, 204, 255, 0.5)',
    borderRadius: '10px',
    color: '#00CCFF',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  legendSection: {
    padding: '14px',
    background: 'rgba(15, 15, 30, 0.6)',
    borderRadius: '10px',
    border: '1px solid #2a2a4a'
  },
  legendTitle: {
    fontSize: '11px',
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '10px'
  },
  legendItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  legendItem: {
    fontSize: '11px',
    color: '#ccccdd',
    padding: '4px 0'
  },
  hamburger: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 100,
    width: '44px',
    height: '44px',
    background: 'rgba(30, 30, 50, 0.9)',
    border: '2px solid #00CCFF',
    borderRadius: '10px',
    color: '#00CCFF',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
  },
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  mobileSidebar: {
    width: '280px',
    height: '100%',
    background: 'rgba(30, 30, 50, 0.97)',
    borderLeft: '2px solid #2a2a4a',
    overflowY: 'auto',
    padding: '20px 16px'
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn 0.25s ease-out'
  },
  popup: {
    width: '100%',
    maxWidth: '380px',
    background: 'linear-gradient(145deg, rgba(10, 30, 60, 0.97), rgba(10, 20, 50, 0.97))',
    backdropFilter: 'blur(16px)',
    border: '2px solid rgba(0, 204, 255, 0.4)',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 100, 200, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    animation: 'popupIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '18px 20px',
    gap: '12px'
  },
  popupTitle: {
    flex: 1,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff'
  },
  popupClose: {
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#aaaacc',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  popupDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 204, 255, 0.3), transparent)',
    margin: '0 20px'
  },
  popupBody: {
    padding: '20px'
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.6px'
  },
  detailValue: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: 'system-ui'
  },
  detailValueMono: {
    fontSize: '12px',
    color: '#ccccdd',
    fontFamily: 'monospace',
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  detailValueBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '6px'
  },
  detailColorDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor'
  },
  detailText: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '500'
  },
  popupFooter: {
    padding: '16px 20px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  popupButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #00CCFF, #0088FF)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  }
};

const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popupIn {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00CCFF, #0088FF);
  cursor: pointer;
  border: 2px solid #0a0a1a;
  box-shadow: 0 0 12px rgba(0, 204, 255, 0.6);
  transition: transform 0.15s;
}
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00CCFF, #0088FF);
  cursor: pointer;
  border: 2px solid #0a0a1a;
  box-shadow: 0 0 12px rgba(0, 204, 255, 0.6);
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 204, 255, 0.4);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 204, 255, 0.6);
}
button:hover {
  filter: brightness(1.15);
}
button:active {
  transform: scale(0.97);
}
label:hover {
  background: rgba(0, 204, 255, 0.08) !important;
}
select:focus {
  border-color: #00CCFF !important;
  box-shadow: 0 0 0 3px rgba(0, 204, 255, 0.15) !important;
}
.mineral-popup {
  animation: popupIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = keyframes;
  document.head.appendChild(styleEl);
}
