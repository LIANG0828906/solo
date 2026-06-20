import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../store/editorStore';
import type { ChartSeries } from '../types';

interface ChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChartDialog: React.FC<ChartDialogProps> = ({ isOpen, onClose }) => {
  const { addComponent, theme } = useEditorStore();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [title, setTitle] = useState('数据图表');
  const [series, setSeries] = useState<ChartSeries[]>([
    { name: '系列1', value: 100 },
    { name: '系列2', value: 80 },
    { name: '系列3', value: 60 },
  ]);

  if (!isOpen) return null;

  const handleAddSeries = () => {
    if (series.length >= 5) return;
    setSeries([...series, { name: `系列${series.length + 1}`, value: 50 }]);
  };

  const handleRemoveSeries = (index: number) => {
    if (series.length <= 1) return;
    setSeries(series.filter((_, i) => i !== index));
  };

  const handleSeriesChange = (index: number, field: 'name' | 'value', value: string | number) => {
    const newSeries = [...series];
    newSeries[index] = { ...newSeries[index], [field]: value };
    setSeries(newSeries);
  };

  const handleConfirm = () => {
    const newComponent = {
      id: uuidv4(),
      type: 'chart' as const,
      x: 400,
      y: 250,
      width: 400,
      height: 300,
      rotation: 0,
      opacity: 1,
      borderRadius: 8,
      style: {
        fillColor: '#ffffff',
        fillColorIndex: 0,
      },
      data: {
        title,
        type: chartType,
        series,
      },
    };
    addComponent(newComponent);
    onClose();
  };

  const chartTypes: { value: 'bar' | 'line' | 'pie'; label: string; icon: string }[] = [
    { value: 'bar', label: '柱状图', icon: '📊' },
    { value: 'line', label: '折线图', icon: '📈' },
    { value: 'pie', label: '饼图', icon: '🥧' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>添加数据图表</div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#666',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 12 }}>
              图表类型
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {chartTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChartType(type.value)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: chartType === type.value ? '2px solid #2196f3' : '2px solid #e0e0e0',
                    borderRadius: 8,
                    backgroundColor: chartType === type.value ? '#e8f0fe' : '#fafafa',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{type.icon}</span>
                  <span style={{ fontSize: 13, color: chartType === type.value ? '#2196f3' : '#666' }}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>
              图表标题
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入图表标题"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                数据系列 ({series.length}/5)
              </div>
              <button
                onClick={handleAddSeries}
                disabled={series.length >= 5}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  border: '1px solid #2196f3',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  borderRadius: 6,
                  cursor: series.length >= 5 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  opacity: series.length >= 5 ? 0.5 : 1,
                }}
              >
                <Plus size={14} />
                添加系列
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {series.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#fafafa',
                    borderRadius: 8,
                    border: `1px solid ${theme.colors[index % theme.colors.length]}30`,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: theme.colors[index % theme.colors.length],
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleSeriesChange(index, 'name', e.target.value)}
                    placeholder="系列名称"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleSeriesChange(index, 'value', Number(e.target.value))}
                    placeholder="数值"
                    style={{
                      width: 100,
                      padding: '8px 10px',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleRemoveSeries(index)}
                    disabled={series.length <= 1}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: series.length <= 1 ? 'not-allowed' : 'pointer',
                      color: '#999',
                      padding: 4,
                      opacity: series.length <= 1 ? 0.3 : 1,
                    }}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '20px 24px',
            borderTop: '1px solid #e0e0e0',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              color: '#666',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 24px',
              border: 'none',
              backgroundColor: '#2196f3',
              color: '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            插入图表
          </button>
        </div>
      </div>
    </div>
  );
};
