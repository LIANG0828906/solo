import { useState, useEffect } from 'react';
import type { RobotPose, LegPose } from '../types';

const JOINT_LABELS: { key: keyof LegPose; label: string }[] = [
  { key: 'coxa', label: '基节 Coxa' },
  { key: 'femur', label: '股节 Femur' },
  { key: 'tibia', label: '胫节 Tibia' },
];

const LEG_NAMES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: '#10B981',
        color: '#F8FAFC',
        padding: '8px 16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        animation: 'toastFade 2.5s ease-out forwards',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {message}
    </div>
  );
}

interface ControlPanelProps {
  pose: RobotPose;
  selectedLeg: number | null;
  onSelectLeg: (index: number | null) => void;
  onJointChange: (legIndex: number, joint: keyof LegPose, value: number) => void;
  onResetPose: () => void;
  onSavePose: () => Promise<string | null>;
}

export default function ControlPanel({
  pose,
  selectedLeg,
  onSelectLeg,
  onJointChange,
  onResetPose,
  onSavePose,
}: ControlPanelProps) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [flashing, setFlashing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes valueFlash {
        0% { color: #F59E0B; }
        100% { color: #F8FAFC; }
      }
      @keyframes ringPulse {
        0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
        100% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0); }
      }
      @keyframes toastFade {
        0% { opacity: 0; transform: translateY(-8px); }
        10% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-4px); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        flex: 1;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: #475569;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #818CF8;
        margin-top: -6px;
        transition: all 0.2s ease-out;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        background: #A5B4FC;
        transform: scale(1.15);
      }
      input[type="range"]::-moz-range-track {
        height: 6px;
        border-radius: 3px;
        background: #475569;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #818CF8;
        border: none;
        transition: all 0.2s ease-out;
      }
      input[type="range"]::-moz-range-thumb:hover {
        background: #A5B4FC;
        transform: scale(1.15);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleJointChange = (legIndex: number, joint: keyof LegPose, value: number) => {
    onJointChange(legIndex, joint, value);
    const key = `${legIndex}-${joint}`;
    setFlashing((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setFlashing((prev) => ({ ...prev, [key]: false }));
    }, 150);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const id = await onSavePose();
    if (id) {
      setSavedId(id);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        width: '320px',
        minWidth: '320px',
        height: '100%',
        background: '#1E293B',
        borderRadius: '12px',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        position: 'relative',
        borderRight: '1px solid #334155',
      }}
    >
      <Toast message="姿态已保存" visible={toastVisible} />

      <h2
        style={{
          margin: '0 0 16px 0',
          color: '#F8FAFC',
          fontSize: '18px',
          fontFamily: 'monospace',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        灵巧六足仿真器
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#CBD5E1',
            marginBottom: '10px',
          }}
        >
          选择腿部
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}
        >
          {LEG_NAMES.map((name, i) => {
            const isSelected = selectedLeg === i;
            return (
              <button
                key={i}
                onClick={() => onSelectLeg(isSelected ? null : i)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSelected ? '#6366F1' : '#334155',
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                  animation: isSelected ? 'ringPulse 0.6s ease-out' : 'none',
                  boxShadow: isSelected
                    ? '0 0 0 2px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(99, 102, 241, 0.3)'
                    : 'none',
                  justifySelf: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#475569';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#334155';
                  }
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedLeg !== null && (
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#CBD5E1',
              marginBottom: '12px',
            }}
          >
            {LEG_NAMES[selectedLeg]} 关节控制
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {JOINT_LABELS.map(({ key, label }) => {
              const value = pose.legs[selectedLeg][key];
              const flashKey = `${selectedLeg}-${key}`;
              const isFlashing = flashing[flashKey];
              return (
                <div key={key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: '#CBD5E1',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: '#F8FAFC',
                        animation: isFlashing ? 'valueFlash 0.15s ease-out' : 'none',
                        minWidth: '40px',
                        textAlign: 'right',
                      }}
                    >
                      {Math.round(value)}°
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={value}
                      onChange={(e) =>
                        handleJointChange(selectedLeg, key, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedLeg === null && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}
        >
          请选择一条腿部进行控制
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onResetPose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#10B981',
            color: '#F8FAFC',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#34D399';
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#10B981';
            (e.currentTarget as HTMLButtonElement).style.filter = 'none';
          }}
        >
          重置姿态
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: saving ? '#1E40AF' : '#3B82F6',
            color: '#F8FAFC',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-out',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              (e.currentTarget as HTMLButtonElement).style.background = '#60A5FA';
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
              (e.currentTarget as HTMLButtonElement).style.filter = 'none';
            }
          }}
        >
          {saving ? '保存中...' : '保存姿态'}
        </button>
        {savedId && (
          <div
            style={{
              background: '#0F172A',
              borderRadius: '8px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#E2E8F0',
              wordBreak: 'break-all',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            ID: {savedId}
          </div>
        )}
      </div>
    </div>
  );
}
