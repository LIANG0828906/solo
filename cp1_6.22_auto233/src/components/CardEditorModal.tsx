import { useState, useEffect, KeyboardEvent } from 'react';
import { useBoard } from '@/data/cardStore';
import type { Card, CharacterCard, SceneCard, SwatchCard } from '@/data/cardStore';

export default function CardEditorModal() {
  const { state, updateCard, deleteCard, editCard } = useBoard();
  const editingCard = state.cards.find((c) => c.id === state.editingCardId);

  const [formData, setFormData] = useState<Card | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFormData(JSON.parse(JSON.stringify(editingCard)));
      setTagInput('');
    }
  }, [editingCard]);

  if (!editingCard || !formData) return null;

  const handleClose = () => {
    editCard(null);
  };

  const handleSave = () => {
    if (formData) {
      updateCard(formData);
      editCard(null);
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除这张卡片吗？')) {
      deleteCard(editingCard.id);
      editCard(null);
    }
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (formData && !formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (formData) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t) => t !== tag),
      });
    }
  };

  const updateField = (field: string, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const updateColor = (index: number, color: string) => {
    if (formData && formData.type === 'swatch') {
      const newColors = [...formData.colors];
      newColors[index] = color;
      setFormData({ ...formData, colors: newColors });
    }
  };

  const addSwatchColor = () => {
    if (formData && formData.type === 'swatch' && formData.colors.length < 8) {
      setFormData({
        ...formData,
        colors: [...formData.colors, '#A277D1'],
      });
    }
  };

  const removeSwatchColor = (index: number) => {
    if (formData && formData.type === 'swatch' && formData.colors.length > 1) {
      const newColors = formData.colors.filter((_, i) => i !== index);
      setFormData({ ...formData, colors: newColors });
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {formData.type === 'character'
              ? '编辑角色卡片'
              : formData.type === 'scene'
              ? '编辑场景卡片'
              : '编辑色票卡片'}
          </h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="输入卡片标题"
          />
        </div>

        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="输入卡片描述"
            rows={3}
          />
        </div>

        {formData.type === 'character' && (
          <>
            <div className="form-group">
              <label className="form-label">角色颜色</label>
              <div className="color-input-row">
                <div className="color-input-wrapper">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    主色
                  </label>
                  <input
                    type="color"
                    className="form-input"
                    value={(formData as CharacterCard).primaryColor}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    style={{ height: '40px', padding: '4px' }}
                  />
                  <div
                    className="color-preview"
                    style={{ backgroundColor: (formData as CharacterCard).primaryColor }}
                  />
                </div>
                <div className="color-input-wrapper">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    辅色
                  </label>
                  <input
                    type="color"
                    className="form-input"
                    value={(formData as CharacterCard).secondaryColor}
                    onChange={(e) => updateField('secondaryColor', e.target.value)}
                    style={{ height: '40px', padding: '4px' }}
                  />
                  <div
                    className="color-preview"
                    style={{
                      background: `linear-gradient(135deg, ${(formData as CharacterCard).primaryColor}, ${(formData as CharacterCard).secondaryColor})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {formData.type === 'scene' && (
          <div className="form-group">
            <label className="form-label">场景图案种子</label>
            <input
              type="number"
              className="form-input"
              value={(formData as SceneCard).patternSeed}
              onChange={(e) => updateField('patternSeed', parseInt(e.target.value) || 0)}
            />
            <p style={{ fontSize: '12px', color: '#8E8AA3', marginTop: '6px' }}>
              改变数字可以生成不同的几何图案
            </p>
          </div>
        )}

        {formData.type === 'swatch' && (
          <div className="form-group">
            <label className="form-label">色票颜色</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {(formData as SwatchCard).colors.map((color, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      style={{
                        width: '50px',
                        height: '50px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    />
                    {(formData as SwatchCard).colors.length > 1 && (
                      <button
                        onClick={() => removeSwatchColor(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#E57373',
                          color: 'white',
                          border: 'none',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: '#8E8AA3', fontFamily: 'monospace' }}>
                    {color.toUpperCase()}
                  </span>
                </div>
              ))}
              {(formData as SwatchCard).colors.length < 8 && (
                <button
                  onClick={addSwatchColor}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    border: '2px dashed #413D57',
                    background: 'transparent',
                    color: '#8E8AA3',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">标签</label>
          <div className="tags-input-container">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>
                  ✕
                </span>
              </span>
            ))}
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="输入标签后按回车"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleDelete}>
            删除
          </button>
          <button className="btn btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
