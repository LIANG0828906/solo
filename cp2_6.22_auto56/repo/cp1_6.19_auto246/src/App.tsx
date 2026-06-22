import React, { useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useTourStore } from './store/tourStore';
import TourCalendar from './components/TourCalendar';
import EquipmentRental from './components/EquipmentRental';
import RevenueSummary from './components/RevenueSummary';

const App: React.FC = () => {
  const {
    tourEvents,
    equipmentOrders,
    selectedTourId,
    selectedDate,
    conflictError,
    clearConflict,
    fetchTours,
    fetchEquipment,
    deleteTour,
    setSelectedTourId,
    getMonthlyStats,
    getEquipmentForTour,
  } = useTourStore();

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  useEffect(() => {
    if (selectedTourId) {
      fetchEquipment(selectedTourId);
    }
  }, [selectedTourId, fetchEquipment]);

  const selectedTour = tourEvents.find(t => t.id === selectedTourId);
  const stats = getMonthlyStats(selectedDate);

  const handleDeleteTour = useCallback(async () => {
    if (!selectedTourId) return;
    await deleteTour(selectedTourId);
  }, [selectedTourId, deleteTour]);

  return (
    <div>
      <header className="app-header">
        <h1>🎸 巡演日程管理与设备租赁结算</h1>
        <span className="header-info">{format(selectedDate, 'yyyy年MM月')}</span>
      </header>

      <div className="main-content">
        <div className="layout-container">
          <div>
            <TourCalendar />
            <div className="monthly-report">
              <div className="report-card income">
                <span className="report-label">售票总收入</span>
                <span className="report-value">¥{stats.totalIncome.toLocaleString()}</span>
              </div>
              <div className="report-card expense">
                <span className="report-label">设备总支出</span>
                <span className="report-value">¥{stats.totalExpense.toLocaleString()}</span>
              </div>
              <div className="report-card net">
                <span className="report-label">净收入总额</span>
                <span className="report-value">¥{stats.netIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            {selectedTour ? (
              <div className="detail-panel">
                <h2 style={{ color: selectedTour.color }}>
                  {selectedTour.bandName}
                </h2>
                <RevenueSummary tourEventId={selectedTour.id} />
                <div className="detail-row">
                  <span className="label">日期</span>
                  <span>{selectedTour.date}</span>
                </div>
                <div className="detail-row">
                  <span className="label">城市</span>
                  <span>{selectedTour.city}</span>
                </div>
                <div className="detail-row">
                  <span className="label">场地</span>
                  <span>{selectedTour.venue}</span>
                </div>
                <div className="detail-row">
                  <span className="label">预计售票</span>
                  <span>{selectedTour.expectedTickets} 张</span>
                </div>
                <div className="detail-row">
                  <span className="label">票价</span>
                  <span>¥{selectedTour.ticketPrice}</span>
                </div>
                <EquipmentRental tourEventId={selectedTour.id} />
                <button className="delete-tour-btn" onClick={handleDeleteTour}>
                  删除此巡演事件
                </button>
              </div>
            ) : (
              <div className="empty-detail">
                点击日历上的巡演卡片查看详情
              </div>
            )}
          </div>
        </div>
      </div>

      {conflictError && (
        <div className="modal-overlay" onClick={clearConflict}>
          <div className="modal conflict-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠ 冲突警告</h3>
            <p>{conflictError.message}</p>
            <button onClick={clearConflict}>确定</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
