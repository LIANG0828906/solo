import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Recipe,
  RecipeStep,
  DyeMaterial,
  mordants,
  fabricTypes,
  blendDyeColors,
  rgbToHex,
} from './data/recipes';

interface RecipeEditorProps {
  recipe: Recipe | null;
  materials: DyeMaterial[];
  onUpdate: (data: Partial<Recipe>) => void;
  onAddStep: (step: RecipeStep) => void;
  onUpdateStep: (stepId: string, updates: Partial<RecipeStep>) => void;
  onRemoveStep: (stepId: string) => void;
  isDirty: boolean;
  onSave: () => void;
}

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

const emptyStep = (material: DyeMaterial): RecipeStep => ({
  id: uuidv4(),
  materialId: material.id,
  materialName: material.name,
  weightGrams: 10,
  mordantName: material.type === 'direct' ? '无媒染' : material.type === 'reductive' ? '石灰' : '明矾',
  mordantConcentration: material.type === 'direct' ? 0 : material.type === 'reductive' ? 8 : 10,
  duration: 45,
  temperature: 75,
});

const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipe,
  materials,
  onUpdate,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  isDirty,
  onSave,
}) => {
  const [localPreview, setLocalPreview] = useState(blendDyeColors([], materials));

  useEffect(() => {
    setLocalPreview(blendDyeColors(recipe?.steps || [], materials));
  }, [recipe?.steps, materials]);

  const previewColor = useMemo(
    () => rgbToHex(localPreview.mainColor.r, localPreview.mainColor.g, localPreview.mainColor.b),
    [localPreview]
  );

  if (!recipe) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">配方编辑器</span>
        </div>
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🎨</div>
          <div className="empty-state-title">选择或创建配方</div>
          <div className="empty-state-desc">
            从左侧列表选择已有配方，<br />
            或点击「新建配方」开始你的植物染色之旅
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">配方编辑器</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            className="color-preview-inline"
            style={{ background: previewColor }}
            title={previewColor}
          />
          <button
            className={`btn ${isDirty ? 'btn-primary' : 'btn-ghost'}`}
            onClick={(e) => {
              addRipple(e);
              onSave();
            }}
          >
            {isDirty ? '💾 保存修改' : '✓ 已保存'}
          </button>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">配方名称</label>
        <div className="form-input-wrap">
          <input
            className="form-input"
            value={recipe.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="例如：茜草复古红"
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">配方描述</label>
        <textarea
          className="form-textarea"
          value={recipe.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="描述这个配方的特点、适用面料和染色效果..."
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">染色类型</label>
          <select
            className="form-select"
            value={recipe.dyeType}
            onChange={(e) => onUpdate({ dyeType: e.target.value as Recipe['dyeType'] })}
          >
            <option value="direct">直接染</option>
            <option value="mordant">媒染</option>
            <option value="reductive">还原染</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">适用面料</label>
          <select
            className="form-select"
            value={recipe.fabricType}
            onChange={(e) => onUpdate({ fabricType: e.target.value })}
          >
            {fabricTypes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">染色步骤</label>
        <div className="steps-container">
          {recipe.steps.map((step, idx) => {
            const mat = materials.find((m) => m.id === step.materialId);
            const stepColor = mat
              ? rgbToHex(mat.defaultColor.r, mat.defaultColor.g, mat.defaultColor.b)
              : '#ccc';
            return (
              <div key={step.id} className="step-card">
                <div className="step-header">
                  <span className="step-title">
                    <span className="step-index">{idx + 1}</span>
                    <div
                      className="color-preview-inline"
                      style={{ background: stepColor }}
                    />
                    染色步骤
                  </span>
                  <button
                    className="step-remove"
                    onClick={(e) => {
                      addRipple(e);
                      if (recipe.steps.length > 1) onRemoveStep(step.id);
                    }}
                    disabled={recipe.steps.length <= 1}
                    title={recipe.steps.length <= 1 ? '至少保留一个步骤' : '删除步骤'}
                  >
                    ✕
                  </button>
                </div>

                <div className="form-field">
                  <label className="form-label">选择染材</label>
                  <select
                    className="form-select"
                    value={step.materialId}
                    onChange={(e) => {
                      const m = materials.find((x) => x.id === e.target.value);
                      if (m) {
                        onUpdateStep(step.id, {
                          materialId: m.id,
                          materialName: m.name,
                        });
                      }
                    }}
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.isCustom ? '(自定义)' : ''} — {m.source}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">用量 (克)</label>
                    <div className="form-input-wrap">
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        step={0.5}
                        value={step.weightGrams}
                        onChange={(e) =>
                          onUpdateStep(step.id, {
                            weightGrams: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">媒染剂</label>
                    <select
                      className="form-select"
                      value={step.mordantName}
                      onChange={(e) => {
                        const mord = mordants.find((m) => m.name === e.target.value);
                        onUpdateStep(step.id, {
                          mordantName: e.target.value,
                          mordantConcentration: mord?.concentration ?? 0,
                        });
                      }}
                    >
                      {mordants.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">
                      媒染浓度 (%)：{step.mordantConcentration}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={step.mordantConcentration}
                      onChange={(e) =>
                        onUpdateStep(step.id, {
                          mordantConcentration: parseFloat(e.target.value),
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">温度 (°C)</label>
                    <div className="form-input-wrap">
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        max={100}
                        value={step.temperature}
                        onChange={(e) =>
                          onUpdateStep(step.id, {
                            temperature: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">染色时长 (分钟)</label>
                  <div className="form-input-wrap">
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      value={step.duration}
                      onChange={(e) =>
                        onUpdateStep(step.id, {
                          duration: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            className="add-step-btn"
            onClick={(e) => {
              addRipple(e);
              onAddStep(emptyStep(materials[0]));
            }}
          >
            ＋ 添加新的染色步骤
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeEditor;
