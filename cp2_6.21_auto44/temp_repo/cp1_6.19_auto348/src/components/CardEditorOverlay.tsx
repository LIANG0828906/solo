import { useState, useEffect } from 'react';
import { X, Save, Type, Image as ImageIcon, Palette, ChevronLeft } from 'lucide-react';
import { useCardStore } from '@/store/cards';
import { THEMES, THEME_KEYS } from '@/constants/themes';
import Card from './Card';
import ImagePickerDrawer from './ImagePickerDrawer';
import type { ThemeKey } from '@/types';

export default function CardEditorOverlay() {
  const cards = useCardStore((s) => s.cards);
  const selectedCardId = useCardStore((s) => s.selectedCardId);
  const closeEditor = useCardStore((s) => s.closeEditor);
  const updateCard = useCardStore((s) => s.updateCard);
  const keyword = useCardStore((s) => s.keyword);

  const card = cards.find((c) => c.id === selectedCardId) || null;
  const cardIndex = cards.findIndex((c) => c.id === selectedCardId);

  const [draftText, setDraftText] = useState('');
  const [draftTheme, setDraftTheme] = useState<ThemeKey>('minimal');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (card) {
      setDraftText(card.text);
      setDraftTheme(card.theme);
      setSaved(false);
    }
  }, [card?.id]);

  if (!card) return null;
  const theme = THEMES[draftTheme];

  const handleSave = () => {
    updateCard(card.id, { text: draftText, theme: draftTheme });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      closeEditor();
    }, 450);
  };

  const handlePickImage = (url: string) => {
    updateCard(card.id, { imageUrl: url });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end fade-in" style={{ pointerEvents: 'none' }}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20,20,40,0.45)', pointerEvents: 'auto', backdropFilter: 'blur(3px)' }}
        onClick={closeEditor}
      />

      <div
        className="overlay-slide-in relative h-full flex flex-col"
        style={{
          width: '40%',
          minWidth: 380,
          maxWidth: 560,
          backgroundColor: '#ffffff',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.15)',
          pointerEvents: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f0f0f5' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: '#222' }}>编辑卡片 #{cardIndex + 1}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#999' }}>调整文案、图片与主题模板</p>
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#f5f5fa', color: '#666' }}
            onClick={closeEditor}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ececf3')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5f5fa')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div
            className="rounded-2xl p-5 flex justify-center items-center"
            style={{
              background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent}15)`,
              border: `1px solid ${theme.accent}25`,
            }}
          >
            <div
              style={{
                transform: 'scale(0.85)',
                transformOrigin: 'center',
                boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <Card
                card={{ ...card, text: draftText, theme: draftTheme }}
                index={cardIndex}
                isExporting={false}
                isCurrentExport={false}
                exportIndex={-1}
                hideExtras
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#444' }}>
              <Type size={15} style={{ color: theme.accent }} />
              卡片文案
            </label>
            <textarea
              className="input-base resize-none"
              rows={4}
              placeholder="输入卡片上展示的文案内容..."
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              style={{
                fontFamily: theme.font,
                color: theme === THEMES.business ? '#222' : '#333',
                lineHeight: 1.6,
                fontSize: 14,
              }}
            />
            <div className="flex justify-between mt-1 text-xs" style={{ color: '#aaa' }}>
              <span>建议控制在 40-80 字以获得最佳排版</span>
              <span>{draftText.length} 字</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#444' }}>
                <ImageIcon size={15} style={{ color: theme.accent }} />
                配图
              </label>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-full rounded-xl overflow-hidden border-2 transition-all relative group"
                style={{
                  borderColor: '#ececf3',
                  height: 96,
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#ececf3')}
              >
                <img
                  src={card.imageUrl}
                  alt="当前配图"
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                >
                  <span className="text-white text-xs font-semibold flex items-center gap-1">
                    <ChevronLeft size={13} />
                    点击更换配图
                  </span>
                </div>
              </button>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#444' }}>
                <Palette size={15} style={{ color: theme.accent }} />
                主题模板
              </label>
              <div className="space-y-1.5">
                {THEME_KEYS.map((t) => {
                  const th = THEMES[t];
                  const active = draftTheme === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      className="w-full rounded-lg px-3 py-2 flex items-center gap-2 transition-all text-left"
                      style={{
                        backgroundColor: active ? th.accent + '15' : '#f8f8fc',
                        border: active ? `1.5px solid ${th.accent}` : '1.5px solid transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setDraftTheme(t)}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: th.bg, border: '1.5px solid ' + th.accent }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: th.accent }} />
                      </div>
                      <span
                        className="text-xs font-semibold flex-1"
                        style={{ color: active ? th.accent : '#444' }}
                      >
                        {th.name}
                      </span>
                      {active && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: th.accent }}
                        >
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: '#f0f0f5' }}>
          <button type="button" className="btn-secondary flex-1" onClick={closeEditor}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={handleSave}
            style={{ backgroundColor: saved ? '#22c55e' : undefined }}
          >
            {saved ? (
              <>保存成功 ✓</>
            ) : (
              <>
                <Save size={16} />
                保存修改
              </>
            )}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <ImagePickerDrawer
          keyword={keyword || '知识'}
          currentUrl={card.imageUrl}
          onPick={(url) => {
            handlePickImage(url);
            setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
