import React, { useState, useEffect } from 'react';
import { useTavernStore } from '../store';
import { TransactionRecord } from '../types';

const LedgerView: React.FC = () => {
  const { records, fetchRecords, newRecordId, clearNewRecord } = useTavernStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (newRecordId) {
      const timer = setTimeout(() => {
        clearNewRecord();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [newRecordId]);

  const handleFilter = () => {
    fetchRecords(startDate || undefined, endDate || undefined);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchRecords();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const totalIncome = records.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const drinkCount = records.filter(r => r.type === 'drink').length;
  const gambleCount = records.filter(r => r.type === 'gamble').length;
  const gambleIncome = records.filter(r => r.type === 'gamble').reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <div>
      <div className="column-title">账册流水</div>

      <div className="filter-section">
        <div>
          <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '4px' }}>起</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '4px' }}>止</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleFilter}>筛选</button>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleReset}>重置</button>
        </div>
      </div>

      <div className="ledger-container">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>客人</th>
              <th>类型</th>
              <th>明细</th>
              <th>金额</th>
              <th>成本</th>
              <th>利润</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无交易记录
                </td>
              </tr>
            ) : (
              records.map((r: TransactionRecord) => (
                <tr
                  key={r.id}
                  className={`${r.type === 'gamble' ? 'gamble-row' : ''} ${r.id === newRecordId ? 'new-record' : ''}`}
                >
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{r.date}</div>
                    <div>{formatTime(r.timestamp)}</div>
                  </td>
                  <td>{r.customerName}</td>
                  <td>
                    {r.type === 'drink' ? (
                      <span style={{ color: '#722f37', fontWeight: 500 }}>🍶 酒饮</span>
                    ) : (
                      <span style={{ color: '#e65100', fontWeight: 500 }}>🎲 博戏</span>
                    )}
                  </td>
                  <td>
                    {r.type === 'drink' ? (
                      <div>
                        <div>{r.drinkName} × {r.quantity}{r.unit}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          {r.vesselName} · {r.shichenName}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#e65100' }}>
                        马球赛{
                          r.totalPrice > 0 ? '客胜' : '庄胜'
                        }
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.totalPrice}文</td>
                  <td style={{ color: '#999' }}>{r.cost > 0 ? r.cost + '文' : '-'}</td>
                  <td>
                    <span className="profit-positive">+{r.profit}文</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="summary-section">
        <div style={{ fontWeight: 600, color: '#722f37', marginBottom: '8px' }}>📊 统计汇总</div>
        <div className="summary-row">
          <span>交易笔数</span>
          <span>{records.length}笔 (酒饮{drinkCount} / 博戏{gambleCount})</span>
        </div>
        <div className="summary-row">
          <span>总收入</span>
          <span>{totalIncome}文</span>
        </div>
        <div className="summary-row">
          <span>博戏收入</span>
          <span style={{ color: '#e65100' }}>{gambleIncome}文</span>
        </div>
        <div className="summary-row">
          <span>总成本</span>
          <span>{totalCost}文</span>
        </div>
        <div className="summary-row summary-total">
          <span>净利润</span>
          <span className="profit-positive">+{totalProfit}文</span>
        </div>
      </div>
    </div>
  );
};

export default LedgerView;
