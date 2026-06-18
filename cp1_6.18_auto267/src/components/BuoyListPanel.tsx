import { useOceanStore } from '../shared/store';

export function BuoyListPanel() {
  const {
    buoys,
    selectedBuoyId,
    selectBuoy,
    panelCollapsed,
    setPanelCollapsed
  } = useOceanStore();

  return (
    <div className={`glass-panel buoy-list-panel ${panelCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <span className="panel-title">浮标列表 ({buoys.length}/5)</span>
        <button
          className="toggle-btn"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          title={panelCollapsed ? '展开' : '收起'}
        >
          {panelCollapsed ? '→' : '←'}
        </button>
      </div>

      {!panelCollapsed && (
        <>
          {buoys.length === 0 ? (
            <div className="empty-hint">
              右键点击海面放置浮标
              <br />
              双击浮标可移除
            </div>
          ) : (
            buoys.map((buoy) => (
              <div
                key={buoy.id}
                className={`buoy-item ${selectedBuoyId === buoy.id ? 'selected' : ''}`}
                onClick={() => selectBuoy(buoy.id)}
              >
                <div className="buoy-info">
                  <div className="buoy-dot" />
                  <span className="buoy-name">{buoy.name}</span>
                </div>
                <span className="buoy-temp">{buoy.currentTemp.toFixed(1)}°C</span>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
