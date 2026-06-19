import { useState, useEffect } from 'react';
import PlantCard from '../components/PlantCard';
import { usePlantStore } from '../store/plantStore';
import type { Plant } from '../types';
import './ExchangePage.css';

function ExchangePage() {
  const plants = usePlantStore(s => s.plants);
  const requestExchange = usePlantStore(s => s.requestExchange);
  const confirmExchange = usePlantStore(s => s.confirmExchange);
  const exchangeRequests = usePlantStore(s => s.exchangeRequests);
  const fetchExchanges = usePlantStore(s => s.fetchExchanges);
  const currentUserId = usePlantStore(s => s.currentUserId);

  const [selectedTarget, setSelectedTarget] = useState<Plant | null>(null);
  const [selectedMyPlant, setSelectedMyPlant] = useState<Plant | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [petalsActive, setPetalsActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExchanges();
  }, []);

  const myPlants = plants.filter(p => p.userId === currentUserId && p.status === 'available');
  const availablePlants = plants.filter(p => p.userId !== currentUserId && p.status === 'available');
  const pendingRequests = exchangeRequests.filter(
    r => r.status === 'pending' && r.toUserId === currentUserId
  );

  const handleRequestExchange = (targetPlant: Plant) => {
    if (myPlants.length === 0) {
      alert('您没有可交换的植物，请先在"我的花园"添加植物');
      return;
    }
    setSelectedTarget(targetPlant);
    setSelectedMyPlant(myPlants[0]);
    setShowConfirm(true);
  };

  const handleConfirmExchange = async () => {
    if (!selectedTarget || !selectedMyPlant) return;
    setSubmitting(true);
    try {
      const result = await requestExchange(selectedMyPlant.id, selectedTarget.id);
      setShowConfirm(false);
      if (result?.matched) {
        setPetalsActive(true);
        setTimeout(() => setPetalsActive(false), 3000);
      } else {
        alert('申请已发送，等待对方确认');
      }
      setSelectedTarget(null);
      setSelectedMyPlant(null);
    } catch (err) {
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setSubmitting(true);
    try {
      const result = await confirmExchange(requestId);
      if (result) {
        setPetalsActive(true);
        setTimeout(() => setPetalsActive(false), 3000);
      }
    } catch (err) {
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="exchange-page page-container">
      <div className="page-header">
        <h1>待换花园</h1>
      </div>

      {pendingRequests.length > 0 && (
        <div className="pending-section">
          <h3>待我确认的请求</h3>
          <div className="pending-list">
            {pendingRequests.map(req => (
              <div key={req.id} className="pending-card">
                <div className="pending-info">
                  <span className="pending-text">
                    {req.fromOwnerName} 想用 <b>{req.fromPlantName}</b> 交换您的 <b>{req.toPlantName}</b>
                  </span>
                </div>
                <button onClick={() => handleAcceptRequest(req.id)} disabled={submitting}>
                  确认交换
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="exchange-layout">
        <div className="exchange-column">
          <h2 className="column-title">我的待换植物</h2>
          {myPlants.length === 0 ? (
            <p className="empty-column">暂无待换植物</p>
          ) : (
            <div className="plants-list">
              {myPlants.map(plant => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          )}
        </div>

        <div className="exchange-column">
          <h2 className="column-title">邻居的植物</h2>
          {availablePlants.length === 0 ? (
            <p className="empty-column">暂无可申请的植物</p>
          ) : (
            <div className="plants-list">
              {availablePlants.map(plant => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  showExchangeButton={true}
                  onRequestExchange={handleRequestExchange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showConfirm && selectedTarget && selectedMyPlant && (
        <div className="modal-overlay exchange-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="exchange-modal" onClick={e => e.stopPropagation()}>
            <h3>确认交换</h3>
            <div className="exchange-parties">
              <div className="exchange-plant-preview">
                {selectedMyPlant.image ? (
                  <img src={selectedMyPlant.image} alt={selectedMyPlant.name} />
                ) : (
                  <div className="preview-placeholder">🌿</div>
                )}
                <p>{selectedMyPlant.name}</p>
                <span className="exchange-label">我的</span>
              </div>

              <span className="exchange-arrow">⇄</span>

              <div className="exchange-plant-preview">
                {selectedTarget.image ? (
                  <img src={selectedTarget.image} alt={selectedTarget.name} />
                ) : (
                  <div className="preview-placeholder">🌿</div>
                )}
                <p>{selectedTarget.name}</p>
                <span className="exchange-label">对方的</span>
              </div>
            </div>

            {myPlants.length > 1 && (
              <div className="select-my-plant">
                <label>选择用哪株交换：</label>
                <select
                  value={selectedMyPlant.id}
                  onChange={e => {
                    const p = myPlants.find(pl => pl.id === e.target.value);
                    if (p) setSelectedMyPlant(p);
                  }}
                >
                  {myPlants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button onClick={handleConfirmExchange} disabled={submitting}>
                {submitting ? '提交中...' : '确认交换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {petalsActive && (
        <div className="petals-container">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="petal"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2.5 + Math.random() * 1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExchangePage;
