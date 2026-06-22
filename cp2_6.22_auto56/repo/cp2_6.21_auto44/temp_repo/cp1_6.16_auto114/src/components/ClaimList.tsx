import React from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { useGardenStore } from '../store/gardenStore';
import './ClaimList.css';

export const ClaimList: React.FC = () => {
  const plots = useGardenStore(s => s.plots);
  const selectedPlotId = useGardenStore(s => s.selectedPlotId);
  const selectPlot = useGardenStore(s => s.selectPlot);
  const claimedPlots = React.useMemo(() => plots.filter(p => p.status !== 'idle'), [plots]);
  const exchangeable = React.useMemo(() => plots.filter(p => p.exchangeable), [plots]);

  return (
    <aside className="claim-list">
      <div className="claim-list__header">
        <h3>👥 认领概览</h3>
      </div>

      <div className="claim-list__section">
        <h4 className="cl-title"><Users size={14} /> 已认领 ({claimedPlots.length})</h4>
        {claimedPlots.length === 0 ? (
          <p className="cl-empty">暂无认领，点击地块网格中的空闲地块认领吧！</p>
        ) : (
          <ul className="cl-list">
            {claimedPlots.map(p => (
              <li
                key={p.id}
                className={['cl-item', selectedPlotId === p.id ? 'cl-item--active' : ''].join(' ')}
                onClick={() => selectPlot(p.id)}
              >
                <span className="cl-avatar">{p.ownerAvatar}</span>
                <div className="cl-info">
                  <b>{p.ownerName}</b>
                  <span>
                    {p.cropName || '未设作物'} · ({p.row + 1},{p.col + 1})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="claim-list__section">
        <h4 className="cl-title cl-title--warn"><RefreshCw size={14} /> 可交换 ({exchangeable.length})</h4>
        {exchangeable.length === 0 ? (
          <p className="cl-empty">目前无可交换的待收获地块</p>
        ) : (
          <ul className="cl-list">
            {exchangeable.map(p => (
              <li
                key={p.id}
                className={['cl-item', 'cl-item--exchange', selectedPlotId === p.id ? 'cl-item--active' : ''].join(' ')}
                onClick={() => selectPlot(p.id)}
              >
                <span className="cl-avatar">{p.ownerAvatar}</span>
                <div className="cl-info">
                  <b>{p.cropName || '作物'}</b>
                  <span>{p.ownerName} · ({p.row + 1},{p.col + 1})</span>
                </div>
                <span className="cl-tag">可交换</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="claim-list__section claim-tips">
        <h4 className="cl-title">💡 操作提示</h4>
        <ol>
          <li>点击 <b>浅色地块</b> 立即认领，系统分配随机用户。</li>
          <li>选中已认领地块，可在右侧面板添加种植日志。</li>
          <li>作物成熟后可标记"待收获"，再标记"可交换"即上架。</li>
          <li>选中自己的地块后，点击别人的"可交换"地块发起互换。</li>
        </ol>
      </div>
    </aside>
  );
};

export default ClaimList;
