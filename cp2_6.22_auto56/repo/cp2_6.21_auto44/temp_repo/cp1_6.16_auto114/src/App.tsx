import React from 'react';
import PlotGrid from './components/PlotGrid';
import StatusPanel from './components/StatusPanel';
import ClaimList from './components/ClaimList';
import NotificationBar from './components/NotificationBar';
import ExchangeModal from './components/ExchangeModal';
import { useGardenStore } from './store/gardenStore';
import { Sprout } from 'lucide-react';

/**
 * 应用根组件
 *
 * 数据流向：
 *  1. App 作为顶层容器从 zustand store (gardenStore) 中订阅：
 *     - 当前用户信息 (currentUserName/currentUserAvatar) 用于顶部栏展示
 *     - 通知与交换模态框状态由子组件各自订阅
 *  2. 顶部栏 → App → 三栏布局：
 *     左侧 ClaimList（认领列表）
 *     中央 PlotGrid（6×6 地块网格）← 接收用户点击事件，调用 store 的 claimPlot / selectPlot / openExchangeModal
 *     右侧 StatusPanel（状态面板 + Canvas 图表）← 响应 selectedPlotId 变化重绘
 *  3. 全局 UI：
 *     - NotificationBar：屏幕顶部滑入式通知横幅，订阅 notifications 列表
 *     - ExchangeModal：居中模态框，订阅 exchangeTargetId 控制显隐
 */
const App: React.FC = () => {
  const userName = useGardenStore(s => s.currentUserName);
  const userAvatar = useGardenStore(s => s.currentUserAvatar);

  return (
    <div className="app-layout">
      <NotificationBar />
      <ExchangeModal />

      <header className="app-header">
        <h1>
          <Sprout size={22} color="#2E7D32" />
          社区共享菜园
          <span className="app-header__subtitle">· 实时生长可视化平台</span>
        </h1>
        <div className="app-header__user">
          <span className="app-header__user-avatar">{userAvatar}</span>
          <span>欢迎，{userName}</span>
        </div>
      </header>

      <main className="app-main">
        <section className="mobile-panels">
          <ClaimList />
        </section>

        <section style={{ overflowY: 'auto' }}>
          <PlotGrid />
        </section>

        <section className="mobile-panels">
          <StatusPanel />
        </section>
      </main>
    </div>
  );
};

export default App;
