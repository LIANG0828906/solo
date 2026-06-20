import { useState } from 'react';
import { Search, Layers, Hash, Sparkles, ChevronDown, Check, X } from 'lucide-react';
import { THEMES, THEME_KEYS } from '@/constants/themes';
import { fetchMaterials } from '@/api/materials';
import { useCardStore } from '@/store/cards';
import type { ThemeKey, Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function GeneratorPanel() {
  const [keyword, setKeyword] = useState('');
  const [count, setCount] = useState(6);
  const [selectedThemes, setSelectedThemes] = useState<ThemeKey[]>(['minimal', 'business', 'cartoon']);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const setCards = useCardStore((s) => s.setCards);
  const setStoreKeyword = useCardStore((s) => s.setKeyword);

  const toggleTheme = (t: ThemeKey) => {
    setSelectedThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    if (selectedThemes.length === 0) return;
    setLoading(true);
    setStoreKeyword(keyword);
    try {
      const data = await fetchMaterials(keyword, selectedThemes, Math.max(count * 3, 30));
      const { items } = data;
      const newCards: Card[] = [];
      const usedTexts = new Set<string>();
      for (let i = 0; i < count; i++) {
        const pool = items.filter((it) => !usedTexts.has(it.id));
        const src = pool.length > 0 ? pool : items;
        const pick = src[Math.floor(Math.random() * src.length)];
        usedTexts.add(pick.id);
        const theme = selectedThemes[Math.floor(Math.random() * selectedThemes.length)];
        newCards.push({
          id: uuidv4(),
          text: pick.text,
          imageUrl: pick.imageUrl,
          theme,
        });
      }
      setCards(newCards);
    } catch (err) {
      console.error('生成卡片失败', err);
      const fallbackCards: Card[] = [];
      for (let i = 0; i < count; i++) {
        const theme = selectedThemes[Math.floor(Math.random() * selectedThemes.length)];
        fallbackCards.push({
          id: uuidv4(),
          text: `${keyword}主题知识卡片 #${i + 1}：持续学习，每天进步一点点，积累终将带来跃迁。`,
          imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 10000}?w=800&sig=${i}`,
          theme,
        });
      }
      setCards(fallbackCards);
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = keyword.trim() && selectedThemes.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5" style={{ scrollBehavior: 'smooth' }}>
      <div className="mb-6">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#6c63ff' }} />
          卡片生成设置
        </h2>
        <p className="text-xs" style={{ color: '#999' }}>配置关键词、主题模板与卡片数量</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#444' }}>
            <Search size={15} style={{ color: '#6c63ff' }} />
            主题关键词
          </label>
          <input
            type="text"
            className="input-base"
            placeholder="输入关键词，如 Python入门、论语解读、英语学习..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canGenerate && handleGenerate()}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {['Python入门', '论语解读', '英语学习', 'AI人工智能', '数学思维'].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setKeyword(w)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  backgroundColor: keyword === w ? 'rgba(108,99,255,0.12)' : '#f3f3f8',
                  color: keyword === w ? '#6c63ff' : '#666',
                  border: `1px solid ${keyword === w ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#444' }}>
            <Layers size={15} style={{ color: '#6c63ff' }} />
            主题模板（多选）
          </label>
          <button
            type="button"
            className="input-base flex items-center justify-between cursor-pointer text-left"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <div className="flex flex-wrap gap-1.5 items-center">
              {selectedThemes.length === 0 ? (
                <span style={{ color: '#aaa' }}>请至少选择一套主题</span>
              ) : (
                selectedThemes.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: THEMES[t].accent + '22',
                      color: THEMES[t].accent,
                      fontWeight: 600,
                    }}
                  >
                    {THEMES[t].name}
                  </span>
                ))
              )}
            </div>
            <ChevronDown
              size={18}
              style={{ color: '#888', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : undefined }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="fade-in absolute left-0 right-0 mt-2 rounded-xl border shadow-lg z-20 overflow-hidden"
              style={{ backgroundColor: '#fff', borderColor: '#e8e8f0' }}
            >
              {THEME_KEYS.map((t) => {
                const th = THEMES[t];
                const selected = selectedThemes.includes(t);
                return (
                  <div
                    key={t}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: selected ? 'rgba(108,99,255,0.04)' : undefined }}
                    onClick={() => toggleTheme(t)}
                  >
                    <div
                      className="w-11 h-7 rounded-md border"
                      style={{
                        backgroundColor: th.bg,
                        borderColor: '#ddd',
                        position: 'relative',
                      }}
                    >
                      <div
                        className="absolute"
                        style={{
                          left: 4,
                          bottom: 3,
                          width: 20,
                          height: 2,
                          borderRadius: 2,
                          backgroundColor: th.accent,
                        }}
                      />
                      <div
                        className="absolute"
                        style={{
                          right: 4,
                          top: 5,
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          backgroundColor: th.fg,
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: '#333' }}>{th.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#999' }}>
                        背景 {th.bg} · 文案 {th.fg}
                      </div>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: selected ? '#6c63ff' : '#fff',
                        border: selected ? 'none' : '2px solid #d0d0d8',
                      }}
                    >
                      {selected && <Check size={12} color="#fff" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#444' }}>
              <Hash size={15} style={{ color: '#6c63ff' }} />
              卡片数量
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-bold"
              style={{ backgroundColor: 'rgba(108,99,255,0.12)', color: '#6c63ff' }}
            >
              {count} 张
            </span>
          </label>
          <input
            type="range"
            min={4}
            max={12}
            step={1}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="slider"
          />
          <div className="flex justify-between mt-1 text-xs" style={{ color: '#aaa' }}>
            <span>4</span>
            <span>8</span>
            <span>12</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            style={{ height: 46, fontSize: 15 }}
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                素材检索中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                生成 {count} 张卡片
              </>
            )}
          </button>
          {!keyword.trim() && (
            <p className="text-xs mt-2 text-center" style={{ color: '#aaa' }}>请先输入关键词后生成卡片</p>
          )}
          {keyword.trim() && selectedThemes.length === 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: '#f56c6c' }}>请至少选择一套主题模板</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 mt-6 border-t" style={{ borderColor: '#f0f0f5' }}>
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(212,175,55,0.08))',
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#6c63ff' }}>使用提示</p>
          <ul className="text-xs space-y-1" style={{ color: '#666', lineHeight: 1.7 }}>
            <li>• 输入关键词后系统从素材库检索匹配内容</li>
            <li>• 可同时选择多套主题，卡片将随机分配</li>
            <li>• 支持拖拽排序、单卡文案与图片编辑</li>
            <li>• 一键导出 1280×720 PNG，打包为 ZIP 下载</li>
          </ul>
        </div>
      </div>

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          style={{ backgroundColor: 'transparent' }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
