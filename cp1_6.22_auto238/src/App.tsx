import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import RecipeEditor from './RecipeEditor';
import ColorCard from './ColorCard';
import {
  Recipe,
  RecipeStep,
  DyeMaterial,
  ColorResult,
  blendDyeColors,
  rgbToHex,
  calculateRecipeCompletion,
} from './data/recipes';

function addRipple(e: React.MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

const dyeTypeLabel: Record<Recipe['dyeType'], string> = {
  direct: '直接染',
  mordant: '媒染',
  reductive: '还原染',
};

function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<number>();
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, delay]);
  return debounced;
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2200);
  };
  const node = msg ? <div className="toast">{msg}</div> : null;
  return { show, node };
}

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<DyeMaterial[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Recipe | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [detailColor, setDetailColor] = useState<ColorResult | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<DyeMaterial>>({
    name: '',
    source: '',
    defaultColor: { r: 150, g: 150, b: 150 },
    lightfastness: 5,
    pHMin: 4,
    pHMax: 8,
    type: 'mordant',
  });

  const debouncedSearch = useDebounce(search, 200);
  const debouncedMat = useDebounce(filterMaterial, 200);
  const { show: toast, node: toastNode } = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const [rData, mData] = await Promise.all([
        fetch(`/api/recipes?search=${encodeURIComponent(debouncedSearch)}&material=${encodeURIComponent(debouncedMat)}&dyeType=${filterType}`).then((r) => r.json()),
        fetch('/api/materials').then((r) => r.json()),
      ]);
      setRecipes(rData);
      setMaterials(mData);
      if (!selectedId && rData.length > 0) {
        setSelectedId(rData[0].id);
        setDraft(JSON.parse(JSON.stringify(rData[0])));
      }
    } catch (e) {
      console.warn('后端未启动，使用本地数据', e);
    }
    const t1 = performance.now();
    if (t1 - t0 < 50) await new Promise((r) => setTimeout(r, 50 - (t1 - t0)));
    setLoading(false);
  }, [debouncedSearch, debouncedMat, filterType, selectedId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (selectedId && recipes.length > 0 && !draft) {
      const r = recipes.find((x) => x.id === selectedId);
      if (r) setDraft(JSON.parse(JSON.stringify(r)));
    }
  }, [selectedId, recipes, draft]);

  const saveToServer = useCallback(
    async (payload: Recipe) => {
      const method = recipes.some((r) => r.id === payload.id) ? 'PUT' : 'POST';
      const url = method === 'PUT' ? `/api/recipes/${payload.id}` : '/api/recipes';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          dyeType: payload.dyeType,
          fabricType: payload.fabricType,
          steps: payload.steps,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setRecipes((list) => {
          const idx = list.findIndex((r) => r.id === saved.id);
          if (idx >= 0) {
            const n = [...list];
            n[idx] = saved;
            return n;
          }
          return [saved, ...list];
        });
        setSelectedId(saved.id);
        setDraft(JSON.parse(JSON.stringify(saved)));
        setIsDirty(false);
        toast(method === 'PUT' ? '配方已更新 ✓' : '配方已创建 ✓');
      }
    },
    [recipes, toast]
  );

  const handleCreate = (e: React.MouseEvent) => {
    addRipple(e);
    const now = new Date().toISOString();
    const mat = materials[0];
    const newRecipe: Recipe = {
      id: uuidv4(),
      name: '新染色配方',
      description: '',
      dyeType: 'mordant',
      fabricType: '棉',
      steps: [
        {
          id: uuidv4(),
          materialId: mat?.id ?? '',
          materialName: mat?.name ?? '茜草',
          weightGrams: 10,
          mordantName: '明矾',
          mordantConcentration: 10,
          duration: 45,
          temperature: 75,
        },
      ],
      createdAt: now,
      updatedAt: now,
      completion: 100,
    };
    setDraft(newRecipe);
    setSelectedId(newRecipe.id);
    setIsDirty(true);
    setSidebarOpen(false);
    toast('新配方已创建，请保存以提交');
  };

  const handleSelect = (r: Recipe) => {
    if (isDirty && draft) {
      if (!confirm('当前配方有未保存的修改，切换将丢失。继续吗？')) return;
    }
    setSelectedId(r.id);
    setDraft(JSON.parse(JSON.stringify(r)));
    setIsDirty(false);
    setSidebarOpen(false);
  };

  const handleCopy = async (e: React.MouseEvent, id: string) => {
    addRipple(e);
    e.stopPropagation();
    try {
      const res = await fetch(`/api/recipes/${id}/copy`, { method: 'POST' });
      if (res.ok) {
        const copy = await res.json();
        setRecipes((list) => [copy, ...list]);
        setSelectedId(copy.id);
        setDraft(JSON.parse(JSON.stringify(copy)));
        setIsDirty(false);
        toast('配方副本已创建');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    addRipple(e);
    e.stopPropagation();
    if (!confirm('确定删除此配方吗？')) return;
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      setRecipes((list) => list.filter((r) => r.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDraft(null);
      }
      toast('配方已删除');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = (data: Partial<Recipe>) => {
    if (!draft) return;
    setDraft({ ...draft, ...data });
    setIsDirty(true);
  };

  const handleAddStep = (step: RecipeStep) => {
    if (!draft) return;
    const steps = [...draft.steps, step];
    setDraft({ ...draft, steps, completion: calculateRecipeCompletion(steps) });
    setIsDirty(true);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<RecipeStep>) => {
    if (!draft) return;
    const steps = draft.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
    setDraft({ ...draft, steps, completion: calculateRecipeCompletion(steps) });
    setIsDirty(true);
  };

  const handleRemoveStep = (stepId: string) => {
    if (!draft) return;
    const steps = draft.steps.filter((s) => s.id !== stepId);
    setDraft({ ...draft, steps, completion: calculateRecipeCompletion(steps) });
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    saveToServer(draft);
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name) {
      toast('请输入染材名称');
      return;
    }
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });
      if (res.ok) {
        const mat = await res.json();
        setMaterials((m) => [...m, mat]);
        setShowMaterialModal(false);
        setNewMaterial({
          name: '',
          source: '',
          defaultColor: { r: 150, g: 150, b: 150 },
          lightfastness: 5,
          pHMin: 4,
          pHMax: 8,
          type: 'mordant',
        });
        toast('自定义染材已添加');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const recipeColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of recipes) {
      const c = blendDyeColors(r.steps, materials);
      map[r.id] = rgbToHex(c.mainColor.r, c.mainColor.g, c.mainColor.b);
    }
    return map;
  }, [recipes, materials]);

  const selectedRecipe = draft;

  return (
    <div className="app">
      <div className={`backdrop ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <div>
              <h1>🌿 植物染色色卡</h1>
              <p>配方管理 · 色彩预览 · 色卡生成</p>
            </div>
            <button className="menu-toggle" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        <div className="sidebar-tools">
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={(e) => {
              addRipple(e);
              handleCreate(e);
            }}
          >
            ＋ 新建配方
          </button>
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索配方名称或描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-row">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">全部类型</option>
              <option value="direct">直接染</option>
              <option value="mordant">媒染</option>
              <option value="reductive">还原染</option>
            </select>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            >
              <option value="">全部染材</option>
              {materials.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="recipe-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8B8378', fontSize: '13px' }}>
              加载配方中...
            </div>
          ) : recipes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8B8378', fontSize: '13px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍃</div>
              暂无配方，点击上方按钮创建第一个配方
            </div>
          ) : (
            recipes.map((r) => (
              <div
                key={r.id}
                className={`recipe-card ${selectedId === r.id ? 'active' : ''}`}
                onClick={() => handleSelect(r)}
              >
                <div className="recipe-card-top">
                  <div
                    className="recipe-card-color"
                    style={{ background: recipeColors[r.id] || '#F5F0EB' }}
                  />
                  <div className="recipe-card-info">
                    <div className="recipe-card-name">{r.name}</div>
                    <div className="recipe-card-meta">
                      <span>{r.fabricType}</span>
                      <span className="recipe-tag">{dyeTypeLabel[r.dyeType]}</span>
                    </div>
                  </div>
                </div>
                <div className="recipe-desc">
                  {r.description || '（暂无描述）'}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {r.steps.slice(0, 3).map((s) => (
                    <span key={s.id} className="recipe-tag" style={{ background: 'rgba(255,255,255,0.05)', color: '#b5ac9f' }}>
                      {s.materialName} {s.weightGrams}g
                    </span>
                  ))}
                  {r.steps.length > 3 && (
                    <span className="recipe-tag" style={{ background: 'rgba(255,255,255,0.05)', color: '#b5ac9f' }}>
                      +{r.steps.length - 3}
                    </span>
                  )}
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${r.completion}%` }} />
                </div>
                <div className="progress-text">
                  <span>配方完成度 {r.completion}%</span>
                  <span style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => handleCopy(e, r.id)}
                      title="复制配方"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a3b18a',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(163,177,138,0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      📋 复制
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      title="删除配方"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#c05648',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(192,86,72,0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      🗑 删除
                    </button>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)} style={{ background: 'var(--bg-light)', color: 'var(--text-dark)', border: '1px solid var(--card-border)' }}>
              ☰
            </button>
            <div>
              <h2>{selectedRecipe ? selectedRecipe.name : '植物染色配方管理器'}</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {selectedRecipe
                  ? `${selectedRecipe.steps.length} 个染色步骤 · ${selectedRecipe.fabricType} · ${dyeTypeLabel[selectedRecipe.dyeType]}${isDirty ? ' · 有未保存的修改' : ''}`
                  : `共 ${recipes.length} 个配方 · ${materials.length} 种染材`}
              </div>
            </div>
          </div>
          <div className="main-header-actions">
            <button
              className="btn btn-ghost"
              onClick={(e) => {
                addRipple(e);
                setShowMaterialModal(true);
              }}
            >
              ➕ 添加染材
            </button>
            {selectedRecipe && recipes.some((r) => r.id === selectedRecipe.id) && (
              <button
                className="btn btn-ghost"
                onClick={(e) => handleCopy(e, selectedRecipe.id)}
              >
                📋 复制配方
              </button>
            )}
          </div>
        </header>

        <div className="main-body">
          {!selectedRecipe && !loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎨</div>
              <div className="empty-state-title">开始你的植物染色之旅</div>
              <div className="empty-state-desc">
                从左侧选择已有配方，或点击「新建配方」按钮创建新的染色方案。
                <br />
                系统内置 20 种常见植物染材，支持自定义染材和配方复制微调。
              </div>
            </div>
          ) : (
            <>
              <RecipeEditor
                recipe={selectedRecipe}
                materials={materials}
                onUpdate={handleUpdate}
                onAddStep={handleAddStep}
                onUpdateStep={handleUpdateStep}
                onRemoveStep={handleRemoveStep}
                isDirty={isDirty}
                onSave={handleSave}
              />
              <ColorCard
                recipe={selectedRecipe}
                materials={materials}
                onShowDetail={(c) => setDetailColor(c)}
              />
            </>
          )}

          <div className="panel material-library">
            <div className="panel-header">
              <span className="panel-title">染材库存库 · 共 {materials.length} 种</span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={(e) => {
                  addRipple(e);
                  setShowMaterialModal(true);
                }}
              >
                ＋ 新增自定义染材
              </button>
            </div>
            <div className="material-grid">
              {materials.map((m) => {
                const c = rgbToHex(m.defaultColor.r, m.defaultColor.g, m.defaultColor.b);
                return (
                  <div key={m.id} className="material-item" title={`${m.name} - ${m.source}`}>
                    <div className="material-header">
                      <div className="material-color" style={{ background: c }} />
                      <div>
                        <div className="material-name">{m.name}</div>
                      </div>
                    </div>
                    <div className="material-source">{m.source}</div>
                    <div className="material-stats">
                      <span className="material-stat">耐光 {m.lightfastness}/8</span>
                      <span className="material-stat">pH {m.pHMin}-{m.pHMax}</span>
                      <span className="material-stat" style={{
                        background: m.type === 'direct' ? 'rgba(163,177,138,0.15)' : m.type === 'reductive' ? 'rgba(100,85,70,0.15)' : 'rgba(212,163,115,0.15)',
                        color: m.type === 'direct' ? '#7a8a64' : m.type === 'reductive' ? '#5a4d42' : '#a3804f'
                      }}>
                        {dyeTypeLabel[m.type]}
                      </span>
                      {m.isCustom && <span className="material-stat" style={{ background: 'rgba(139,125,107,0.2)' }}>自定义</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {detailColor && (
        <div className="modal-overlay" onClick={() => setDetailColor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">色值详情</span>
              <button className="modal-close" onClick={() => setDetailColor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div
                className="zoom-color-card"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgb(${detailColor.secondaryColor.r},${detailColor.secondaryColor.g},${detailColor.secondaryColor.b}) 0%, rgb(${detailColor.mainColor.r},${detailColor.mainColor.g},${detailColor.mainColor.b}) 60%, rgba(${Math.round(detailColor.mainColor.r*0.7)},${Math.round(detailColor.mainColor.g*0.7)},${Math.round(detailColor.mainColor.b*0.7)},1) 100%)`,
                }}
              />
              <div className="color-detail-grid">
                <div className="color-detail-box">
                  <div className="form-label">HEX 色值</div>
                  <div className="color-detail-value" style={{ fontSize: '16px' }}>{detailColor.hex}</div>
                </div>
                <div className="color-detail-box">
                  <div className="form-label">RGB 色值</div>
                  <div className="color-detail-value" style={{ fontSize: '14px' }}>
                    {detailColor.mainColor.r}, {detailColor.mainColor.g}, {detailColor.mainColor.b}
                  </div>
                </div>
                <div className="color-detail-box">
                  <div className="form-label">近似 PANTONE</div>
                  <div className="color-detail-value" style={{ fontSize: '13px' }}>{detailColor.pantoneApprox}</div>
                </div>
                <div className="color-detail-box">
                  <div className="form-label">辅色 HEX</div>
                  <div className="color-detail-value" style={{ fontSize: '16px' }}>
                    {rgbToHex(detailColor.secondaryColor.r, detailColor.secondaryColor.g, detailColor.secondaryColor.b)}
                  </div>
                </div>
              </div>
              <div className="color-palette" style={{ marginTop: '4px' }}>
                {[-0.3, -0.15, 0, 0.15, 0.3].map((f, i) => {
                  const adj = (c: number) => Math.max(0, Math.min(255, Math.round(c + (f > 0 ? (255 - c) * f : c * f))));
                  const { r, g, b } = detailColor.mainColor;
                  const hex = rgbToHex(adj(r), adj(g), adj(b));
                  return (
                    <div
                      key={i}
                      className="color-swatch"
                      style={{ background: hex, height: '60px' }}
                      onClick={() => {
                        navigator.clipboard?.writeText(hex);
                        toast(`已复制 ${hex}`);
                      }}
                    >
                      <span className="color-swatch-label">{hex}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailColor(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">添加自定义染材</span>
              <button className="modal-close" onClick={() => setShowMaterialModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">染材名称 *</label>
                  <input
                    className="form-input"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    placeholder="例如：红花"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">来源部位</label>
                  <input
                    className="form-input"
                    value={newMaterial.source}
                    onChange={(e) => setNewMaterial({ ...newMaterial, source: e.target.value })}
                    placeholder="例如：花瓣"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">染色类型</label>
                  <select
                    className="form-select"
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as DyeMaterial['type'] })}
                  >
                    <option value="direct">直接染</option>
                    <option value="mordant">媒染</option>
                    <option value="reductive">还原染</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">耐光等级 (1-8)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={8}
                    value={newMaterial.lightfastness}
                    onChange={(e) => setNewMaterial({ ...newMaterial, lightfastness: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">pH 最小值</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    max={14}
                    value={newMaterial.pHMin}
                    onChange={(e) => setNewMaterial({ ...newMaterial, pHMin: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">pH 最大值</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    max={14}
                    value={newMaterial.pHMax}
                    onChange={(e) => setNewMaterial({ ...newMaterial, pHMax: parseInt(e.target.value) || 14 })}
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">
                  默认染色效果 RGB：({newMaterial.defaultColor?.r}, {newMaterial.defaultColor?.g}, {newMaterial.defaultColor?.b})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      flexShrink: 0,
                      background: `rgb(${newMaterial.defaultColor?.r ?? 150},${newMaterial.defaultColor?.g ?? 150},${newMaterial.defaultColor?.b ?? 150})`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '18px', color: '#c05648', fontWeight: 600 }}>R</span>
                      <input
                        type="range"
                        min={0}
                        max={255}
                        value={newMaterial.defaultColor?.r ?? 150}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            defaultColor: { ...(newMaterial.defaultColor || { r: 150, g: 150, b: 150 }), r: parseInt(e.target.value) },
                          })
                        }
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '18px', color: '#7a8a64', fontWeight: 600 }}>G</span>
                      <input
                        type="range"
                        min={0}
                        max={255}
                        value={newMaterial.defaultColor?.g ?? 150}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            defaultColor: { ...(newMaterial.defaultColor || { r: 150, g: 150, b: 150 }), g: parseInt(e.target.value) },
                          })
                        }
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '18px', color: '#5a7a9a', fontWeight: 600 }}>B</span>
                      <input
                        type="range"
                        min={0}
                        max={255}
                        value={newMaterial.defaultColor?.b ?? 150}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            defaultColor: { ...(newMaterial.defaultColor || { r: 150, g: 150, b: 150 }), b: parseInt(e.target.value) },
                          })
                        }
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMaterialModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  addRipple(e);
                  handleAddMaterial();
                }}
              >
                添加染材
              </button>
            </div>
          </div>
        </div>
      )}

      {toastNode}
    </div>
  );
};

export default App;
