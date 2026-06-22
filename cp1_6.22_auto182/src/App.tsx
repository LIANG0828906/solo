import React, { useState, useEffect, useCallback } from 'react';
import MoleculeScene from './MoleculeScene';
import InfoPanel from './InfoPanel';
import {
  fetchMoleculeList,
  fetchMolecule,
  MoleculeData,
  MoleculeInfo,
  AtomData,
} from './DataLoader';

const App: React.FC = () => {
  const [moleculeList, setMoleculeList] = useState<MoleculeInfo[]>([]);
  const [currentMolecule, setCurrentMolecule] = useState<MoleculeData | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<AtomData | null>(null);
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMolecules = async () => {
      try {
        const list = await fetchMoleculeList();
        setMoleculeList(list);
        if (list.length > 0) {
          setSelectedMoleculeId(list[0].id);
        }
      } catch (error) {
        console.error('加载分子列表失败:', error);
      }
    };
    loadMolecules();
  }, []);

  useEffect(() => {
    if (!selectedMoleculeId) return;

    const loadMolecule = async () => {
      setLoading(true);
      try {
        const data = await fetchMolecule(selectedMoleculeId);
        setCurrentMolecule(data);
        setSelectedAtom(null);
      } catch (error) {
        console.error('加载分子数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMolecule();
  }, [selectedMoleculeId]);

  const handleAtomClick = useCallback((atom: AtomData) => {
    setSelectedAtom(atom);
  }, []);

  const handleCloseInfoPanel = useCallback(() => {
    setSelectedAtom(null);
  }, []);

  const handleResetView = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  const handleMoleculeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMoleculeId(e.target.value);
  };

  const currentMoleculeInfo = moleculeList.find((m) => m.id === selectedMoleculeId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'rgba(11, 12, 16, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1
            style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            <span style={{ color: '#6366F1' }}>⚛</span> 分子结构可视化
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentMoleculeInfo && (
            <div
              style={{
                color: '#aaa',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#6366F1', fontWeight: 600 }}>
                {currentMoleculeInfo.formula}
              </span>
              {' · '}
              {currentMoleculeInfo.name}
              {' · '}
              {currentMoleculeInfo.atomCount} 个原子
            </div>
          )}

          <select
            value={selectedMoleculeId}
            onChange={handleMoleculeChange}
            style={{
              backgroundColor: '#1F2937',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1F2937';
            }}
          >
            {moleculeList.map((mol) => (
              <option key={mol.id} value={mol.id}>
                {mol.name} ({mol.formula})
              </option>
            ))}
          </select>

          <button
            onClick={handleResetView}
            style={{
              backgroundColor: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF6';
            }}
          >
            重置视角
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: '100%' }}>
        {currentMolecule && !loading && (
          <MoleculeScene
            atoms={currentMolecule.atoms}
            bonds={currentMolecule.bonds}
            onAtomClick={handleAtomClick}
            resetTrigger={resetTrigger}
          />
        )}
        {loading && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #0B0C10 0%, #1F2833 100%)',
              color: 'white',
              fontSize: '18px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid #333',
                  borderTopColor: '#6366F1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              <div>加载中...</div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>

      <InfoPanel atom={selectedAtom} onClose={handleCloseInfoPanel} />
    </div>
  );
};

export default App;
