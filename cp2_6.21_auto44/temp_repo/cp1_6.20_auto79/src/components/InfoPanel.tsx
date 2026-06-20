import React from 'react';
import type { ModelData } from '../types';
import { Info, Triangle, X } from 'lucide-react';
import { calculateTriangleAreaUV } from '../utils/uvUnwrapper';

interface InfoPanelProps {
  modelData: ModelData | null;
  selectedFaceIndices: number[];
  onDeselectFace: (index: number) => void;
  onClearSelection: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  modelData,
  selectedFaceIndices,
  onDeselectFace,
  onClearSelection,
}) => {
  if (!modelData || selectedFaceIndices.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          background: 'rgba(30, 30, 60, 0.6)',
          borderRadius: '8px',
          border: '1px solid rgba(100, 100, 150, 0.2)',
          color: '#666688',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Info size={16} />
        点击模型或UV图中的面片以查看详情
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(30, 30, 60, 0.6)',
        borderRadius: '8px',
        border: '1px solid rgba(100, 100, 150, 0.2)',
        overflow: 'hidden',
        maxHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 212, 255, 0.1)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Triangle size={16} style={{ color: '#00d4ff' }} />
          <span style={{ color: '#00d4ff', fontWeight: 500, fontSize: '13px' }}>
            已选择 {selectedFaceIndices.length} 个面片
          </span>
        </div>
        {selectedFaceIndices.length > 0 && (
          <button
            onClick={onClearSelection}
            style={{
              background: 'none',
              border: 'none',
              color: '#8888aa',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff4757';
              e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8888aa';
              e.currentTarget.style.background = 'none';
            }}
          >
            清除全部
          </button>
        )}
      </div>

      <div
        style={{
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {selectedFaceIndices.map((faceIndex) => {
          const face = modelData.faces[faceIndex];
          if (!face) return null;

          const uv0 = modelData.uvs[face.uvIndices[0]];
          const uv1 = modelData.uvs[face.uvIndices[1]];
          const uv2 = modelData.uvs[face.uvIndices[2]];
          const area = calculateTriangleAreaUV(uv0, uv1, uv2);

          return (
            <div
              key={faceIndex}
              style={{
                padding: '10px 12px',
                marginBottom: '6px',
                background: 'rgba(40, 40, 70, 0.6)',
                borderRadius: '6px',
                borderLeft: `3px solid ${face.color}`,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: '#ccccdd', fontSize: '13px', fontWeight: 500 }}>
                  面片 #{faceIndex}
                </span>
                <button
                  onClick={() => onDeselectFace(faceIndex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666688',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff4757';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#666688';
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <span
                  style={{
                    color: '#8888aa',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  UV 坐标
                </span>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#aaaacc',
                    marginTop: '4px',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '2px',
                  }}
                >
                  {face.uvIndices.map((uvIdx, i) => {
                    const uv = modelData.uvs[uvIdx];
                    return (
                      <div key={i} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#666688' }}>v{i}:</span>
                        <span>
                          ({uv.u.toFixed(4)}, {uv.v.toFixed(4)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8888aa', fontSize: '11px' }}>UV 面积</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#00d4ff',
                    fontWeight: 500,
                  }}
                >
                  {area.toFixed(6)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
