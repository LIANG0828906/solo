import { useState, useEffect } from 'react';
import { Save, Download, X, Menu, Trash2, Sparkles } from 'lucide-react';
import type { ParticleParams, Preset } from './types';
import { api } from './api';
import './ControlPanel.css';

interface ControlPanelProps {
  params: ParticleParams;
  onChange: (params: ParticleParams) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

const Slider = ({ label, value, min, max, step, onChange, unit = '' }: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
        />
      </div>
    </div>
  );
};

export const ControlPanel = ({ params, onChange }: ControlPanelProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const data = await api.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      setLoading(true);
      await api.createPreset(presetName.trim(), params);
      setPresetName('');
      setShowSaveDialog(false);
      await loadPresets();
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = (preset: Preset) => {
    onChange(preset.params);
    setShowPresets(false);
    if (isMobile) setIsOpen(false);
  };

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deletePreset(id);
      await loadPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const handleParamChange = <K extends keyof ParticleParams>(
    key: K,
    value: ParticleParams[K]
  ) => {
    onChange({ ...params, [key]: value });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const panelContent = (
    <div className="panel-content">
      <div className="panel-header">
        <div className="panel-title">
          <Sparkles className="title-icon" size={20} />
          <span>星系参数</span>
        </div>
        {isMobile && (
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="panel-body">
        <Slider
          label="粒子数量"
          value={params.count}
          min={1000}
          max={20000}
          step={500}
          onChange={(v) => handleParamChange('count', v)}
        />

        <Slider
          label="粒子大小"
          value={params.size}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={(v) => handleParamChange('size', v)}
        />

        <div className="color-group">
          <span className="slider-label">主色调</span>
          <div className="color-picker-wrapper">
            <div 
              className="color-preview" 
              style={{ background: params.color, boxShadow: `0 0 20px ${params.color}40` }}
            />
            <input
              type="color"
              value={params.color}
              onChange={(e) => handleParamChange('color', e.target.value)}
              className="color-picker"
            />
            <span className="color-hex">{params.color.toUpperCase()}</span>
          </div>
        </div>

        <Slider
          label="旋转速度"
          value={params.rotationSpeed}
          min={0.0}
          max={2.0}
          step={0.1}
          onChange={(v) => handleParamChange('rotationSpeed', v)}
        />

        <Slider
          label="扩散半径"
          value={params.spreadRadius}
          min={0.5}
          max={5.0}
          step={0.1}
          onChange={(v) => handleParamChange('spreadRadius', v)}
        />
      </div>

      <div className="panel-footer">
        <button
          className="action-btn save-btn"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save size={16} />
          <span>保存预设</span>
        </button>
        <button
          className="action-btn load-btn"
          onClick={() => {
            loadPresets();
            setShowPresets(true);
          }}
        >
          <Download size={16} />
          <span>加载预设</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button className="mobile-toggle" onClick={() => setIsOpen(true)}>
            <Menu size={24} />
          </button>
          <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
          <div className={`control-panel mobile ${isOpen ? 'open' : ''}`}>
            {panelContent}
          </div>
        </>
      ) : (
        <div className="control-panel desktop">{panelContent}</div>
      )}

      {showPresets && (
        <div className="modal-overlay" onClick={() => setShowPresets(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>预设列表</h3>
              <button className="close-btn" onClick={() => setShowPresets(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading">加载中...</div>
              ) : presets.length === 0 ? (
                <div className="empty">暂无预设</div>
              ) : (
                <div className="preset-list">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="preset-item"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      <div className="preset-info">
                        <div 
                          className="preset-color" 
                          style={{ background: preset.params.color }}
                        />
                        <div className="preset-details">
                          <span className="preset-name">{preset.name}</span>
                          <span className="preset-date">{formatDate(preset.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        title="删除预设"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>保存预设</h3>
              <button className="close-btn" onClick={() => setShowSaveDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="输入预设名称..."
                className="preset-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <button
                className="action-btn save-btn full-width"
                onClick={handleSavePreset}
                disabled={!presetName.trim() || loading}
              >
                {loading ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
