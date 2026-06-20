import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Card, SKILLS } from '../domain/cardData';

interface CardEditPanelProps {
  card: Card | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onSave: (card: Card) => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const CardEditPanel: React.FC<CardEditPanelProps> = ({ card, position, onClose, onSave }) => {
  const [form, setForm] = useState<Card | null>(null);

  useEffect(() => {
    if (card) {
      setForm({ ...card });
    }
  }, [card]);

  if (!card || !form || !position) {
    return null;
  }

  const panelWidth = 260;
  const panelHeight = 420;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = position.x - panelWidth / 2 + 60;
  let top = position.y - panelHeight - 10;
  if (left < 10) left = 10;
  if (left + panelWidth > vw - 10) left = vw - panelWidth - 10;
  if (top < 10) top = position.y + 180;
  if (top + panelHeight > vh - 10) top = vh - panelHeight - 10;

  const updateField = <K extends keyof Card>(key: K, value: Card[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    if (form) {
      onSave(form);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
          }}
          onClick={onClose}
          onContextMenu={(e) => {
            e.preventDefault();
            onClose();
          }}
        />
        <motion.div
          key={`edit-${card.id}`}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left,
            top,
            width: panelWidth,
            backgroundColor: '#282840',
            borderRadius: 12,
            padding: 16,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid #3A3A55',
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>编辑卡牌</span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                color: '#888',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>名称</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: '#1E1E2E',
                  border: '1px solid #3A3A55',
                  color: '#E0E0E0',
                  fontSize: 13,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>
                费用 (1-10): {form.cost}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.cost}
                onChange={(e) => updateField('cost', clamp(Number(e.target.value), 1, 10))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>
                攻击力 (0-20): {form.attack}
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={form.attack}
                onChange={(e) => updateField('attack', clamp(Number(e.target.value), 0, 20))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>
                防御力 (0-20): {form.defense}
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={form.defense}
                onChange={(e) => updateField('defense', clamp(Number(e.target.value), 0, 20))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>技能效果</label>
              <select
                value={form.skillId ?? ''}
                onChange={(e) => updateField('skillId', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: '#1E1E2E',
                  border: '1px solid #3A3A55',
                  color: '#E0E0E0',
                  fontSize: 13,
                }}
              >
                <option value="">无技能</option>
                {SKILLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {form.skillId && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#AAA', marginBottom: 4 }}>
                  技能参数 (1-10): {form.skillValue}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.skillValue}
                  onChange={(e) => updateField('skillValue', clamp(Number(e.target.value), 1, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 6,
                  backgroundColor: '#3A3A55',
                  color: '#E0E0E0',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A65')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 6,
                  backgroundColor: '#3498DB',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2980B9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498DB')}
              >
                保存
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default CardEditPanel;
