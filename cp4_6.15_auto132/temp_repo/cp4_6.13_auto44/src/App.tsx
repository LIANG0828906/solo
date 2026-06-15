import { useState, useEffect, useCallback } from 'react';
import { usePlantStore } from './store';
import { generatePlantData, MOODS, type Mood } from './plantGenerator';
import { renderPlantSVG } from './svgRenderer';
import CollectionView from './CollectionView';

export default function App() {
  const { page, setPage, toast, loadSavedPlants } = usePlantStore();

  useEffect(() => {
    loadSavedPlants();
  }, [loadSavedPlants]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span style={{ fontSize: 26 }}>🌱</span>
          <span>心情植物</span>
        </div>
        <nav className="nav-buttons">
          <button
            className={`nav-btn ${page === 'home' ? 'active' : ''}`}
            onClick={() => setPage('home')}
          >
            🌿 生成
          </button>
          <button
            className={`nav-btn ${page === 'collection' ? 'active' : ''}`}
            onClick={() => setPage('collection')}
          >
            📚 收藏夹
          </button>
        </nav>
      </header>

      <main className="main-content">
        {page === 'home' ? <HomePage /> : <CollectionView />}
      </main>

      {toast && <div className="toast">{toast.message}</div>}
    </div>
  );
}

function HomePage() {
  const { currentPlant, currentSvg, setCurrentPlant, saveCurrentPlant, showToast } =
    usePlantStore();

  const [mood, setMood] = useState<Mood>('calm');
  const [steps, setSteps] = useState<number>(6000);
  const [water, setWater] = useState<number>(5);
  const [workHours, setWorkHours] = useState<number>(7);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    if (steps < 0 || water < 0 || workHours < 0) {
      showToast('数值不能为负数');
      return;
    }
    if (steps > 100000 || water > 100 || workHours > 24) {
      showToast('数值太大啦');
      return;
    }

    const start = performance.now();

    requestAnimationFrame(() => {
      setIsGenerating(true);
      requestAnimationFrame(() => {
        try {
          const plant = generatePlantData({ steps, water, workHours, mood });
          const svg = renderPlantSVG(plant, { animate: true, id: `p-${Date.now()}` });
          setCurrentPlant(plant, svg);
          const elapsed = performance.now() - start;
          if (elapsed > 1400) {
            console.warn(`生成耗时 ${elapsed.toFixed(0)}ms，接近1.5s上限`);
          }
        } catch (e) {
          console.error(e);
          showToast('生成失败，请重试');
        } finally {
          setIsGenerating(false);
        }
      });
    });
  }, [mood, steps, water, workHours, isGenerating, setCurrentPlant, showToast]);

  const handleShare = useCallback(async () => {
    if (!currentPlant || !currentSvg) {
      showToast('请先生成植物');
      return;
    }
    const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant-${currentPlant.mood}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('SVG 已下载 🌿');
  }, [currentPlant, currentSvg, showToast]);

  const handleSave = useCallback(async () => {
    await saveCurrentPlant();
  }, [saveCurrentPlant]);

  const handleStepsChange = (v: string) => {
    const n = v === '' ? 0 : parseInt(v, 10);
    if (!isNaN(n)) setSteps(Math.max(0, n));
  };
  const handleWaterChange = (v: string) => {
    const n = v === '' ? 0 : parseFloat(v);
    if (!isNaN(n)) setWater(Math.max(0, n));
  };
  const handleWorkChange = (v: string) => {
    const n = v === '' ? 0 : parseFloat(v);
    if (!isNaN(n)) setWorkHours(Math.max(0, Math.min(24, n)));
  };

  return (
    <div className="home-layout">
      <section className="panel">
        <div className="panel-title">✨ 今日数据</div>

        <div className="form-group">
          <div className="form-label">此刻心情</div>
          <div className="mood-selector">
            {Object.values(MOODS).map((m) => (
              <button
                key={m.key}
                className={`mood-btn ${mood === m.key ? 'selected' : ''}`}
                onClick={() => setMood(m.key)}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">每日指标</div>
          <div className="input-row">
            <div className="input-unit" data-unit="步">
              <input
                type="number"
                className="input-field"
                min={0}
                max={100000}
                step={100}
                value={steps}
                onChange={(e) => handleStepsChange(e.target.value)}
                placeholder="例如 6000"
              />
            </div>
            <div className="input-unit" data-unit="杯">
              <input
                type="number"
                className="input-field"
                min={0}
                max={100}
                step={0.5}
                value={water}
                onChange={(e) => handleWaterChange(e.target.value)}
                placeholder="例如 5"
              />
            </div>
            <div className="input-unit" data-unit="时">
              <input
                type="number"
                className="input-field"
                min={0}
                max={24}
                step={0.5}
                value={workHours}
                onChange={(e) => handleWorkChange(e.target.value)}
                placeholder="例如 7"
              />
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-mid)' }}>
            步数影响主干 · 喝水决定枝条 · 工作时长控制叶子
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '🌳 生成我的植物'}
        </button>

        {currentPlant && (
          <div style={{ marginTop: 18, padding: 14, background: '#faf7f0', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-deep)', marginBottom: 8 }}>
              植物参数
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12 }}>
              <MiniStat label="主干高" value={`${currentPlant.metrics.trunkHeight}`} unit="px" />
              <MiniStat label="枝条" value={`${currentPlant.metrics.branchCount}`} unit="根" />
              <MiniStat label="叶子" value={`${currentPlant.metrics.leafCount}`} unit="片" />
              <MiniStat label="叶密度" value={`${Math.round(currentPlant.metrics.leafDensity * 100)}`} unit="%" />
            </div>
          </div>
        )}
      </section>

      <section className="panel plant-display">
        <div className="panel-title">🌿 我的植物</div>
        <div className="plant-svg-container">
          {currentSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: currentSvg }}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          ) : (
            <div className="plant-empty">
              <div className="plant-empty-icon">🌱</div>
              填写今日数据，点击「生成我的植物」
              <br />
              <span style={{ fontSize: 13, opacity: 0.75 }}>
                每棵植物都是独一无二的
              </span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className="action-btn favorite"
            onClick={handleSave}
            disabled={!currentPlant}
          >
            <span>⭐</span>
            <span>收藏</span>
          </button>
          <button
            className="action-btn share"
            onClick={handleShare}
            disabled={!currentPlant}
          >
            <span>📥</span>
            <span>导出 SVG</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: '#fffdf8',
      padding: '8px 10px',
      borderRadius: 8,
      border: '1px solid rgba(45,106,79,0.08)',
    }}>
      <div style={{ color: 'var(--text-mid)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-deep)' }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-mid)', marginLeft: 2 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
