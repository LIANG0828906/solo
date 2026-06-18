import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaBuilding, FaWind, FaSun, FaExchangeAlt, FaBalanceScale, FaRandom,
} from 'react-icons/fa';
import { LayoutType, SimulationParams } from '../utils/dataTypes';

interface ControlPanelProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  onCompareToggle: () => void;
  compareMode: boolean;
  compareLayout: LayoutType;
  onCompareLayoutChange: (l: LayoutType) => void;
  onRegenerate: () => void;
}

const layoutOptions: { value: LayoutType; label: string; desc: string; icon: string }[] = [
  { value: 'enclosed', label: '围合式', desc: '建筑围绕中心庭院布置', icon: '🏛️' },
  { value: 'row', label: '行列式', desc: '建筑按行列整齐排列', icon: '🏢' },
  { value: 'cluster', label: '点群式', desc: '建筑自由组团分布', icon: '🌆' },
];

const Slider: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, icon, value, min, max, step, unit, onChange }) => {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E0E0E0', fontSize: 13, fontWeight: 500 }}>
          {icon}
          <span>{label}</span>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #3498DB, #2980B9)',
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          color: 'white',
          minWidth: 56,
          textAlign: 'center',
        }}>
          {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}{unit}
        </div>
      </div>
      <div style={{ position: 'relative', height: 24 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0, right: 0,
            height: 6,
            borderRadius: 3,
            background: '#1a252f',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((value - min) / (max - min)) * 100}%`,
              background: 'linear-gradient(90deg, #3498DB, #2980B9)',
              borderRadius: 3,
              transition: 'width 0.2s ease-out',
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: 24,
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            left: `${((value - min) / (max - min)) * 100}%`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(52,152,219,0.6), 0 0 0 3px rgba(52,152,219,0.25)',
            pointerEvents: 'none',
            transition: 'left 0.2s ease-out',
          }}
        />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
        color: '#546E7A',
        fontSize: 10,
      }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onCompareToggle,
  compareMode,
  compareLayout,
  onCompareLayoutChange,
  onRegenerate,
}) => {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: '100%',
        background: '#2C3E50',
        color: 'white',
        padding: '18px 16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '2px 0 20px rgba(0,0,0,0.3)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3498DB #1a252f',
      }}
    >
      <style>{`
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: #1a252f; border-radius: 3px; }
        div::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #3498DB, #2980B9); border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; }
      `}</style>

      <div style={{ marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid rgba(100,181,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3498DB, #2980B9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 12px rgba(52,152,219,0.4)',
          }}>
            🏙️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.3 }}>风环境与热岛</div>
            <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>Urban Wind & Thermal</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          fontSize: 12,
          fontWeight: 700,
          color: '#64B5F6',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          <FaBuilding size={12} />
          <span>街区布局方案</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {layoutOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onParamsChange({ ...params, layout: opt.value })}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: 10,
                border: params.layout === opt.value
                  ? '2px solid #3498DB'
                  : '1px solid rgba(255,255,255,0.08)',
                background: params.layout === opt.value
                  ? 'linear-gradient(135deg, rgba(52,152,219,0.25), rgba(41,128,185,0.15))'
                  : 'rgba(255,255,255,0.03)',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                if (params.layout !== opt.value) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (params.layout !== opt.value) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 22 }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                    {opt.label}
                    {params.layout === opt.value && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        background: 'linear-gradient(135deg, #3498DB, #2980B9)',
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>当前</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#90A4AE', lineHeight: 1.4 }}>{opt.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onRegenerate}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '9px 12px',
            borderRadius: 9,
            border: '1px dashed rgba(100,181,246,0.5)',
            background: 'rgba(52,152,219,0.08)',
            color: '#90CAF9',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,152,219,0.08)';
          }}
        >
          <FaRandom size={11} />
          重新生成建筑高度
        </button>
      </div>

      <div style={{ marginBottom: 22, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
          marginBottom: 14,
          fontSize: 12,
          fontWeight: 700,
          color: '#64B5F6',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          <FaWind size={12} />
          <span>风环境参数</span>
        </div>

        <Slider
          label="风向角度"
          icon={<span style={{ fontSize: 14 }}>🧭</span>}
          value={params.windAngle}
          min={-90}
          max={90}
          step={1}
          unit="°"
          onChange={(v) => onParamsChange({ ...params, windAngle: v })}
        />

        <Slider
          label="平均风速"
          icon={<span style={{ fontSize: 14 }}>💨</span>}
          value={params.windSpeed}
          min={0.5}
          max={12}
          step={0.1}
          unit="m/s"
          onChange={(v) => onParamsChange({ ...params, windSpeed: v })}
        />
      </div>

      <div style={{ marginBottom: 22, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
          marginBottom: 14,
          fontSize: 12,
          fontWeight: 700,
          color: '#64B5F6',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          <FaSun size={12} />
          <span>热环境参数</span>
        </div>

        <Slider
          label="日照强度"
          icon={<span style={{ fontSize: 14 }}>☀️</span>}
          value={params.solarIntensity}
          min={10}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onParamsChange({ ...params, solarIntensity: v })}
        />
      </div>

      <div style={{ paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
          marginBottom: 14,
          fontSize: 12,
          fontWeight: 700,
          color: '#64B5F6',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>
          <FaBalanceScale size={12} />
          <span>方案对比</span>
        </div>

        <button
          onClick={onCompareToggle}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: compareMode
              ? '2px solid #27AE60'
              : '1px solid rgba(255,255,255,0.1)',
            background: compareMode
              ? 'linear-gradient(135deg, rgba(39,174,96,0.3), rgba(22,160,133,0.2))'
              : 'linear-gradient(135deg, rgba(52,152,219,0.15), rgba(41,128,185,0.08))',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            transition: 'all 0.2s ease-out',
            marginBottom: 12,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = compareMode
              ? 'linear-gradient(135deg, rgba(39,174,96,0.4), rgba(22,160,133,0.3))'
              : 'rgba(255,255,255,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = compareMode
              ? 'linear-gradient(135deg, rgba(39,174,96,0.3), rgba(22,160,133,0.2))'
              : 'linear-gradient(135deg, rgba(52,152,219,0.15), rgba(41,128,185,0.08))';
          }}
        >
          <FaExchangeAlt size={13} />
          {compareMode ? '✓ 对比模式已开启' : '开启方案对比'}
        </button>

        {compareMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(39,174,96,0.08)',
              border: '1px solid rgba(39,174,96,0.25)',
            }}
          >
            <div style={{ fontSize: 11, color: '#81C784', fontWeight: 600, marginBottom: 8 }}>
              🅱️ 对比方案布局
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {layoutOptions.map((opt) => {
                const disabled = opt.value === params.layout;
                return (
                  <button
                    key={opt.value}
                    disabled={disabled}
                    onClick={() => !disabled && onCompareLayoutChange(opt.value)}
                    style={{
                      padding: '9px 11px',
                      borderRadius: 8,
                      border: compareLayout === opt.value
                        ? '1.5px solid #27AE60'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: compareLayout === opt.value
                        ? 'rgba(39,174,96,0.2)'
                        : 'rgba(255,255,255,0.03)',
                      opacity: disabled ? 0.35 : 1,
                      color: disabled ? '#607D8B' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && compareLayout !== opt.value) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!disabled && compareLayout !== opt.value) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {disabled && <span style={{ marginLeft: 'auto', fontSize: 9.5, color: '#78909C' }}>与A相同</span>}
                    {compareLayout === opt.value && <span style={{ marginLeft: 'auto', fontSize: 9.5, color: '#81C784' }}>选中</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <div style={{
        marginTop: 26,
        padding: '12px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, color: '#64B5F6', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          💡 使用提示
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, color: '#90A4AE', lineHeight: 1.7 }}>
          <li>拖拽旋转场景，滚轮缩放</li>
          <li>点击建筑查看详细数据</li>
          <li>悬停高亮，点空白取消</li>
          <li>流线/切片切换查看风场</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ControlPanel;
