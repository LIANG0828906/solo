import { useState, useMemo } from 'react';
import ContractList from './components/ContractList';
import SongAllocation from './components/SongAllocation';
import RevenueReport from './components/RevenueReport';
import { Contract, Song } from './types';

type Page = 'contracts' | 'allocation' | 'report';

function generateMockSongs(prefix: string, count: number): Song[] {
  const songNames = [
    '夜空中最亮的星', '追梦人', '海阔天空', '晴天', '稻香',
    '青花瓷', '光年之外', '平凡之路', '消愁', '像我这样的人',
    '成都', '南山南', '安和桥', '斑马斑马', '董小姐'
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-song-${i}`,
    name: songNames[i % songNames.length] + (i >= songNames.length ? ` ${Math.floor(i / songNames.length) + 1}` : ''),
    playCount: Math.floor(Math.random() * 50000) + 1000,
    duration: Math.floor(Math.random() * 180) + 120,
  }));
}

function generateMockContracts(): Contract[] {
  const venues = [
    '北京MAO Livehouse', '上海育音堂', '广州Tu凸空间', '深圳B10现场',
    '成都小酒馆', '杭州MAO Livehouse', '武汉VOX Livehouse', '南京欧拉艺术空间',
    '重庆坚果Livehouse', '西安光圈Club', '长沙46Livehouse', '苏州山丘咖啡',
    '厦门Real Live', '青岛Downtown', '天津派现场', '昆明Modernsky Lab'
  ];
  const contracts: Contract[] = [];
  for (let i = 0; i < 12; i++) {
    const year = 2024;
    const month = String(Math.floor(i / 3) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const songCount = Math.floor(Math.random() * 6) + 5;
    contracts.push({
      id: `contract-${i + 1}`,
      date: `${year}-${month}-${day}`,
      venue: venues[i % venues.length],
      fee: Math.floor(Math.random() * 30000) + 8000,
      splitRatio: Math.floor(Math.random() * 30) + 60,
      status: i % 3 === 0 ? 'pending' : 'settled',
      songs: generateMockSongs(`contract-${i + 1}`, songCount),
    });
  }
  return contracts;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('contracts');
  const [contracts, setContracts] = useState<Contract[]>(() => generateMockContracts());
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [playCountWeight, setPlayCountWeight] = useState(0.5);

  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === selectedContractId) || null;
  }, [contracts, selectedContractId]);

  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setCurrentPage('allocation');
  };

  const handleToggleStatus = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: c.status === 'settled' ? 'pending' : 'settled' }
          : c
      )
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 1024,
      }}
    >
      <nav
        style={{
          height: 60,
          backgroundColor: '#0D0D1A',
          borderBottom: '1px solid #1E1E2E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: '#6C63FF', marginRight: 60 }}>
          Tour版税分账工具
        </div>
        <div style={{ display: 'flex', gap: 20, height: '100%', alignItems: 'center' }}>
          {([
            { key: 'contracts', label: '合同列表' },
            { key: 'allocation', label: '曲目分配', disabled: !selectedContract },
            { key: 'report', label: '报表中心' },
          ] as { key: Page; label: string; disabled?: boolean }[]).map((item) => (
            <div
              key={item.key}
              onClick={() => {
                if (!item.disabled) {
                  setCurrentPage(item.key);
                }
              }}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                color: item.disabled ? '#505068' : currentPage === item.key ? '#FFFFFF' : '#B0B0C0',
                borderBottom: currentPage === item.key ? '2px solid #6C63FF' : '2px solid transparent',
                transition: 'color 0.2s ease',
                fontSize: 14,
                fontWeight: currentPage === item.key ? 500 : 400,
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '32px 40px' }}>
        {currentPage === 'contracts' && (
          <ContractList
            contracts={contracts}
            onSelectContract={handleSelectContract}
            onToggleStatus={handleToggleStatus}
          />
        )}
        {currentPage === 'allocation' && selectedContract && (
          <SongAllocation
            contract={selectedContract}
            playCountWeight={playCountWeight}
            durationWeight={1 - playCountWeight}
            onWeightChange={setPlayCountWeight}
          />
        )}
        {currentPage === 'allocation' && !selectedContract && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              color: '#606078',
              fontSize: 18,
            }}
          >
            请先从合同列表中选择一个合同查看曲目分配
          </div>
        )}
        {currentPage === 'report' && (
          <RevenueReport
            contracts={contracts}
            playCountWeight={playCountWeight}
            durationWeight={1 - playCountWeight}
          />
        )}
      </main>
    </div>
  );
}

export default App;
