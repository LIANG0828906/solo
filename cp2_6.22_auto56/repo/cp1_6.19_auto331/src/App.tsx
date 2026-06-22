import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cauldron } from './modules/brewing/Cauldron';
import { PotionCard } from './modules/potion/PotionCard';
import { usePotionStore } from './modules/potion/store';
import { useBrewingStore } from './modules/brewing/store';
import { INITIAL_MATERIALS, QUALITY_STARS, type Recipe } from './modules/brewing/types';

type RightTab = 'inventory' | 'recipes' | 'records';

export default function App() {
  const { potions, records, recipes, addRecipe, toggleRecipeStar, deleteRecipe } =
    usePotionStore();
  const { setTemperature, incrementStir, addMaterialToCauldron, resetCauldron } =
    useBrewingStore();

  const [rightTab, setRightTab] = useState<RightTab>('inventory');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeTemp, setNewRecipeTemp] = useState(100);
  const [newRecipeStir, setNewRecipeStir] = useState(5);
  const [newRecipeMaterials, setNewRecipeMaterials] = useState<string[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  const handleSaveRecipe = () => {
    if (!newRecipeName.trim() || newRecipeMaterials.length === 0) return;
    addRecipe({
      name: newRecipeName.trim(),
      temperature: newRecipeTemp,
      stirCount: newRecipeStir,
      materialIds: newRecipeMaterials,
    });
    setNewRecipeName('');
    setNewRecipeTemp(100);
    setNewRecipeStir(5);
    setNewRecipeMaterials([]);
  };

  const toggleRecipeMaterial = (materialId: string) => {
    setNewRecipeMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const applyRecipe = (recipe: Recipe) => {
    resetCauldron();
    setTemperature(recipe.temperature);
    for (let i = 0; i < recipe.stirCount; i++) incrementStir();
    recipe.materialIds.forEach((id) => addMaterialToCauldron(id));
    setShowRightDrawer(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMaterial = (id: string) => INITIAL_MATERIALS.find((m) => m.id === id);

  const renderQualityStars = (quality: 'normal' | 'good' | 'perfect' | null) => {
    if (!quality) return null;
    const count = QUALITY_STARS[quality];
    return (
      <span className="text-yellow-400">
        {'★'.repeat(count)}
        <span className="text-gray-600">{'★'.repeat(3 - count)}</span>
      </span>
    );
  };

  const tabButtonClass = (tab: RightTab) =>
    `flex-1 py-2.5 px-2 text-xs font-bold rounded-lg transition-all ${
      rightTab === tab
        ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white shadow-lg'
        : 'bg-[#1a1a2e] text-gray-400 hover:text-white hover:bg-[#252547]'
    }`;

  return (
    <div
      className="min-h-screen w-full text-white font-sans relative overflow-hidden"
      style={{ background: '#1a1a2e' }}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #e94560 0%, transparent 50%), radial-gradient(circle at 80% 70%, #6366f1 0%, transparent 50%)',
          }}
        />
      </div>

      <header className="relative z-10 px-4 md:px-8 py-4 border-b border-[#2a2a4a]">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeftDrawer(true)}
              className="lg:hidden p-2 rounded-lg bg-[#16213e] border border-[#2a2a4a] text-white"
            >
              ☰
            </button>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="text-4xl"
              >
                🧙‍♂️
              </motion.div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#e94560] via-[#f4a261] to-[#A8E6CF] bg-clip-text text-transparent">
                  魔法药剂工坊
                </h1>
                <p className="text-[10px] md:text-xs text-gray-500">
                  Magic Potion Workshop · 炼金术士的秘密配方
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowRightDrawer(true)}
            className="lg:hidden p-2 rounded-lg bg-[#16213e] border border-[#2a2a4a] text-white"
          >
            📋
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-[1800px] mx-auto p-4 md:p-6">
        <div className="hidden lg:flex gap-6 min-h-[calc(100vh-120px)]">
          <div className="flex-1 min-w-0">
            <Cauldron />
          </div>

          <div
            className="w-[320px] shrink-0 bg-[#16213e] rounded-2xl border border-[#2a2a4a] flex flex-col overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}
          >
            <div className="flex gap-2 p-3 border-b border-[#2a2a4a]">
              <button onClick={() => setRightTab('inventory')} className={tabButtonClass('inventory')}>
                🧪 库存
              </button>
              <button onClick={() => setRightTab('recipes')} className={tabButtonClass('recipes')}>
                📖 配方
              </button>
              <button onClick={() => setRightTab('records')} className={tabButtonClass('records')}>
                📝 记录
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                  {rightTab === 'inventory' && (
                    <motion.div
                      key="inventory"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <span>🧪</span> 药剂库存
                        </h3>
                        <span className="text-xs text-gray-400 bg-[#1a1a2e] px-2 py-1 rounded-lg">
                          {potions.length} 瓶
                        </span>
                      </div>
                      {potions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-5xl mb-3 opacity-40">⚗️</div>
                          <p className="text-sm">暂无药剂</p>
                          <p className="text-xs mt-1">快去酿造第一瓶吧！</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <AnimatePresence>
                            {potions.map((potion) => (
                              <PotionCard key={potion.id} potion={potion} />
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {rightTab === 'recipes' && (
                    <motion.div
                      key="recipes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-5">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                          <span>✏️</span> 新建配方
                        </h3>
                        <div className="space-y-3 bg-[#1a1a2e] rounded-xl p-3 border border-[#2a2a4a]">
                          <input
                            type="text"
                            placeholder="配方名称..."
                            value={newRecipeName}
                            onChange={(e) => setNewRecipeName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0f0f1e] border border-[#2a2a4a] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#e94560]"
                          />
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              目标温度: {newRecipeTemp}°C
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={300}
                              value={newRecipeTemp}
                              onChange={(e) => setNewRecipeTemp(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              搅拌次数: {newRecipeStir}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={50}
                              value={newRecipeStir}
                              onChange={(e) => setNewRecipeStir(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg bg-[#0f0f1e] border border-[#2a2a4a] text-white text-sm focus:outline-none focus:border-[#e94560]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-2">材料选择:</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {INITIAL_MATERIALS.map((m) => {
                                const selected = newRecipeMaterials.includes(m.id);
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => toggleRecipeMaterial(m.id)}
                                    className={`p-1.5 rounded-lg text-xl transition-all ${
                                      selected
                                        ? 'bg-[#e94560] scale-105 shadow-lg'
                                        : 'bg-[#0f0f1e] hover:bg-[#252547]'
                                    } border ${selected ? 'border-[#ff6b6b]' : 'border-[#2a2a4a]'}`}
                                    title={m.name}
                                  >
                                    {m.icon}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <motion.button
                            onClick={handleSaveRecipe}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!newRecipeName.trim() || newRecipeMaterials.length === 0}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            💾 保存配方
                          </motion.button>
                        </div>
                      </div>

                      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <span>📖</span> 已保存配方
                        <span className="text-xs text-gray-400 bg-[#1a1a2e] px-2 py-0.5 rounded-lg ml-auto">
                          {recipes.length} 个
                        </span>
                      </h3>
                      {recipes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2 opacity-40">📖</div>
                          <p className="text-sm">暂无保存的配方</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AnimatePresence>
                            {recipes.map((recipe) => (
                              <motion.div
                                key={recipe.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="bg-[#1a1a2e] rounded-xl p-3 border border-[#2a2a4a] hover:border-[#3a3a5a] transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <button
                                    onClick={() => toggleRecipeStar(recipe.id)}
                                    className={`text-xl ${recipe.starred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                                  >
                                    {recipe.starred ? '⭐' : '☆'}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white font-semibold text-sm truncate">
                                        {recipe.name}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {recipe.materialIds.map((id, i) => {
                                        const m = getMaterial(id);
                                        return (
                                          <span
                                            key={i}
                                            className="text-xs bg-[#252547] px-1.5 py-0.5 rounded"
                                            title={m?.name}
                                          >
                                            {m?.icon}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="flex gap-3 text-[10px] text-gray-400">
                                      <span>🌡️ {recipe.temperature}°C</span>
                                      <span>🥄 {recipe.stirCount}次</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <motion.button
                                    onClick={() => applyRecipe(recipe)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-1.5 rounded-lg bg-[#252547] hover:bg-[#3a3a5a] text-white text-xs font-medium transition-colors"
                                  >
                                    ▶️ 应用配方
                                  </motion.button>
                                  <button
                                    onClick={() => deleteRecipe(recipe.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-300 text-xs transition-colors"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {rightTab === 'records' && (
                    <motion.div
                      key="records"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <span>📝</span> 实验记录
                        </h3>
                        <span className="text-xs text-gray-400 bg-[#1a1a2e] px-2 py-1 rounded-lg">
                          {records.length} 条
                        </span>
                      </div>
                      {records.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-5xl mb-3 opacity-40">📜</div>
                          <p className="text-sm">暂无实验记录</p>
                          <p className="text-xs mt-1">开始酿造后自动记录</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {records.map((record) => {
                            const expanded = expandedRecordId === record.id;
                            const avgTemp =
                              record.temperatureCurve.length > 0
                                ? Math.round(
                                    record.temperatureCurve.reduce((a, b) => a + b, 0) /
                                      record.temperatureCurve.length
                                  )
                                : 0;
                            const maxTemp =
                              record.temperatureCurve.length > 0
                                ? Math.max(...record.temperatureCurve)
                                : 0;
                            const minTemp =
                              record.temperatureCurve.length > 0
                                ? Math.min(...record.temperatureCurve)
                                : 0;
                            return (
                              <motion.div
                                key={record.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border overflow-hidden cursor-pointer transition-colors ${
                                  record.success
                                    ? 'bg-[#1a1a2e] border-green-900/50 hover:border-green-700/50'
                                    : 'bg-[#1a1a2e] border-red-900/50 hover:border-red-700/50'
                                }`}
                                onClick={() =>
                                  setExpandedRecordId(expanded ? null : record.id)
                                }
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-lg ${
                                          record.success ? '' : 'grayscale opacity-60'
                                        }`}
                                      >
                                        {record.success ? '✅' : '💥'}
                                      </span>
                                      <div>
                                        <div className="text-white text-sm font-semibold truncate max-w-[140px]">
                                          {record.resultPotionName || '酿造失败'}
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          {formatTime(record.timestamp)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {renderQualityStars(record.quality)}
                                      <span className="text-gray-500 text-xs ml-1">
                                        {expanded ? '▲' : '▼'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 flex-wrap mb-1">
                                    {record.materials.map((m, i) => (
                                      <span
                                        key={i}
                                        className="text-xs bg-[#252547] px-1.5 py-0.5 rounded"
                                      >
                                        {m.icon}
                                        {m.count > 1 && `×${m.count}`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <AnimatePresence>
                                  {expanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className={`px-3 pb-3 pt-1 border-t space-y-2 ${
                                          record.success
                                            ? 'border-green-900/30'
                                            : 'border-red-900/30'
                                        }`}
                                      >
                                        {record.failureReason && (
                                          <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1.5 rounded-lg">
                                            ⚠️ {record.failureReason}
                                          </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                            <div className="text-gray-500 mb-1">平均温度</div>
                                            <div className="text-white font-bold">
                                              🌡️ {avgTemp}°C
                                            </div>
                                          </div>
                                          <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                            <div className="text-gray-500 mb-1">温度范围</div>
                                            <div className="text-white font-bold">
                                              {minTemp}° ~ {maxTemp}°
                                            </div>
                                          </div>
                                          <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                            <div className="text-gray-500 mb-1">搅拌次数</div>
                                            <div className="text-white font-bold">
                                              🥄 {record.stirCount} 次
                                            </div>
                                          </div>
                                          <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                            <div className="text-gray-500 mb-1">结果</div>
                                            <div
                                              className={`font-bold ${
                                                record.success
                                                  ? 'text-green-400'
                                                  : 'text-red-400'
                                              }`}
                                            >
                                              {record.success ? '成功' : '失败'}
                                            </div>
                                          </div>
                                        </div>
                                        {record.temperatureCurve.length > 0 && (
                                          <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                            <div className="text-[10px] text-gray-500 mb-1">
                                              温度曲线 ({record.temperatureCurve.length}s)
                                            </div>
                                            <div className="flex items-end gap-px h-12">
                                              {record.temperatureCurve
                                                .slice(0, 40)
                                                .map((t, i) => (
                                                  <div
                                                    key={i}
                                                    className="flex-1 rounded-t transition-all"
                                                    style={{
                                                      height: `${Math.max(
                                                        5,
                                                        (t / 300) * 100
                                                      )}%`,
                                                      background:
                                                        t < 100
                                                          ? '#00b4d8'
                                                          : t < 200
                                                          ? '#f4a261'
                                                          : '#e63946',
                                                    }}
                                                  />
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <Cauldron />
        </div>
      </main>

      <AnimatePresence>
        {showLeftDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setShowLeftDrawer(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#16213e] border-r border-[#2a2a4a] z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-[#2a2a4a] flex items-center justify-between">
                <h2 className="text-white font-bold">🧰 材料架</h2>
                <button
                  onClick={() => setShowLeftDrawer(false)}
                  className="text-white p-2 hover:bg-[#252547] rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {useBrewingStore.getState().materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-center"
                    >
                      <div className="text-2xl">{m.icon}</div>
                      <div className="text-[10px] text-white truncate">{m.name}</div>
                      <div className="text-[10px] text-[#e94560] font-bold">{m.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showRightDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setShowRightDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[320px] bg-[#16213e] border-l border-[#2a2a4a] z-50 lg:hidden flex flex-col"
            >
              <div className="p-3 border-b border-[#2a2a4a] flex items-center justify-between">
                <div className="flex gap-1 flex-1 mr-2">
                  <button
                    onClick={() => setRightTab('inventory')}
                    className={tabButtonClass('inventory')}
                  >
                    🧪
                  </button>
                  <button
                    onClick={() => setRightTab('recipes')}
                    className={tabButtonClass('recipes')}
                  >
                    📖
                  </button>
                  <button
                    onClick={() => setRightTab('records')}
                    className={tabButtonClass('records')}
                  >
                    📝
                  </button>
                </div>
                <button
                  onClick={() => setShowRightDrawer(false)}
                  className="text-white p-2 hover:bg-[#252547] rounded-lg shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {rightTab === 'inventory' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">🧪 药剂库存</h3>
                      <span className="text-xs text-gray-400">{potions.length} 瓶</span>
                    </div>
                    {potions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-3 opacity-40">⚗️</div>
                        <p className="text-sm">暂无药剂</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <AnimatePresence>
                          {potions.map((p) => (
                            <PotionCard key={p.id} potion={p} />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}

                {rightTab === 'recipes' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-bold mb-3">✏️ 新建配方</h3>
                      <div className="space-y-3 bg-[#1a1a2e] rounded-xl p-3 border border-[#2a2a4a]">
                        <input
                          type="text"
                          placeholder="配方名称..."
                          value={newRecipeName}
                          onChange={(e) => setNewRecipeName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0f0f1e] border border-[#2a2a4a] text-white text-sm"
                        />
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            目标温度: {newRecipeTemp}°C
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={300}
                            value={newRecipeTemp}
                            onChange={(e) => setNewRecipeTemp(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            搅拌次数: {newRecipeStir}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={newRecipeStir}
                            onChange={(e) => setNewRecipeStir(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-[#0f0f1e] border border-[#2a2a4a] text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-2">材料:</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {INITIAL_MATERIALS.map((m) => {
                              const selected = newRecipeMaterials.includes(m.id);
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => toggleRecipeMaterial(m.id)}
                                  className={`p-1.5 rounded-lg text-xl transition-all ${
                                    selected
                                      ? 'bg-[#e94560]'
                                      : 'bg-[#0f0f1e] hover:bg-[#252547]'
                                  }`}
                                >
                                  {m.icon}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={handleSaveRecipe}
                          disabled={!newRecipeName.trim() || newRecipeMaterials.length === 0}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-sm font-bold disabled:opacity-50"
                        >
                          💾 保存配方
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-bold">📖 已保存 ({recipes.length})</h3>
                      {recipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-[#1a1a2e] rounded-xl p-3 border border-[#2a2a4a]"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleRecipeStar(recipe.id)}
                              className={recipe.starred ? 'text-yellow-400' : 'text-gray-600'}
                            >
                              {recipe.starred ? '⭐' : '☆'}
                            </button>
                            <span className="text-white font-semibold text-sm flex-1 truncate">
                              {recipe.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {recipe.materialIds.map((id, i) => {
                              const m = getMaterial(id);
                              return (
                                <span
                                  key={i}
                                  className="text-xs bg-[#252547] px-1.5 py-0.5 rounded"
                                >
                                  {m?.icon}
                                </span>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                applyRecipe(recipe);
                                setShowRightDrawer(false);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-[#252547] text-white text-xs font-medium"
                            >
                              ▶️ 应用
                            </button>
                            <button
                              onClick={() => deleteRecipe(recipe.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-900/50 text-red-300 text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rightTab === 'records' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">📝 实验记录</h3>
                      <span className="text-xs text-gray-400">{records.length} 条</span>
                    </div>
                    <div className="space-y-2">
                      {records.map((record) => {
                        const expanded = expandedRecordId === record.id;
                        const avgTemp =
                          record.temperatureCurve.length > 0
                            ? Math.round(
                                record.temperatureCurve.reduce((a, b) => a + b, 0) /
                                  record.temperatureCurve.length
                              )
                            : 0;
                        return (
                          <div
                            key={record.id}
                            className={`rounded-xl border overflow-hidden cursor-pointer ${
                              record.success
                                ? 'bg-[#1a1a2e] border-green-900/50'
                                : 'bg-[#1a1a2e] border-red-900/50'
                            }`}
                            onClick={() => setExpandedRecordId(expanded ? null : record.id)}
                          >
                            <div className="p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {record.success ? '✅' : '💥'}
                                  </span>
                                  <div>
                                    <div className="text-white text-sm font-semibold">
                                      {record.resultPotionName || '酿造失败'}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      {formatTime(record.timestamp)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {renderQualityStars(record.quality)}
                                  <span className="text-gray-500 text-xs">
                                    {expanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {expanded && (
                              <div
                                className={`px-3 pb-3 pt-1 border-t ${
                                  record.success
                                    ? 'border-green-900/30'
                                    : 'border-red-900/30'
                                }`}
                              >
                                {record.failureReason && (
                                  <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1.5 rounded-lg mb-2">
                                    ⚠️ {record.failureReason}
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                    <div className="text-gray-500">均温</div>
                                    <div className="text-white font-bold">{avgTemp}°C</div>
                                  </div>
                                  <div className="bg-[#0f0f1e] p-2 rounded-lg">
                                    <div className="text-gray-500">搅拌</div>
                                    <div className="text-white font-bold">
                                      {record.stirCount}次
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
