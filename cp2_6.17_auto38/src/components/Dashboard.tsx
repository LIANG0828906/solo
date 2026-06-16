import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePropertyStore } from '@/store/propertyStore';
import ChartPanel from './ChartPanel';
import CalendarView from './CalendarView';

export default function Dashboard() {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const navigate = useNavigate();

  const properties = usePropertyStore((s) => s.properties);
  const bookings = usePropertyStore((s) => s.bookings);
  const selectedPropertyId = usePropertyStore((s) => s.selectedPropertyId);
  const searchQuery = usePropertyStore((s) => s.searchQuery);
  const sortByRevenue = usePropertyStore((s) => s.sortByRevenue);
  const initialized = usePropertyStore((s) => s.initialized);
  const initData = usePropertyStore((s) => s.initData);
  const filterByProperty = usePropertyStore((s) => s.filterByProperty);
  const setSearchQuery = usePropertyStore((s) => s.setSearchQuery);
  const toggleSortByRevenue = usePropertyStore((s) => s.toggleSortByRevenue);
  const getFilteredProperties = usePropertyStore((s) => s.getFilteredProperties);
  const getDashboardStats = usePropertyStore((s) => s.getDashboardStats);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initData();
    }
  }, [initialized, initData]);

  useEffect(() => {
    if (propertyId) {
      filterByProperty(propertyId);
    } else {
      filterByProperty(null);
    }
  }, [propertyId, filterByProperty]);

  const stats = getDashboardStats();
  const filteredProps = getFilteredProperties();

  const getPropertyStatusColor = (pid: string): string => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let bookedCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const bs = bookings.filter((b) => b.propertyId === pid && b.date === ds && (b.status === 'booked' || b.status === 'pending'));
      if (bs.length > 0) bookedCount++;
    }
    return bookedCount === daysInMonth ? '#E74C3C' : '#2ECC71';
  };

  const handlePropertyClick = (pid: string) => {
    if (selectedPropertyId === pid) {
      navigate('/dashboard');
    } else {
      navigate(`/detail/${pid}`);
    }
    setMobileMenuOpen(false);
  };

  const handleAllProperties = () => {
    navigate('/dashboard');
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="搜索房源名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="sidebar-actions">
        <button
          className={`btn-sort ${sortByRevenue ? 'active' : ''}`}
          onClick={toggleSortByRevenue}
        >
          {sortByRevenue ? '按收入↓' : '按收入排序'}
        </button>
      </div>
      <button className="sidebar-all-btn" onClick={handleAllProperties}>
        全部房源概览
      </button>
      <div className="property-list">
        {filteredProps.map((p) => (
          <div
            key={p.id}
            className={`property-card ${selectedPropertyId === p.id ? 'selected' : ''}`}
            onClick={() => handlePropertyClick(p.id)}
          >
            <span
              className="property-status-dot"
              style={{ backgroundColor: getPropertyStatusColor(p.id) }}
            />
            <span className="property-name">{p.name}</span>
            <span className="property-price">¥{p.pricePerNight}</span>
          </div>
        ))}
        {filteredProps.length === 0 && (
          <div style={{ padding: 20, fontSize: 12, color: '#7F8C8D', textAlign: 'center' }}>
            未找到匹配房源
          </div>
        )}
      </div>
    </>
  );

  const selectedPropName = selectedPropertyId
    ? properties.find((p) => p.id === selectedPropertyId)?.name
    : '全部房源';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">房源管理</div>
          <div className="sidebar-subtitle">共 {properties.length} 套房源</div>
        </div>
        <SidebarContent />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
          <span className="mobile-title">民宿房东仪表盘</span>
          <span style={{ width: 32 }} />
        </div>
        {mobileMenuOpen && (
          <div className="mobile-dropdown">
            <SidebarContent />
          </div>
        )}

        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">运营仪表盘 · {selectedPropName}</h1>
            <p className="page-desc">实时监控房源运营状态、房态日历与收益数据</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">🏠</div>
              <div className="stat-label">总房源数</div>
              <div className="stat-value">
                {stats.totalProperties}
                <span className="stat-unit">套</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">💰</div>
              <div className="stat-label">本月总收入</div>
              <div className="stat-value">
                ¥{stats.monthlyRevenue.toLocaleString()}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">📊</div>
              <div className="stat-label">本月平均入住率</div>
              <div className="stat-value">
                {stats.averageOccupancy}
                <span className="stat-unit">%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">⏳</div>
              <div className="stat-label">待处理预订</div>
              <div className="stat-value">
                {stats.pendingBookings}
                <span className="stat-unit">单</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <ChartPanel />
          </div>

          <div className="panel">
            <h2 className="panel-title">房态日历</h2>
            <CalendarView />
          </div>
        </main>
      </div>
    </div>
  );
}
