import React, { useState, useRef, useEffect } from 'react';
import { Settings, GraduationCap, X, Trash2, Save, RefreshCcw, Sparkles, Circle, Triangle, Move, Zap, Plus, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from './store';
import {
  GESTURE_LABELS,
  ANIMATION_LABELS,
  GestureType,
  AnimationType,
  CustomTemplate,
  CANVAS_CONFIG,
  MAX_CUSTOM_TEMPLATES,
  GESTURE_TYPE_VALUES,
  ANIMATION_TYPE_VALUES,
} from './types';

interface ToolbarProps {
  onClear?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onClear }) => {
  const { toggleSettings, toggleTrainingMode, isTrainingMode } = useAppStore();

  return (
    <div className="gesture-toolbar">
      <div className="toolbar-left">
        <div className="app-logo">
          <Sparkles size={22} color="#00FFAA" />
          <span>Gesture Studio</span>
        </div>
        <div className="app-subtitle">绘制手势 · 触发动画</div>
      </div>
      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${isTrainingMode ? 'active' : ''}`}
          onClick={toggleTrainingMode}
          title="训练模式"
        >
          <GraduationCap size={18} />
          <span>训练</span>
        </button>
        <button className="toolbar-btn" onClick={onClear} title="清除画布">
          <RefreshCcw size={18} />
          <span>清除</span>
        </button>
        <button className="toolbar-btn primary" onClick={toggleSettings} title="设置">
          <Settings size={18} />
          <span>设置</span>
        </button>
      </div>
    </div>
  );
};

export const SettingsDrawer: React.FC = () => {
  const {
    isSettingsOpen,
    toggleSettings,
    gestureMappings,
    setGestureMapping,
    resetMappings,
    resetAll,
    customTextForFlash,
    setCustomTextForFlash,
  } = useAppStore();

  return (
    <>
      <div
        className={`drawer-backdrop ${isSettingsOpen ? 'open' : ''}`}
        onClick={toggleSettings}
      />
      <div className={`settings-drawer ${isSettingsOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <Settings size={20} color="#00FFAA" />
            <h2>手势设置</h2>
          </div>
          <button className="icon-btn" onClick={toggleSettings} title="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-content">
          <section className="settings-section">
            <h3>手势 → 动画映射</h3>
            <p className="section-desc">自定义每种手势触发的动画效果</p>
            <div className="mapping-list">
              {(['CIRCLE', 'TRIANGLE', 'S_SHAPE', 'Z_SHAPE'] as GestureType[]).map(
                (gesture) => {
                  const mapping = gestureMappings.find((m) => m.gesture === gesture);
                  return (
                    <div key={gesture} className="mapping-row">
                      <div className="mapping-gesture">
                        <GestureIcon type={gesture} />
                        <span>{GESTURE_LABELS[gesture]}</span>
                      </div>
                      <div className="mapping-arrow">→</div>
                      <select
                        className="mapping-select"
                        value={mapping?.animation || 'NONE'}
                        onChange={(e) =>
                          setGestureMapping(gesture, e.target.value as AnimationType)
                        }
                      >
                        {ANIMATION_TYPE_VALUES.map((anim) => (
                          <option key={anim} value={anim}>
                            {ANIMATION_LABELS[anim]}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="settings-section">
            <h3>闪烁弹窗文本</h3>
            <p className="section-desc">Z形手势触发时显示的自定义文本</p>
            <input
              type="text"
              className="text-input"
              value={customTextForFlash}
              onChange={(e) => setCustomTextForFlash(e.target.value)}
              placeholder="输入弹窗文本..."
              maxLength={40}
            />
          </section>

          <section className="settings-section">
            <h3>手势参考图</h3>
            <div className="gesture-guide">
              {(['CIRCLE', 'TRIANGLE', 'S_SHAPE', 'Z_SHAPE'] as GestureType[]).map((g) => (
                <div key={g} className="gesture-guide-item">
                  <div className="gesture-guide-icon">
                    <GestureIcon type={g} large />
                  </div>
                  <span>{GESTURE_LABELS[g]}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          <button className="btn-ghost" onClick={resetMappings}>
            <RefreshCcw size={14} />
            重置映射
          </button>
          <button className="btn-danger" onClick={resetAll}>
            <Trash2 size={14} />
            全部清除
          </button>
        </div>
      </div>
    </>
  );
};

const GestureIcon: React.FC<{ type: GestureType; large?: boolean }> = ({ type, large }) => {
  const size = large ? 28 : 18;
  const color = '#00FFAA';
  switch (type) {
    case 'CIRCLE':
      return <Circle size={size} color={color} strokeWidth={2} />;
    case 'TRIANGLE':
      return <Triangle size={size} color={color} strokeWidth={2} />;
    case 'S_SHAPE':
      return <Move size={size} color={color} strokeWidth={2} />;
    case 'Z_SHAPE':
      return <Zap size={size} color={color} strokeWidth={2} />;
    case 'CUSTOM':
      return <Sparkles size={size} color="#FF6B6B" strokeWidth={2} />;
    default:
      return <Circle size={size} color="#888" strokeWidth={2} />;
  }
};

interface TrainingPanelProps {
  currentPathPoints: { x: number; y: number; timestamp: number }[];
  onSaveTemplate: (name: string, gestureType: GestureType) => void;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({
  currentPathPoints,
  onSaveTemplate,
}) => {
  const {
    customTemplates,
    removeCustomTemplate,
    matchPercentage,
    trainingSelectedTemplate,
    setTrainingSelectedTemplate,
  } = useAppStore();

  const [templateName, setTemplateName] = useState('');
  const [gestureType, setGestureType] = useState<GestureType>('CUSTOM');
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (saveMsg) {
      const t = setTimeout(() => setSaveMsg(null), 2500);
      return () => clearTimeout(t);
    }
  }, [saveMsg]);

  const handleSave = () => {
    if (currentPathPoints.length < 10) {
      setSaveMsg({ type: 'err', text: '请先在画布上绘制完整手势路径' });
      return;
    }
    if (customTemplates.length >= MAX_CUSTOM_TEMPLATES) {
      setSaveMsg({ type: 'err', text: `最多保存${MAX_CUSTOM_TEMPLATES}个模板` });
      return;
    }
    onSaveTemplate(templateName || `自定义模板${customTemplates.length + 1}`, gestureType);
    setSaveMsg({ type: 'ok', text: '模板保存成功！' });
    setTemplateName('');
  };

  return (
    <div className="training-panel">
      <div className="training-header">
        <div className="training-title">
          <GraduationCap size={18} color="#FF6B6B" />
          <span>手势训练模式</span>
        </div>
        <div className="template-count">
          {customTemplates.length}/{MAX_CUSTOM_TEMPLATES}
        </div>
      </div>

      <div className="match-progress">
        <div className="match-label">
          {trainingSelectedTemplate
            ? `正在匹配: ${trainingSelectedTemplate.name}`
            : '实时匹配度'}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${matchPercentage}%`,
              background:
                matchPercentage > 70
                  ? 'linear-gradient(90deg, #00FFAA, #4ECDC4)'
                  : matchPercentage > 40
                  ? 'linear-gradient(90deg, #FFE66D, #FFB84D)'
                  : 'linear-gradient(90deg, #FF6B6B, #FF4D6D)',
            }}
          />
        </div>
        <div className="match-value">{matchPercentage}%</div>
      </div>

      <div className="save-template-section">
        <div className="field-row">
          <input
            className="text-input"
            placeholder="模板名称..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            maxLength={16}
          />
          <select
            className="mapping-select"
            value={gestureType}
            onChange={(e) => setGestureType(e.target.value as GestureType)}
          >
            {GESTURE_TYPE_VALUES.map((g) => (
              <option key={g} value={g}>
                {GESTURE_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary full-width"
          onClick={handleSave}
          disabled={customTemplates.length >= MAX_CUSTOM_TEMPLATES}
        >
          <Save size={16} />
          保存当前路径为模板
        </button>
        {saveMsg && (
          <div className={`save-msg ${saveMsg.type}`}>{saveMsg.text}</div>
        )}
      </div>

      <div className="template-list-section">
        <div className="section-title-row">
          <h4>
            <ImageIcon size={16} color="#00FFAA" />
            我的模板库
          </h4>
          {trainingSelectedTemplate && (
            <button
              className="text-btn"
              onClick={() => setTrainingSelectedTemplate(null)}
            >
              取消选择
            </button>
          )}
        </div>

        {customTemplates.length === 0 ? (
          <div className="empty-state">
            <Plus size={32} color="#444" />
            <p>暂无自定义模板</p>
            <span>绘制手势后点击保存</span>
          </div>
        ) : (
          <div className="template-grid">
            {customTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                selected={trainingSelectedTemplate?.id === tpl.id}
                onSelect={() => setTrainingSelectedTemplate(tpl)}
                onDelete={() => removeCustomTemplate(tpl.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{
  template: CustomTemplate;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ template, selected, onSelect, onDelete }) => {
  return (
    <div className={`template-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="template-thumb">
        <img src={template.thumbnailData} alt={template.name} />
      </div>
      <div className="template-meta">
        <div className="template-name">{template.name}</div>
        <div className="template-type">{GESTURE_LABELS[template.gestureType]}</div>
      </div>
      <button
        className="template-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="删除模板"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

interface RecognitionBadgeProps {
  gesture: GestureType | null;
  animation: AnimationType | null;
  confidence: number;
}

export const RecognitionBadge: React.FC<RecognitionBadgeProps> = ({
  gesture,
  animation,
  confidence,
}) => {
  if (!gesture || gesture === 'UNKNOWN') return null;
  return (
    <div className="recognition-badge">
      <div className="badge-row">
        <GestureIcon type={gesture} />
        <span className="badge-gesture">{GESTURE_LABELS[gesture]}</span>
        <span className="badge-sep">→</span>
        <span className="badge-animation">{ANIMATION_LABELS[animation || 'NONE']}</span>
      </div>
      <div className="badge-confidence">
        置信度 {(confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
};
