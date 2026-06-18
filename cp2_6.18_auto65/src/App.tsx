import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { KeyGenerator } from './components/KeyGenerator';
import { KeyList } from './components/KeyList';
import { UsageChart } from './components/UsageChart';

function App() {
  const [activeTab, setActiveTab] = useState<'keys' | 'stats'>('keys');

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'keys' ? (
        <div className="page-layout">
          <div className="form-section">
            <KeyGenerator />
          </div>
          <div className="list-section">
            <KeyList />
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">用量统计</h2>
          <UsageChart />
        </div>
      )}
    </div>
  );
}

export default App;
