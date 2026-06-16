import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import NoteItem from './NoteItem';

interface Props {
  recipeId: string;
}

export default function RecipeDetail({ recipeId }: Props) {
  const navigate = useNavigate();
  const recipes = useRecipeStore(state => state.recipes);
  const pantry = useRecipeStore(state => state.pantry);
  const addNote = useRecipeStore(state => state.addNote);
  const deleteNote = useRecipeStore(state => state.deleteNote);
  const updateNote = useRecipeStore(state => state.updateNote);
  const getAverageRating = useRecipeStore(state => state.getAverageRating);

  const { id } = useParams();
  const actualId = recipeId || id || '';
  const recipe = recipes.find(r => r.id === actualId);

  const [newNote, setNewNote] = useState('');
  const [newRating, setNewRating] = useState(3);

  const avgRating = useMemo(() => recipe ? getAverageRating(recipe.id) : 0, [recipe, getAverageRating]);

  const matchInfo = useMemo(() => {
    if (!recipe) return { percentage: 0, canMake: false, matched: [], missing: [] };
    const matched: string[] = [];
    const missing: string[] = [];
    let canMake = true;
    for (const ri of recipe.ingredients) {
      const p = pantry.find(x => x.name.toLowerCase() === ri.name.toLowerCase());
      if (p) {
        matched.push(ri.name);
        if (p.quantity < ri.quantity) canMake = false;
      } else {
        missing.push(ri.name);
        canMake = false;
      }
    }
    const percentage = recipe.ingredients.length > 0
      ? Math.round((matched.length / recipe.ingredients.length) * 100)
      : 0;
    return { percentage, canMake, matched, missing };
  }, [recipe, pantry]);

  if (!recipe) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>食谱不存在</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: 16, padding: '8px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
        >
          返回主页
        </button>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(recipe.id, newNote.trim(), newRating);
    setNewNote('');
    setNewRating(3);
  };

  const renderStars = (count: number, interactive = false, onChange?: (v: number) => void, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 10; i++) {
      const v = i / 2;
      const filled = count >= v;
      stars.push(
        <span
          key={i}
          style={{
            fontSize: size,
            color: filled ? '#F4A261' : '#E0D5C7',
            cursor: interactive ? 'pointer' : 'default',
            display: 'inline-block',
            width: size,
            overflow: 'hidden',
            lineHeight: 1
          }}
          onClick={() => interactive && onChange && onChange(v)}
        >
          {filled ? '★' : '☆'}
        </span>
      );
    }
    return <span style={{ display: 'inline-flex', lineHeight: 1 }}>{stars}</span>;
  };

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← 返回
      </button>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <img
            src={recipe.photoUrl}
            alt={recipe.name}
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-color)', aspectRatio: '4/3', objectFit: 'cover' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--bg-sidebar)', color: 'var(--text-secondary)', borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              {recipe.category}
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {recipe.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>难度</span>
                {renderStars(recipe.difficulty)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>⏱</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{recipe.estimatedTime} 分钟</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {renderStars(avgRating, false, undefined, 14)}
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {avgRating > 0 ? `${avgRating} / 5 (${recipe.notes.length}条)` : '暂无评分'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid rgba(212, 163, 115, 0.3)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              📊 食材匹配度
            </h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {matchInfo.canMake ? '✓ 可以制作！' : `还缺 ${matchInfo.missing.length} 种食材`}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: matchInfo.canMake ? 'var(--success)' : 'var(--accent)' }}>
                  {matchInfo.percentage}%
                </span>
              </div>
              <div style={{ height: 10, background: '#E0D5C7', borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${matchInfo.percentage}%`,
                    background: matchInfo.canMake
                      ? 'linear-gradient(90deg, #2A9D8F, #52B788)'
                      : 'linear-gradient(90deg, #E63946, #F4A261)',
                    borderRadius: 5,
                    transition: 'width 300ms ease-out'
                  }}
                />
              </div>
            </div>
            {matchInfo.matched.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✓ 已有：</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{matchInfo.matched.join('、')}</span>
              </div>
            )}
            {matchInfo.missing.length > 0 && (
              <div>
                <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>✗ 缺少：</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{matchInfo.missing.join('、')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            🧾 食材清单
          </h2>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 163, 115, 0.3)', overflow: 'hidden' }}>
            {recipe.ingredients.map((ing, idx) => {
              const has = pantry.find(p => p.name.toLowerCase() === ing.name.toLowerCase());
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: idx < recipe.ingredients.length - 1 ? '1px solid rgba(212, 163, 115, 0.2)' : 'none',
                    background: has ? 'rgba(42, 157, 143, 0.05)' : 'transparent'
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {has ? '✓ ' : '○ '}{ing.name}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            👨‍🍳 制作步骤
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recipe.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{
                  flex: 1, background: '#fff', borderRadius: 'var(--radius-sm)',
                  padding: 12, border: '1px solid rgba(212, 163, 115, 0.3)',
                  fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7
                }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          📝 我的制作笔记
        </h2>

        <div style={{
          background: '#fff', borderRadius: 'var(--radius-md)',
          padding: 20, border: '1px solid rgba(212, 163, 115, 0.3)', marginBottom: 20
        }}>
          <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
            添加新笔记
          </h4>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value.slice(0, 500))}
            maxLength={500}
            placeholder="记录你的制作心得、调整建议、品尝感受..."
            rows={3}
            style={{ width: '100%', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>评分：</span>
              {renderStars(newRating, true, setNewRating, 22)}
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{newRating} 星</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{newNote.length}/500</span>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                style={{
                  padding: '8px 20px', background: newNote.trim() ? 'var(--accent)' : '#CCC',
                  color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
                  cursor: newNote.trim() ? 'pointer' : 'not-allowed'
                }}
                onMouseEnter={e => { if (newNote.trim()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={e => { if (newNote.trim()) e.currentTarget.style.background = 'var(--accent)'; }}
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recipe.notes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 14 }}>
              还没有笔记，制作后记录下你的心得吧！
            </p>
          ) : (
            recipe.notes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                onDelete={() => deleteNote(recipe.id, note.id)}
                onUpdate={updates => updateNote(recipe.id, note.id, updates)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
