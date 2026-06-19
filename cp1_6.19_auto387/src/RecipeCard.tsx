import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useTeaStore } from './store';
import type { SelectedMaterial } from './types';

const groupMaterials = (materials: SelectedMaterial[]) => {
  const groups: Record<string, SelectedMaterial[]> = {
    tea: [],
    topping: [],
    syrup: [],
  };
  materials.forEach((m) => {
    if (groups[m.category]) groups[m.category].push(m);
  });
  return groups;
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  tea: { label: '茶底', icon: '🍵' },
  topping: { label: '小料', icon: '🧋' },
  syrup: { label: '糖浆', icon: '🍯' },
};

export const RecipeCard = () => {
  const {
    currentRecipe,
    setCardGenerating,
    isCardGenerating,
  } = useTeaStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !currentRecipe) return;
    setCardGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      await new Promise((r) => setTimeout(r, 1000));
      const link = document.createElement('a');
      link.download = `${currentRecipe.name || '我的茶饮配方'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setCardGenerating(false);
    }
  }, [currentRecipe, setCardGenerating]);

  const handleCopyLink = useCallback(async () => {
    if (!currentRecipe) return;
    const params = new URLSearchParams();
    params.set('recipe', currentRecipe.name);
    params.set('id', currentRecipe.id);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentRecipe]);

  if (!currentRecipe) return null;

  const groups = groupMaterials(currentRecipe.materials);
  const primaryColor = currentRecipe.materials[0]?.color || '#A8D5BA';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center pb-10 pt-20 px-4"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="flex flex-col items-center gap-4 w-full max-w-2xl"
        >
          <div className="relative">
            {isCardGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-3xl overflow-hidden z-10 pointer-events-none"
              >
                <motion.div
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-8"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 45%, rgba(200,230,201,0.6) 50%, rgba(255,255,255,0.5) 55%, transparent 100%)',
                    boxShadow: '0 0 30px rgba(165, 214, 167, 0.5)',
                  }}
                />
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ top: ['-5%', '105%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                    className="absolute h-[2px] left-0 right-0"
                    style={{ background: 'rgba(200,230,201,0.4)' }}
                  />
                ))}
              </motion.div>
            )}

            <div
              ref={cardRef}
              className="relative bg-white overflow-hidden"
              style={{
                width: 600,
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 20px rgba(165, 214, 167, 0.3)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-32 opacity-25 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${primaryColor} 0%, transparent 100%)`,
                }}
              />
              <svg
                className="absolute top-4 right-4 opacity-15 pointer-events-none"
                width="120"
                height="120"
                viewBox="0 0 100 100"
              >
                <path
                  d="M50 5 C60 20, 80 25, 75 45 C70 65, 50 70, 50 95 C50 70, 30 65, 25 45 C20 25, 40 20, 50 5"
                  fill={primaryColor}
                />
                <circle cx="50" cy="35" r="18" fill="none" stroke={primaryColor} strokeWidth="1.5" opacity="0.5" />
                <circle cx="50" cy="35" r="10" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.4" />
              </svg>
              <svg
                className="absolute bottom-4 left-4 opacity-10 pointer-events-none"
                width="80"
                height="80"
                viewBox="0 0 100 100"
              >
                <path d="M10 80 Q30 40, 50 60 Q70 80, 90 40" fill="none" stroke={primaryColor} strokeWidth="2" />
                <circle cx="20" cy="70" r="4" fill={primaryColor} />
                <circle cx="55" cy="55" r="3" fill={primaryColor} />
                <circle cx="85" cy="45" r="5" fill={primaryColor} />
              </svg>

              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}55, ${primaryColor}22)`,
                      boxShadow: `0 4px 15px ${primaryColor}33`,
                    }}
                  >
                    {currentRecipe.materials[0]?.icon || '🍵'}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">TeaBlend 专属配方</div>
                    <h1 className="text-2xl font-bold text-gray-800 mt-0.5">{currentRecipe.name}</h1>
                  </div>
                </div>

                <div className="space-y-5 mb-6">
                  {(['tea', 'topping', 'syrup'] as const).map((cat) => {
                    const items = groups[cat];
                    if (items.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{categoryLabels[cat].icon}</span>
                          <span className="text-sm font-semibold text-gray-600">{categoryLabels[cat].label}</span>
                          <div className="flex-1 h-px bg-gray-100 ml-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          {items.map((m, idx) => (
                            <motion.div
                              key={m.instanceId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-2 py-1.5"
                            >
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ background: m.color }}
                              />
                              <span className="text-sm text-gray-700 flex-1">{m.name}</span>
                              <span className="text-xs text-gray-400">×1</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)' }}
                    >
                      🔥
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">预估热量</div>
                      <div className="text-lg font-bold text-gray-800">{currentRecipe.totalCalories} <span className="text-xs font-normal text-gray-400">千卡</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)' }}
                    >
                      🌡️
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">推荐温度</div>
                      <div className="text-lg font-bold text-gray-800">{currentRecipe.servingTemperature}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍃</span>
                    <span className="text-xs text-gray-400">TeaBlend · 调配于 {new Date(currentRecipe.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}99, ${primaryColor}66)` }}
                  >
                    #{currentRecipe.id.slice(0, 6).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              disabled={isCardGenerating}
              className="px-7 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)', boxShadow: '0 4px 14px rgba(102, 187, 106, 0.4)' }}
            >
              <span>{isCardGenerating ? '⏳' : '📥'}</span>
              {isCardGenerating ? '正在生成...' : '下载 PNG'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyLink}
              className="px-7 py-3 rounded-xl font-semibold text-sm bg-white text-gray-700 flex items-center gap-2"
              style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
            >
              <span>{copied ? '✅' : '🔗'}</span>
              {copied ? '链接已复制' : '复制分享链接'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
