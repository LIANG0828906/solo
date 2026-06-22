import React, { useState } from 'react';
import {
  Form,
  Slider,
  InputNumber,
  Select,
  Switch,
  Typography,
  Space,
  Divider,
  Tooltip
} from 'antd';
import {
  AppstoreOutlined,
  BorderOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  EyeOutlined,
  ExperimentOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNebulaStore, NebulaShape, NebulaParams } from '../store/useNebulaStore';

const { Title, Text } = Typography;

interface FieldProps {
  value?: any;
  onChange?: (value: any) => void;
}

const ControlPanel: React.FC = () => {
  const params = useNebulaStore((s) => s.params);
  const setParam = useNebulaStore((s) => s.setParam);

  const createSliderField = (
    label: string,
    icon: React.ReactNode,
    min: number,
    max: number,
    step: number,
    key: keyof NebulaParams,
    tooltip?: string,
    formatter?: (v: number) => string
  ) => {
    const value = params[key] as number;

    return (
      <Form.Item label={<Space>{icon}<Text style={{ color: '#B0BEC5', fontSize: 13 }}>{label}</Text></Space>}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tooltip title={tooltip}>
            <Slider
              style={{ flex: 1, minWidth: 140 }}
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(v) => setParam(key, v as number)}
              tooltip={{ formatter: (v: any) => (v !== undefined ? (formatter ? formatter(v) : `${v}`) : '') }}
            />
          </Tooltip>
          <InputNumber
            size="small"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(v) => v !== null && setParam(key, Number(v))}
            style={{
              width: 72,
              backgroundColor: 'rgba(0, 212, 255, 0.05)',
              borderColor: 'rgba(0, 212, 255, 0.4)',
              color: '#00D4FF'
            }}
          />
        </div>
      </Form.Item>
    );
  };

  return (
    <div
      style={{
        width: 320,
        height: '100%',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(0, 212, 255, 0.3)',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '4px 0 24px rgba(0, 212, 255, 0.08)',
        animation: 'slideIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.5); }
      `}</style>

      <div style={{ padding: '20px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(136, 0, 255, 0.2))',
              border: '1px solid rgba(0, 212, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ExperimentOutlined style={{ fontSize: 18, color: '#00D4FF' }} />
          </div>
          <div>
            <Title
              level={4}
              style={{
                margin: 0,
                color: '#00D4FF',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 0.5
              }}
            >
              星云控制台
            </Title>
            <Text style={{ color: '#607D8B', fontSize: 11 }}>NEBULA CONTROL PANEL</Text>
          </div>
        </div>

        <Divider style={{ borderColor: 'rgba(0, 212, 255, 0.15)', margin: '16px 0' }} />

        <Form layout="vertical" style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8
            }}
          >
            <SettingOutlined style={{ color: '#00D4FF', fontSize: 13 }} />
            <Text
              style={{
                color: '#00D4FF',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              核心参数
            </Text>
          </div>

          {createSliderField(
            '粒子数量',
            <AppstoreOutlined style={{ color: '#00D4FF' }} />,
            1000,
            50000,
            500,
            'particleCount',
            '控制星云中粒子的总数，数量越多效果越细腻但性能消耗越大',
            (v) => `${v.toLocaleString()} 颗`
          )}

          {createSliderField(
            '粒子大小',
            <BorderOutlined style={{ color: '#00D4FF' }} />,
            0.1,
            1.0,
            0.1,
            'particleSize',
            '基础粒子大小，中心粒子会更大更亮',
            (v) => `${v.toFixed(1)} px`
          )}

          <Form.Item
            label={
              <Space>
                <EyeOutlined style={{ color: '#00D4FF' }} />
                <Text style={{ color: '#B0BEC5', fontSize: 13 }}>星云形状</Text>
              </Space>
            }
          >
            <Select
              value={params.shape}
              onChange={(v: NebulaShape) => setParam('shape', v)}
              options={[
                { value: 'sphere', label: '🌐 球状星云' },
                { value: 'spiral', label: '🌀 螺旋星云' }
              ]}
              style={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                color: '#00D4FF'
              }}
            />
          </Form.Item>

          <Divider style={{ borderColor: 'rgba(0, 212, 255, 0.15)', margin: '8px 0 16px 0' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8
            }}
          >
            <SyncOutlined style={{ color: '#00D4FF', fontSize: 13 }} />
            <Text
              style={{
                color: '#00D4FF',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              动画控制
            </Text>
          </div>

          {createSliderField(
            '旋转速度',
            <SyncOutlined style={{ color: '#00D4FF' }} />,
            0.0,
            1.0,
            0.01,
            'rotationSpeed',
            '粒子整体自转速度',
            (v) => `${(v * 100).toFixed(0)}%`
          )}

          {createSliderField(
            '湍流强度',
            <ThunderboltOutlined style={{ color: '#00D4FF' }} />,
            0.0,
            0.5,
            0.01,
            'turbulence',
            '粒子随机扰动强度，使星云更具动感和自然感',
            (v) => `${(v * 200).toFixed(0)}%`
          )}

          <Divider style={{ borderColor: 'rgba(0, 212, 255, 0.15)', margin: '8px 0 16px 0' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: `linear-gradient(135deg, hsl(${params.hue * 360}, 85%, 55%), hsl(${(params.hue + 0.15) * 360}, 85%, 70%))`
              }}
            />
            <Text
              style={{
                color: '#00D4FF',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              色调配置
            </Text>
          </div>

          <Form.Item label={<Text style={{ color: '#B0BEC5', fontSize: 13 }}>颜色渐变</Text>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HueSlider
                hue={params.hue}
                onChange={(v) => setParam('hue', v)}
              />
              <InputNumber
                size="small"
                min={0}
                max={1}
                step={0.01}
                value={params.hue}
                onChange={(v) => v !== null && setParam('hue', Number(v))}
                style={{
                  width: 72,
                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                  borderColor: 'rgba(0, 212, 255, 0.4)',
                  color: '#00D4FF'
                }}
                formatter={(v) => `${((v || 0) * 360).toFixed(0)}°`}
              />
            </div>
          </Form.Item>

          <div
            style={{
              height: 36,
              borderRadius: 8,
              marginTop: 8,
              border: '1px solid rgba(0, 212, 255, 0.3)',
              background: `linear-gradient(90deg,
                hsl(${params.hue * 360}, 90%, 45%) 0%,
                hsl(${(params.hue + 0.08) * 360}, 85%, 55%) 50%,
                hsl(${(params.hue + 0.15) * 360}, 80%, 70%) 100%)`
            }}
          />

          <Divider style={{ borderColor: 'rgba(0, 212, 255, 0.15)', margin: '20px 0 16px 0' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8
            }}
          >
            <EyeOutlined style={{ color: '#00D4FF', fontSize: 13 }} />
            <Text
              style={{
                color: '#00D4FF',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              视角控制
            </Text>
          </div>

          <Form.Item label={<Text style={{ color: '#B0BEC5', fontSize: 13 }}>自动旋转</Text>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Switch
                checked={params.autoRotate}
                onChange={(v) => setParam('autoRotate', v)}
                style={{
                  backgroundColor: params.autoRotate ? '#00D4FF' : undefined
                }}
              />
              <Text style={{ color: '#607D8B', fontSize: 12 }}>
                {params.autoRotate ? '已开启' : '已关闭'}
              </Text>
            </div>
          </Form.Item>

          {params.autoRotate &&
            createSliderField(
              '相机旋转速度',
              <SyncOutlined style={{ color: '#00D4FF' }} />,
              0.0,
              1.0,
              0.01,
              'autoRotateSpeed',
              '相机绕Y轴自动旋转的速度',
              (v) => `${(v * 100).toFixed(0)}%`
            )}

          <div
            style={{
              marginTop: 24,
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(0, 212, 255, 0.05)',
              border: '1px solid rgba(0, 212, 255, 0.15)'
            }}
          >
            <Text style={{ color: '#607D8B', fontSize: 11, lineHeight: 1.6 }}>
              💡 提示：使用鼠标拖拽旋转视角，滚轮缩放。右下角可快速切换到预设视角。
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

interface HueSliderProps {
  hue: number;
  onChange: (v: number) => void;
}

const HueSlider: React.FC<HueSliderProps> = ({ hue, onChange }) => {
  return (
    <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #ff0044 0%, #ff8800 17%, #ffee00 33%, #00ff88 50%, #00d4ff 67%, #8800ff 83%, #ff0088 100%)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(0, 212, 255, 0.3)'
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const v = Math.max(0, Math.min(1, x / rect.width));
          onChange(v);
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${hue * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `hsl(${hue * 360}, 90%, 55%)`,
            border: '2px solid white',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none'
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={hue}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

export default ControlPanel;
