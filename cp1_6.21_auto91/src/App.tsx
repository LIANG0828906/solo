import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Scene3D from './Scene3D';
import { parsePDB, centerMolecule } from './parser';
import { calculateScore, localEnergyMinimization, normalizeScoreForRadar } from './scorer';
import { Molecule, LigandPosition, ScoreResult, Snapshot } from './types';
import { SAMPLE_PROTEIN_PDB, SAMPLE_LIGAND_PDB } from './sampleData';

const MAX_SNAPSHOTS = 20;

const App: React.FC = () => {
  const [proteinPdbText, setProteinPdbText] = useState('');
  const [ligandPdbText, setLigandPdbText] = useState('');
  const [protein, setProtein] = useState<Molecule | null>(null);
  const [ligand, setLigand] = useState<Molecule | null>(null);
  const [ligandPosition, setLigandPosition] = useState<LigandPosition>({
    x: 10,
    y: 0,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  });
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [minimizationProgress, setMinimizationProgress] = useState(0);
  const [viewResetKey, setViewResetKey] = useState(0);
  const [snapshotKey, setSnapshotKey] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const scoreDebounceRef = useRef<number | null>(null);
  const pendingSnapshotRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 900);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const debouncedScoreCalculation = useCallback(
    (proteinMol: Molecule, ligandMol: Molecule, pos: LigandPosition) => {
      if (scoreDebounceRef.current) {
        window.clearTimeout(scoreDebounceRef.current);
      }
      scoreDebounceRef.current = window.setTimeout(() => {
        const newScore = calculateScore(proteinMol.atoms, ligandMol.atoms, pos);
        setScore(newScore);
      }, 50);
    },
    []
  );

  const handleLigandPositionChange = useCallback(
    (newPosition: LigandPosition) => {
      setLigandPosition(newPosition);
      if (protein && ligand) {
        debouncedScoreCalculation(protein, ligand, newPosition);
      }
    },
    [protein, ligand, debouncedScoreCalculation]
  );

  const handleLoad = useCallback(() => {
    if (!proteinPdbText.trim() || !ligandPdbText.trim()) {
      alert('请输入蛋白质和配体的PDB数据');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const parsedProtein = parsePDB(proteinPdbText, 'protein');
        const centeredProtein = centerMolecule(parsedProtein).molecule;

        const parsedLigand = parsePDB(ligandPdbText, 'ligand');
        const centeredLigand = centerMolecule(parsedLigand).molecule;

        setProtein(centeredProtein);
        setLigand(centeredLigand);

        const initialPos: LigandPosition = {
          x: 15,
          y: 0,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        };
        setLigandPosition(initialPos);

        const initialScore = calculateScore(
          centeredProtein.atoms,
          centeredLigand.atoms,
          initialPos
        );
        setScore(initialScore);

        setViewResetKey(prev => prev + 1);
      } catch (error) {
        console.error('解析PDB失败:', error);
        alert('PDB数据解析失败，请检查数据格式');
      } finally {
        setIsLoading(false);
      }
    }, 10);
  }, [proteinPdbText, ligandPdbText]);

  const handleLoadSample = useCallback(() => {
    setProteinPdbText(SAMPLE_PROTEIN_PDB);
    setLigandPdbText(SAMPLE_LIGAND_PDB);

    setTimeout(() => {
      const parsedProtein = parsePDB(SAMPLE_PROTEIN_PDB, 'protein');
      const centeredProtein = centerMolecule(parsedProtein).molecule;

      const parsedLigand = parsePDB(SAMPLE_LIGAND_PDB, 'ligand');
      const centeredLigand = centerMolecule(parsedLigand).molecule;

      setProtein(centeredProtein);
      setLigand(centeredLigand);

      const initialPos: LigandPosition = {
        x: 12,
        y: 5,
        z: 5,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      };
      setLigandPosition(initialPos);

      const initialScore = calculateScore(
        centeredProtein.atoms,
        centeredLigand.atoms,
        initialPos
      );
      setScore(initialScore);

      setViewResetKey(prev => prev + 1);
    }, 10);
  }, []);

  const handleResetView = useCallback(() => {
    setViewResetKey(prev => prev + 1);
  }, []);

  const handleMinimize = useCallback(() => {
    if (!protein || !ligand) return;

    setIsMinimizing(true);
    setMinimizationProgress(0);

    setTimeout(() => {
      const result = localEnergyMinimization(protein.atoms, ligand.atoms, ligandPosition, {
        stepSize: 0.1,
        maxIterations: 100,
        onProgress: (progress) => {
          setMinimizationProgress(progress);
        },
      });

      const startPos = { ...ligandPosition };
      const endPos = result;
      const duration = 500;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const currentPos: LigandPosition = {
          x: startPos.x + (endPos.x - startPos.x) * eased,
          y: startPos.y + (endPos.y - startPos.y) * eased,
          z: startPos.z + (endPos.z - startPos.z) * eased,
          rotationX: startPos.rotationX + (endPos.rotationX - startPos.rotationX) * eased,
          rotationY: startPos.rotationY + (endPos.rotationY - startPos.rotationY) * eased,
          rotationZ: startPos.rotationZ + (endPos.rotationZ - startPos.rotationZ) * eased,
        };

        setLigandPosition(currentPos);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          const newScore = calculateScore(protein.atoms, ligand.atoms, endPos);
          setScore(newScore);
          setIsMinimizing(false);
        }
      };

      requestAnimationFrame(animate);
    }, 10);
  }, [protein, ligand, ligandPosition]);

  const handleSnapshotCaptured = useCallback(
    (dataUrl: string) => {
      if (pendingSnapshotRef.current && !pendingSnapshotRef.current.thumbnail) {
        const snapshot = { ...pendingSnapshotRef.current, thumbnail: dataUrl };
        setSnapshots(prev => {
          const newSnapshots = [snapshot, ...prev];
          if (newSnapshots.length > MAX_SNAPSHOTS) {
            return newSnapshots.slice(0, MAX_SNAPSHOTS);
          }
          return newSnapshots;
        });
        pendingSnapshotRef.current = null;
      }
    },
    []
  );

  const handleSaveSnapshot = useCallback(() => {
    if (!score) return;

    const newSnapshot: Snapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      ligandPosition: { ...ligandPosition },
      score: { ...score },
    };

    pendingSnapshotRef.current = newSnapshot;
    setSnapshotKey(prev => prev + 1);
  }, [score, ligandPosition]);

  const handleRestoreSnapshot = useCallback(
    (snapshot: Snapshot) => {
      setLigandPosition(snapshot.ligandPosition);
      setScore(snapshot.score);
    },
    []
  );

  const handleClearSnapshots = useCallback(() => {
    setSnapshots([]);
  }, []);

  const handleExportReport = useCallback(() => {
    if (!protein || !ligand || !score) {
      alert('请先加载分子并进行对接');
      return;
    }

    const report = {
      exportTime: new Date().toISOString(),
      protein: {
        name: protein.name,
        atomCount: protein.atoms.length,
        bondCount: protein.bonds.length,
      },
      ligand: {
        name: ligand.name,
        atomCount: ligand.atoms.length,
        bondCount: ligand.bonds.length,
        position: ligandPosition,
      },
      score: score,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docking-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [protein, ligand, ligandPosition, score]);

  const scoreColor = useMemo(() => {
    if (!score) return '#388E3C';
    const energy = score.totalBindingEnergy;
    if (energy < -10) return '#388E3C';
    if (energy < 0) return '#FFA726';
    return '#D32F2F';
  }, [score]);

  const radarData = useMemo(() => {
    if (!score) return { vdw: 0.5, electrostatic: 0.5, solvation: 0.5 };
    return normalizeScoreForRadar(score);
  }, [score]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const RadarChart: React.FC<{ data: { vdw: number; electrostatic: number; solvation: number }; size?: number }> = ({
    data,
    size = 120,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const r = (radius * i) / 3;
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const angle = (Math.PI * 2 * j) / 3 - Math.PI / 2;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.strokeStyle = '#bbb';
      for (let j = 0; j < 3; j++) {
        const angle = (Math.PI * 2 * j) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.stroke();
      }

      const labels = ['范德华', '静电', '溶剂化'];
      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      for (let j = 0; j < 3; j++) {
        const angle = (Math.PI * 2 * j) / 3 - Math.PI / 2;
        const x = centerX + (radius + 8) * Math.cos(angle);
        const y = centerY + (radius + 8) * Math.sin(angle);
        ctx.fillText(labels[j], x, y + 4);
      }

      const values = [data.vdw, data.electrostatic, data.solvation];
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#2196F3');
      gradient.addColorStop(1, '#1565C0');

      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const angle = (Math.PI * 2 * j) / 3 - Math.PI / 2;
        const value = Math.max(0, Math.min(1, values[j]));
        const r = radius * value;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1565C0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }, [data, size]);

    return <canvas ref={canvasRef} width={size} height={size} />;
  };

  return (
    <div className="w-full h-full flex flex-col bg-scene-bg overflow-hidden">
      <div className="h-14 bg-menu-bg text-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="text-xl font-bold">分子对接3D模拟器</div>
        <div className="flex gap-3">
          <button
            onClick={handleResetView}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all btn-press text-sm"
          >
            重置视角
          </button>
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all btn-press text-sm"
          >
            示例数据
          </button>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all btn-press text-sm"
          >
            导出报告
          </button>
        </div>
      </div>

      <div
        className={`flex-1 flex overflow-hidden ${isSmallScreen ? 'flex-col' : 'flex-row'}`}
      >
        <div
          className={`relative bg-scene-bg ${isSmallScreen ? 'h-[500px] flex-shrink-0' : 'w-3/4'}`}
        >
          <Scene3D
            protein={protein}
            ligand={ligand}
            ligandPosition={ligandPosition}
            onLigandPositionChange={handleLigandPositionChange}
            conflictAtomPairs={score?.conflictAtomPairs}
            viewResetKey={viewResetKey}
            onSnapshot={handleSnapshotCaptured}
            snapshotKey={snapshotKey}
          />

          {(!protein || !ligand) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white/50 text-lg">请在右侧面板加载分子数据</div>
            </div>
          )}
        </div>

        <div
          className={`bg-panel-bg border-l border-panel-border overflow-y-auto ${
            isSmallScreen ? 'w-full flex-1' : 'w-1/4'
          }`}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-white rounded-lg overflow-hidden card-shadow">
              <div className="h-1.5 bg-input-bar" />
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-700 mb-3">数据输入</h3>

                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">蛋白质PDB数据</label>
                  <textarea
                    value={proteinPdbText}
                    onChange={(e) => setProteinPdbText(e.target.value)}
                    placeholder="粘贴蛋白质PDB格式数据..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm resize-none textarea-focus"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">配体PDB数据</label>
                  <textarea
                    value={ligandPdbText}
                    onChange={(e) => setLigandPdbText(e.target.value)}
                    placeholder="粘贴配体PDB格式数据..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm resize-none textarea-focus"
                  />
                </div>

                <button
                  onClick={handleLoad}
                  disabled={isLoading}
                  className={`w-full h-11.5 rounded-lg text-white font-medium transition-all btn-press ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-btn-primary-start to-btn-primary-end hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                  style={{ height: '46px' }}
                >
                  {isLoading ? '加载中...' : '加载分子'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden card-shadow">
              <div className="h-1.5 bg-score-bar" />
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-700 mb-3">评分结果</h3>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">范德华冲突</div>
                    <div className="text-xl font-bold text-conflict-red">
                      {score?.vdwConflicts ?? '-'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">结合能 (kcal/mol)</div>
                    <div className="text-xl font-bold" style={{ color: scoreColor }}>
                      {score ? score.totalBindingEnergy.toFixed(2) : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <RadarChart data={radarData} />
                </div>

                {isMinimizing && (
                  <div className="mb-3">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full progress-pulse rounded-full transition-all"
                        style={{ width: `${minimizationProgress * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      能量最小化中...
                    </div>
                  </div>
                )}

                <button
                  onClick={handleMinimize}
                  disabled={!protein || !ligand || isMinimizing}
                  className={`w-full h-11 rounded-lg text-white font-medium transition-all btn-press ${
                    !protein || !ligand || isMinimizing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-score-bar hover:bg-green-600'
                  }`}
                  style={{ height: '44px' }}
                >
                  {isMinimizing ? '优化中...' : '能量最小化'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden card-shadow">
              <div className="h-1.5 bg-snapshot-bar" />
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-700 mb-3">快照管理</h3>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleSaveSnapshot}
                    disabled={!score}
                    className={`flex-1 h-10.5 rounded-lg font-medium transition-all btn-press ${
                      !score
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-btn-snapshot text-black hover:bg-btn-snapshot-hover'
                    }`}
                    style={{ height: '42px' }}
                  >
                    保存快照
                  </button>
                  <button
                    onClick={handleClearSnapshots}
                    disabled={snapshots.length === 0}
                    className={`px-3 h-10.5 rounded-lg text-sm transition-all btn-press ${
                      snapshots.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={{ height: '42px' }}
                  >
                    清空
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {snapshots.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">暂无快照</div>
                  ) : (
                    snapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        onClick={() => handleRestoreSnapshot(snapshot)}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        style={{ height: '64px' }}
                      >
                        {snapshot.thumbnail ? (
                          <img
                            src={snapshot.thumbnail}
                            alt="快照缩略图"
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                            缩略图
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate">
                            {formatTime(snapshot.timestamp)}
                          </div>
                          <div className="text-xs text-gray-500">
                            结合能: {snapshot.score.totalBindingEnergy.toFixed(2)} kcal/mol
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
