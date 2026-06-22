import React, { useRef, useCallback, useEffect } from 'react';
import DeviceFrame, { DeviceFrameRef } from './DeviceFrame';
import { DeviceConfig, CodePayload, DeviceType, DEVICE_CONFIGS } from './types';

interface PreviewEngineProps {
  code: CodePayload;
  deviceCodes?: Record<DeviceType, CodePayload>;
  onPreviewReady: (deviceType: DeviceType, canvas: HTMLCanvasElement) => void;
  onError: (deviceType: DeviceType, message: string) => void;
  onDeviceClick: (device: DeviceConfig) => void;
  selectedDevice?: DeviceType | null;
}

const PreviewEngine: React.FC<PreviewEngineProps> = ({
  code,
  deviceCodes,
  onPreviewReady,
  onError,
  onDeviceClick,
  selectedDevice
}) => {
  const deviceRefs = useRef<Record<DeviceType, React.RefObject<DeviceFrameRef>>>({
    [DeviceType.MOBILE]: React.createRef<DeviceFrameRef>(),
    [DeviceType.TABLET]: React.createRef<DeviceFrameRef>(),
    [DeviceType.LAPTOP]: React.createRef<DeviceFrameRef>(),
    [DeviceType.DESKTOP_4K]: React.createRef<DeviceFrameRef>()
  });

  const maxWidth = 400;

  const handleScreenshotReady = useCallback((deviceType: DeviceType, canvas: HTMLCanvasElement) => {
    onPreviewReady(deviceType, canvas);
    
    const event = new CustomEvent('preview-updated', {
      detail: { deviceType, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }, [onPreviewReady]);

  const handleError = useCallback((deviceType: DeviceType, message: string) => {
    onError(deviceType, message);
  }, [onError]);

  const handleDeviceClick = useCallback((device: DeviceConfig) => {
    onDeviceClick(device);
    
    const event = new CustomEvent('device-selected', {
      detail: { deviceType: device.type }
    });
    window.dispatchEvent(event);
  }, [onDeviceClick]);

  useEffect(() => {
    const handleThemeChange = () => {
      Object.values(deviceRefs.current).forEach(ref => {
        ref.current?.refresh();
      });
    };

    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  return (
    <div className="preview-engine">
      <h3 className="preview-title">设备预览</h3>
      <div className="device-grid">
        {DEVICE_CONFIGS.map(device => {
          const aspectRatio = device.width / device.height;
          const displayWidth = Math.min(maxWidth, device.width / 6);
          const displayHeight = displayWidth / aspectRatio;
          const currentCode = deviceCodes?.[device.type] || code;

          return (
            <div
              key={device.type}
              className={`device-thumbnail ${selectedDevice === device.type ? 'selected' : ''}`}
              onClick={() => handleDeviceClick(device)}
              style={{
                '--aspect-ratio': `${device.width} / ${device.height}`
              } as React.CSSProperties}
            >
              <div className="device-canvas-container" style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`
              }}>
                <DeviceFrame
                  ref={deviceRefs.current[device.type]}
                  device={device}
                  code={currentCode}
                  onScreenshotReady={(canvas) => handleScreenshotReady(device.type, canvas)}
                  onError={(message) => handleError(device.type, message)}
                />
              </div>
              <div className="device-label">{device.name}</div>
              <div className="device-dimensions">
                {device.width} × {device.height}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviewEngine;
