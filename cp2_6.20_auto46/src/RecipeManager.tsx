import { useState, useCallback, useMemo } from 'react';
import { useLabStore } from './store';
import { REAGENT_LIST, type Recipe, type RecipeStep } from './types';
import MarkdownIt from 'markdown-it';
import html2canvas from 'html2canvas';
import { Trash2, X, Share2, Save } from 'lucide-react';

const md = new MarkdownIt();

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 85%)`;
}

function hashBorderColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 65%)`;
}

function getReagentName(id: string): string {
  return REAGENT_LIST.find((r) => r.id === id)?.name ?? id;
}

function StepList({
  steps,
  selectedStep,
  onSelectStep,
}: {
  steps: RecipeStep[];
  selectedStep: number | null;
  onSelectStep: (id: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((step, idx) => {
        const isSelected = selectedStep === step.id;
        return (
          <div
            key={step.id}
            onClick={() => onSelectStep(step.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              background: isSelected ? '#e8f0fe' : '#fff',
              border: isSelected ? '2px solid #4285f4' : '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isSelected ? '#4285f4' : '#bdc3c7',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                {getReagentName(step.reagentId)}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                用量: {step.amount} mL
              </div>
            </div>
            {isSelected && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#4285f4',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MarkdownEditor({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (v: string) => void;
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const html = useMemo(() => md.render(notes || ''), [notes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
        <button
          onClick={() => setTab('edit')}
          style={{
            padding: '6px 16px',
            border: 'none',
            background: tab === 'edit' ? '#4285f4' : '#e8e8e8',
            color: tab === 'edit' ? '#fff' : '#555',
            cursor: 'pointer',
            fontSize: 13,
            borderRadius: '6px 0 0 6px',
            transition: 'all 0.2s',
          }}
        >
          编辑
        </button>
        <button
          onClick={() => setTab('preview')}
          style={{
            padding: '6px 16px',
            border: 'none',
            background: tab === 'preview' ? '#4285f4' : '#e8e8e8',
            color: tab === 'preview' ? '#fff' : '#555',
            cursor: 'pointer',
            fontSize: 13,
            borderRadius: '0 6px 6px 0',
            transition: 'all 0.2s',
          }}
        >
          预览
        </button>
      </div>
      {tab === 'edit' ? (
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入 Markdown 笔记..."
          style={{
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            minHeight: 200,
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            overflow: 'auto',
            fontSize: 14,
            lineHeight: 1.6,
            minHeight: 200,
          }}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  onClick,
  onDelete,
  index,
}: {
  recipe: Recipe;
  onClick: () => void;
  onDelete: () => void;
  index?: number;
}) {
  const reagentNames = recipe.steps.map((s) => getReagentName(s.reagentId));

  return (
    <div
      className="recipe-card-fade"
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        breakInside: 'avoid',
        marginBottom: 16,
        animationDelay: `${(index ?? 0) * 60}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {recipe.coverImage && (
        <img
          src={recipe.coverImage}
          alt={recipe.name}
          style={{
            width: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      )}
      <div style={{ padding: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: '#222' }}>
            {recipe.name}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#bbb',
              padding: 4,
              display: 'flex',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e74c3c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#bbb';
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6, lineHeight: 1.5 }}>
          {reagentNames.join('、')}
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
          反应时间: {recipe.reactionTime}s
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 500,
                background: hashColor(tag),
                border: `1px solid ${hashBorderColor(tag)}`,
                color: '#444',
                transition: 'transform 0.15s',
                cursor: 'default',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.92)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecipeDetail({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const store = useLabStore();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [notes, setNotes] = useState(recipe.notes);

  const handleNotesChange = useCallback(
    (v: string) => {
      setNotes(v);
      store.updateRecipeNotes(recipe.id, v);
    },
    [recipe.id, store]
  );

  const handleShare = useCallback(() => {
    const canvasEl = document.getElementById('lab-canvas') as HTMLCanvasElement | null;
    if (canvasEl) {
      try {
        const dataUrl = canvasEl.toDataURL('image/png');
        const link = navigator.clipboard.writeText(
          `${window.location.href}#recipe=${recipe.id}`
        );
      } catch {}
    }
    const shareText = `查看配方: ${recipe.name} - ${recipe.steps.map((s) => getReagentName(s.reagentId)).join(' + ')}`;
    navigator.clipboard.writeText(shareText).catch(() => {});
  }, [recipe]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid #eee',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>
            {recipe.name}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: 24,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderRight: '1px solid #f0f0f0',
              paddingRight: 24,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#555',
                marginBottom: 4,
              }}
            >
              实验步骤
            </div>
            <StepList
              steps={recipe.steps}
              selectedStep={selectedStep}
              onSelectStep={setSelectedStep}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>
              反应时间: {recipe.reactionTime}s
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    background: hashColor(tag),
                    border: `1px solid ${hashBorderColor(tag)}`,
                    color: '#444',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#555',
                marginBottom: 4,
              }}
            >
              笔记
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <MarkdownEditor notes={notes} onChange={handleNotesChange} />
            </div>
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#4285f4',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(66,133,244,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Share2 size={16} />
              分享
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecipeManager() {
  const store = useLabStore();
  const [saving, setSaving] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeTags, setRecipeTags] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    store.recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [store.recipes]);

  const filteredRecipes = useMemo(() => {
    if (store.activeTags.length === 0) return store.recipes;
    return store.recipes.filter((r) =>
      store.activeTags.some((t) => r.tags.includes(t))
    );
  }, [store.recipes, store.activeTags]);

  const selectedRecipe = useMemo(
    () => store.recipes.find((r) => r.id === store.selectedRecipeId) ?? null,
    [store.recipes, store.selectedRecipeId]
  );

  const captureCoverImage = useCallback(async (): Promise<string> => {
    try {
      const canvasEl = document.getElementById('lab-canvas') as HTMLCanvasElement | null;
      if (canvasEl && typeof canvasEl.toDataURL === 'function') {
        return canvasEl.toDataURL('image/png');
      }
      const target = document.getElementById('lab-canvas');
      if (target) {
        const captured = await html2canvas(target);
        return captured.toDataURL('image/png');
      }
    } catch {}
    return '';
  }, []);

  const handleSave = useCallback(async () => {
    if (!recipeName.trim()) return;
    const coverImage = await captureCoverImage();
    const tags = recipeTags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    store.saveRecipe(recipeName.trim(), tags, coverImage);
    setRecipeName('');
    setRecipeTags('');
    setSaving(false);
  }, [recipeName, recipeTags, captureCoverImage, store]);

  return (
    <div
      style={{
        background: '#f0f2f5',
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, #d0d8e0 19px, #d0d8e0 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #d0d8e0 19px, #d0d8e0 20px)`,
        minHeight: '100%',
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#222' }}>
            配方管理
          </h2>
          {!saving ? (
            <button
              onClick={() => setSaving(true)}
              disabled={store.beakerReagents.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                background: store.beakerReagents.length === 0 ? '#ccc' : '#4285f4',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: store.beakerReagents.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (store.beakerReagents.length > 0) {
                  e.currentTarget.style.boxShadow =
                    '0 4px 14px rgba(66,133,244,0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Save size={16} />
              保存配方
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                padding: '8px 14px',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="配方名称"
                autoFocus
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                  width: 140,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setSaving(false);
                }}
              />
              <input
                value={recipeTags}
                onChange={(e) => setRecipeTags(e.target.value)}
                placeholder="标签 (逗号分隔)"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                  width: 140,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setSaving(false);
                }}
              />
              <button
                onClick={handleSave}
                disabled={!recipeName.trim()}
                style={{
                  padding: '6px 14px',
                  background: recipeName.trim() ? '#4285f4' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: recipeName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                确定
              </button>
              <button
                onClick={() => setSaving(false)}
                style={{
                  padding: '6px 14px',
                  background: '#e8e8e8',
                  color: '#555',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                取消
              </button>
            </div>
          )}
        </div>

        {allTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {allTags.map((tag) => {
              const isActive = store.activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => store.toggleTag(tag)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 16,
                    border: isActive
                      ? `1.5px solid ${hashBorderColor(tag)}`
                      : '1px solid #ddd',
                    background: isActive ? hashColor(tag) : '#fff',
                    color: isActive ? '#333' : '#888',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {filteredRecipes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#aaa',
              fontSize: 15,
            }}
          >
            暂无配方，点击上方按钮保存当前烧杯状态
          </div>
        ) : (
          <div
            style={{
              columnCount: 2,
              columnGap: 16,
            }}
          >
            {filteredRecipes.map((recipe, idx) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={idx}
                onClick={() => store.selectRecipe(recipe.id)}
                onDelete={() => store.deleteRecipe(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => store.selectRecipe(null)}
        />
      )}
    </div>
  );
}
