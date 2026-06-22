import React from 'react';
import type { UIParams } from '../types';
import { Upload, Grid3X3, Layers, Square } from 'lucide-react';

interface ControlPanelProps {
  uiParams: UIParams;
  onParamsChange: (params: Partial<UIParams>) => void;
  onFileUpload: (file: File) => void;
  isValid: boolean;
  validationMessage: string;
  fileName: string;
  faceCount: number;
  vertexCount: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  uiParams,
  onParamsChange,
  onFileUpload,
  isValid,
  validationMessage,
  fileName,
  faceCount,
  vertexCount,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 24px',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(100, 100, 150, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 212, 255, 0.3)';
          }}
        >
          <Upload size={16} />
          上传 OBJ 文件
          <input
            type="file"
            accept=".obj"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>

        {fileName && (
          <div style={{ fontSize: '13px', color: '#aaaacc' }}>
            <span style={{ color: '#00d4ff' }}>{fileName}</span>
            <span style={{ margin: '0 8px', color: '#555577' }}>|</span>
            {faceCount} 个面片
            <span style={{ margin: '0 8px', color: '#555577' }}>|</span>
            {vertexCount} 个顶点
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Grid3X3 size={16} style={{ color: '#8888aa' }} />
          <span style={{ fontSize: '13px', color: '#aaaacc', minWidth: '70px' }}>
            棋盘格 {uiParams.checkerboardDensity}x{uiParams.checkerboardDensity}
          </span>
          <input
            type="range"
            min={4}
            max={32}
            step={2}
            value={uiParams.checkerboardDensity}
            onChange={(e) => onParamsChange({ checkerboardDensity: parseInt(e.target.value) })}
            style={{
              width: '100px',
              accentColor: '#00d4ff',
              cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Square size={16} style={{ color: '#8888aa' }} />
          <span style={{ fontSize: '13px', color: '#aaaacc', minWidth: '70px' }}>
            边线 {uiParams.borderWidth}px
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={uiParams.borderWidth}
            onChange={(e) => onParamsChange({ borderWidth: parseInt(e.target.value) })}
            style={{
              width: '80px',
              accentColor: '#00d4ff',
              cursor: 'pointer',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => onParamsChange({ showWireframe: !uiParams.showWireframe })}
        >
          <Layers size={16} style={{ color: uiParams.showWireframe ? '#00d4ff' : '#8888aa' }} />
          <span
            style={{
              fontSize: '13px',
              color: uiParams.showWireframe ? '#00d4ff' : '#aaaacc',
              transition: 'color 0.3s ease',
            }}
          >
            线框
          </span>
          <div
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              background: uiParams.showWireframe ? '#00d4ff' : '#444466',
              position: 'relative',
              transition: 'background 0.3s ease',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: uiParams.showWireframe ? '18px' : '2px',
                transition: 'left 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {!isValid && (
        <div
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(255, 71, 87, 0.15)',
            border: '1px solid rgba(255, 71, 87, 0.5)',
            borderRadius: '6px',
            color: '#ff4757',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'pulse 2s infinite',
          }}
        >
          <span>⚠</span>
          {validationMessage}
        </div>
      )}
    </div>
  );
};
