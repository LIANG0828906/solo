import { useConfigStore } from '../store/useConfigStore';

function Configurator() {
  const {
    selectedProductId,
    selectedLeatherId,
    selectedThreadId,
    selectedHardwareId,
    engraving,
    transitionKey,
    setSelectedProductId,
    setSelectedLeatherId,
    setSelectedThreadId,
    setSelectedHardwareId,
    setEngraving,
    resetConfig,
  } = useConfigStore();

  return (
    <div className="configurator-layout">
      <div className="config-panel">
        <div className="config-panel-content">
          <div className="card">
            <h2 className="section-title">皮具配置器</h2>
            <p style={{ fontSize: '13px', color: 'var(--primary)', opacity: 0.7, marginBottom: '16px' }}>
              选择您喜欢的款式、皮料、缝线和五金配件，打造专属于您的皮具。
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">当前状态</label>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div>产品ID: {selectedProductId || '未选择'}</div>
                <div>皮料ID: {selectedLeatherId || '未选择'}</div>
                <div>缝线ID: {selectedThreadId || '未选择'}</div>
                <div>五金ID: {selectedHardwareId || '未选择'}</div>
                <div>刻字: {engraving || '无'}</div>
                <div>动画Key: {transitionKey}</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">测试产品选择</label>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedProductId('wallet-001')}
              >
                选择经典短款钱包 (触发3D过渡)
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">测试皮料选择</label>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedLeatherId('cow-001')}
              >
                选择头层牛皮-深棕
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">测试缝线选择</label>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedThreadId('t-001')}
              >
                选择深棕缝线
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">测试五金选择</label>
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedHardwareId('h-001')}
              >
                选择黄铜拉链
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">测试刻字输入</label>
              <input
                type="text"
                className="text-input"
                placeholder="请输入刻字内容"
                value={engraving}
                onChange={(e) => setEngraving(e.target.value)}
              />
            </div>

            <button
              className="btn btn-outline btn-block"
              onClick={resetConfig}
              style={{ marginTop: '16px' }}
            >
              重置配置
            </button>
          </div>
        </div>
      </div>

      <div className="preview-panel">
        <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👜</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px' }}>3D预览区域</h3>
            <p style={{ fontSize: '13px', opacity: 0.6 }}>
              这里将放置3D皮具预览组件
            </p>
            <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '12px' }}>
              transitionKey: {transitionKey}
            </p>
          </div>
        </div>
      </div>

      <div className="summary-panel">
        <div className="price-card">
          <div className="price-label">预估总价</div>
          <div className="price-value">
            <span className="currency">¥</span>
            0.00
          </div>
        </div>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 className="section-title">配置摘要</h2>
          <div style={{ fontSize: '13px', lineHeight: '2' }}>
            请在左侧选择配置选项...
          </div>
          <button
            className="btn btn-primary btn-lg btn-block add-to-cart-btn"
            style={{ marginTop: 'auto' }}
          >
            加入购物车
          </button>
        </div>
      </div>
    </div>
  );
}

export default Configurator;
