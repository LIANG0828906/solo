import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Settings, Volume2, Gauge, Scissors } from 'lucide-react';
import type { Clip, Material } from '../../types';
import { formatTime, clamp } from '../../utils/time';
import './PropertyEditor.css';

interface PropertyEditorProps {
  clip: Clip | null;
  material: Material | null;
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const useAnimatedValue = (targetValue: number, duration: number = 150) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (targetValue === targetValueRef.current) return;

    startValueRef.current = displayValue;
    targetValueRef.current = targetValue;
    startTimeRef.current = performance.now();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeProgress;
      
      setDisplayValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, displayValue]);

  return displayValue;
};

const PropertyEditor: React.FC<PropertyEditorProps> = ({
  clip,
  material,
  onClipUpdate,
  collapsed,
  onToggleCollapse,
}) => {
  const [localVolume, setLocalVolume] = useState(100);
  const [localSpeed, setLocalSpeed] = useState(1);
  const [localInPoint, setLocalInPoint] = useState(0);
  const [localOutPoint, setLocalOutPoint] = useState(0);

  const animatedVolume = useAnimatedValue(localVolume, 150);
  const animatedSpeed = useAnimatedValue(localSpeed, 150);
  const animatedInPoint = useAnimatedValue(localInPoint, 150);
  const animatedOutPoint = useAnimatedValue(localOutPoint, 150);

  useEffect(() => {
    if (clip) {
      setLocalVolume(clip.volume);
      setLocalSpeed(clip.playbackRate);
      setLocalInPoint(clip.inPoint);
      setLocalOutPoint(clip.outPoint);
    }
  }, [clip]);

  const handleVolumeChange = useCallback((value: number) => {
    if (!clip) return;
    setLocalVolume(value);
    onClipUpdate(clip.id, { volume: value });
  }, [clip, onClipUpdate]);

  const handleSpeedChange = useCallback((value: number) => {
    if (!clip || !material) return;
    setLocalSpeed(value);
    
    const duration = (clip.outPoint - clip.inPoint) / value;
    onClipUpdate(clip.id, {
      playbackRate: value,
      endTime: clip.startTime + duration,
    });
  }, [clip, material, onClipUpdate]);

  const handleInPointChange = useCallback((value: number) => {
    if (!clip || !material) return;
    const clampedValue = clamp(value, 0, clip.outPoint - 0.2);
    setLocalInPoint(clampedValue);
    
    const duration = (clip.outPoint - clampedValue) / clip.playbackRate;
    onClipUpdate(clip.id, {
      inPoint: clampedValue,
      endTime: clip.startTime + duration,
    });
  }, [clip, material, onClipUpdate]);

  const handleOutPointChange = useCallback((value: number) => {
    if (!clip || !material) return;
    const clampedValue = clamp(value, clip.inPoint + 0.2, material.duration);
    setLocalOutPoint(clampedValue);
    
    const duration = (clampedValue - clip.inPoint) / clip.playbackRate;
    onClipUpdate(clip.id, {
      outPoint: clampedValue,
      endTime: clip.startTime + duration,
    });
  }, [clip, material, onClipUpdate]);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const displayDuration = (animatedOutPoint - animatedInPoint) / animatedSpeed;

  return (
    <div 
      className={`property-editor ${collapsed ? 'collapsed' : ''}`}
      style={{ width: collapsed ? '48px' : '25%' }}
    >
      <div className="panel-header">
        {!collapsed && (
          <div className="panel-title">
            <Settings size={18} />
            <span>属性编辑</span>
          </div>
        )}
        <button className="collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="property-content">
          {!clip ? (
            <div className="empty-state">
              <Settings size={48} opacity={0.3} />
              <p>未选中剪辑</p>
              <span>点击时间线上的剪辑以编辑属性</span>
            </div>
          ) : (
            <div className="property-list">
              <div className="property-section">
                <div className="section-header">
                  <span className="section-title">素材信息</span>
                </div>
                <div className="info-row">
                  <span className="info-label">名称</span>
                  <span className="info-value" title={material?.name}>
                    {material?.name || '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">分辨率</span>
                  <span className="info-value">
                    {material ? `${material.width}×${material.height}` : '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">原始时长</span>
                  <span className="info-value">
                    {material ? formatTime(material.duration) : '-'}
                  </span>
                </div>
              </div>

              <div className="property-section">
                <div className="section-header">
                  <Scissors size={16} />
                  <span className="section-title">裁切设置</span>
                </div>
                
                <div className="property-item">
                  <div className="property-label">
                    <span>起始点</span>
                    <span className="value-display value-animate">{formatTime(animatedInPoint)}</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max={material?.duration || 0}
                      step="0.1"
                      value={localInPoint}
                      onChange={(e) => handleInPointChange(Number(e.target.value))}
                      className="property-slider"
                    />
                    <div
                      className="slider-track"
                      style={{
                        left: 0,
                        width: `${(animatedInPoint / (material?.duration || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="property-item">
                  <div className="property-label">
                    <span>结束点</span>
                    <span className="value-display value-animate">{formatTime(animatedOutPoint)}</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max={material?.duration || 0}
                      step="0.1"
                      value={localOutPoint}
                      onChange={(e) => handleOutPointChange(Number(e.target.value))}
                      className="property-slider"
                    />
                    <div
                      className="slider-track"
                      style={{
                        left: 0,
                        width: `${(animatedOutPoint / (material?.duration || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="duration-preview">
                  <span>剪辑时长</span>
                  <strong className="value-animate">{formatTime(displayDuration)}</strong>
                </div>
              </div>

              <div className="property-section">
                <div className="section-header">
                  <Volume2 size={16} />
                  <span className="section-title">音量</span>
                </div>
                <div className="property-item">
                  <div className="property-label">
                    <span>音量</span>
                    <span className="value-display value-animate">{Math.round(animatedVolume)}%</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localVolume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="property-slider"
                    />
                    <div
                      className="slider-track volume"
                      style={{ width: `${animatedVolume}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="property-section">
                <div className="section-header">
                  <Gauge size={16} />
                  <span className="section-title">播放速度</span>
                </div>
                <div className="speed-options">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      className={`speed-btn ${localSpeed === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <div className="property-item">
                  <div className="property-label">
                    <span>自定义速度</span>
                    <span className="value-display value-animate">{animatedSpeed.toFixed(2)}x</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={localSpeed}
                      onChange={(e) => handleSpeedChange(Number(e.target.value))}
                      className="property-slider"
                    />
                    <div
                      className="slider-track speed"
                      style={{ width: `${((animatedSpeed - 0.5) / 1.5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(PropertyEditor);
