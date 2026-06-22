import React, { useState, useEffect } from 'react';
import { useLedgerStore } from './store';
import GoodsList from './components/GoodsList';
import TransactionPanel from './components/TransactionPanel';
import TransactionHistory from './components/TransactionHistory';
import DailyReport from './components/DailyReport';

type TabType = 'ledger' | 'history' | 'report';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const { fetchGoods, fetchTransactions } = useLedgerStore();

  useEffect(() => {
    fetchGoods();
    fetchTransactions();
  }, [fetchGoods, fetchTransactions]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, fetchTransactions]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>西市胡商账簿</h1>
        <div className="header-tabs">
          <button
            className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            记账
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            交易历史
          </button>
          <button
            className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            日账报表
          </button>
        </div>
      </header>

      <div className="main-content">
        {activeTab === 'ledger' && (
          <>
            <GoodsList />
            <TransactionPanel />
          </>
        )}
        {activeTab === 'history' && <TransactionHistory />}
        {activeTab === 'report' && <DailyReport />}
      </div>
    </div>
  );
};

export default App;
