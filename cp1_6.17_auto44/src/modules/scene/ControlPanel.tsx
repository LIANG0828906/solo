import React, { useState, useRef } from 'react';
import { Slider, Button, Radio, message } from 'antd';
import {
  ReloadOutlined,
  CameraOutlined,
  PictureOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store/useStore';
import './ControlPanel.css';

const ControlPanel: React.FC = () => {
  const rotationSpeed = useStore((s) => s.rotationSpeed);
  const nodeSpacing = useStore((s) => s.nodeSpacing);
  const trajectoryOpacity = useStore((s) => s.trajectoryOpacity);
  const cameraView = useStore((s) => s.cameraView);
  const setRotationSpeed = useStore((s) => s.setRotationSpeed);
  const setNodeSpacing = useStore((s) => s.setNodeSpacing);
  const setTrajectoryOpacity = useStore((s) => s.setTrajectoryOpacity);
  const setCameraView = useStore((s) => s.setCameraView);
  const resetView = useStore((s) => s.resetView);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const [exportTimestamp, setExportTimestamp] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleExportScreenshot = () => {
    const canvas = document.querySelector('.scene-container canvas');
    if (canvas) {
      try {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `browsing-trajectory-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setExportTimestamp(formatTimestamp());
        message.success('截图已导出');
      } catch (e) {
        message.error('导出失败');
      }
    } else {
      message.error('未找到画布');
    }
  };

  const handleExportJSON = () => {
    const data = {
      nodes: nodes.map((n) => ({
        id: n.id,
        url: n.url,
        title: n.title,
        position: n.position,
        duration: n.duration,
        visitCount: n.visitCount,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        from: e.from,
        to: e.to,
        order: e.order,
        duration: e.duration,
      })),
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `trajectory-config-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setExportTimestamp(formatTimestamp());
    message.success('JSON 配置已导出');
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <span className="panel-title">场景控制</span>
      </div>

      <div className="control-content">
        <div className="control-section">
          <div className="control-label">
            <CameraOutlined style={{ color: '#E94560', marginRight: 6 }} />
            旋转速度
          </div>
          <Slider
            min={0}
            max={200}
            value={rotationSpeed}
            onChange={setRotationSpeed}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
          <div className="control-value">{rotationSpeed}%</div>
        </div>

        <div className="control-section">
          <div className="control-label">
            <span style={{ color: '#533483', marginRight: 6 }}>◆</span>
            节点间距
          </div>
          <Slider
            min={80}
            max={200}
            value={nodeSpacing}
            onChange={setNodeSpacing}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
          <div className="control-value">{nodeSpacing}%</div>
        </div>

        <div className="control-section">
          <div className="control-label">
            <span style={{ color: '#0F3460', marginRight: 6 }}>—</span>
            轨迹透明度
          </div>
          <Slider
            min={0}
            max={100}
            value={trajectoryOpacity}
            onChange={setTrajectoryOpacity}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
          <div className="control-value">{trajectoryOpacity}%</div>
        </div>

        <div className="control-section">
          <div className="control-label">视角模式</div>
          <Radio.Group
            value={cameraView}
            onChange={(e) => setCameraView(e.target.value)}
            size="small"
            style={{ width: '100%' }}
          >
            <Radio.Button value="top" style={radioButtonStyle}>
              俯视
            </Radio.Button>
            <Radio.Button value="free" style={radioButtonStyle}>
              自由旋转
            </Radio.Button>
          </Radio.Group>
        </div>

        <div className="control-section">
          <Button
            icon={<ReloadOutlined />}
            onClick={resetView}
            block
            style={resetButtonStyle}
          >
            重置视图
          </Button>
        </div>

        <div className="control-divider" />

        <div className="control-section">
          <div className="control-label">导出</div>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={handleExportScreenshot}
              title="导出 PNG 截图"
            >
              <PictureOutlined />
            </button>
            <button
              className="export-btn"
              onClick={handleExportJSON}
              title="导出 JSON 配置"
            >
              <FileTextOutlined />
            </button>
          </div>
          {exportTimestamp && (
            <div className="export-timestamp">上次导出: {exportTimestamp}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const radioButtonStyle: React.CSSProperties = {
  background: '#16213E',
  borderColor: '#0F3460',
  color: '#8E8E9A',
  width: '50%',
  textAlign: 'center',
};

const resetButtonStyle: React.CSSProperties = {
  background: '#E94560',
  border: 'none',
  color: '#fff',
  borderRadius: 8,
};

export default ControlPanel;
