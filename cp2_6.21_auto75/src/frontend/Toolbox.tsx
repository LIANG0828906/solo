import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import type { CameraType } from '../types';
import { CameraIconSvg, CameraIconMap } from './CameraIcons';

export const Toolbox: React.FC = () => {
  const selectedPanelIdForCamera = useEditorStore((s) => s.selectedPanelIdForCamera);
  const panels = useEditorStore((s) => s.panels);
  const setCameraType = useEditorStore((s) => s.setCameraType);
  const setCameraNote = useEditorStore((s) => s.setCameraNote);

  const selectedPanel = selectedPanelIdForCamera
    ? panels.find((p) => p.id === selectedPanelIdForCamera) ?? null
    : null;

  const currentCamera: CameraType = selectedPanel?.cameraType ?? null;
  const currentNote = selectedPanel?.cameraNote ?? '';

  const handleSelectCamera = (type: CameraType) => {
    if (!selectedPanel) return;
    setCameraType(selectedPanel.id, currentCamera === type ? null : type);
  };

  return (
    <div className="toolbox">
      <div className="toolbox-title">镜头语言工具箱</div>

      {!selectedPanel ? (
        <div className="toolbox-empty">
          请先在画布上
          <br />
          <strong>点击选中一个分镜格子</strong>
          <br />
          再使用镜头工具。
        </div>
      ) : (
        <>
          <div className="toolbox-grid">
            {CameraIconMap.map(({ type, label }) => (
              <button
                key={type}
                className={`toolbox-btn ${currentCamera === type ? 'active' : ''}`}
                onClick={() => handleSelectCamera(type)}
                title={label}
              >
                <CameraIconSvg type={type} size={22} />
                <span className="toolbox-btn-label">{label}</span>
              </button>
            ))}
          </div>

          <textarea
            className="toolbox-note-input"
            placeholder={`输入拍摄说明（最多50字）\n例如：缓慢推进，聚焦主角表情`}
            rows={3}
            maxLength={50}
            value={currentNote}
            onChange={(e) => setCameraNote(selectedPanel.id, e.target.value)}
          />
          <span className="toolbox-note-count">{currentNote.length}/50</span>
        </>
      )}
    </div>
  );
};
