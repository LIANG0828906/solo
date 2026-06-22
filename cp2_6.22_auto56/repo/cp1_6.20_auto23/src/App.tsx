import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PreviewEngine from './PreviewEngine/PreviewEngine';
import DebugPanel from './DebugPanel/DebugPanel';
import {
  CodePayload,
  LogEntry,
  DeviceConfig,
  DeviceType,
  DEVICE_CONFIGS,
  THEME_COLORS
} from './PreviewEngine/types';
import './styles.css';

const DEFAULT_CODE: CodePayload = {
  html: `<div class="card">
  <h2>响应式卡片</h2>
  <p>这是一个测试组件，用于预览在不同设备上的显示效果。</p>
  <button>点击我</button>
</div>`,
  css: `.card {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
}

.card p {
  margin: 0 0 20px 0;
  line-height: 1.6;
  opacity: 0.9;
}

.card button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}`,
  js: `document.querySelector('.card button').addEventListener('click', function() {
  alert('按钮被点击了！');
});`
};

const App: React.FC = () => {
  const [code, setCode] = useState<CodePayload>(DEFAULT_CODE);
  const [deviceCodes, setDeviceCodes] = useState<Record<DeviceType, CodePayload>>({} as Record<DeviceType, CodePayload>);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showThemePalette, setShowThemePalette] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('#4A90D9');
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  const [deviceEditCode, setDeviceEditCode] = useState<CodePayload | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const modalIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', currentTheme);
  }, [currentTheme]);

  const handleCodeChange = useCallback((newCode: CodePayload) => {
    setCode(newCode);
  }, []);

  const handleLogAdd = useCallback((log: LogEntry) => {
    setLogs(prev => [...prev, log].slice(-100));
  }, []);

  const handleLogsClear = useCallback(() => {
    setLogs([]);
  }, []);

  const handlePreviewReady = useCallback((deviceType: DeviceType, canvas: HTMLCanvasElement) => {
    const infoLog: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level: 'info',
      message: `${DEVICE_CONFIGS.find(d => d.type === deviceType)?.name} 预览更新完成`
    };
    handleLogAdd(infoLog);
  }, [handleLogAdd]);

  const handlePreviewError = useCallback((deviceType: DeviceType, message: string) => {
    const deviceName = DEVICE_CONFIGS.find(d => d.type === deviceType)?.name || deviceType;
    const errorLog: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level: 'error',
      message: `[${deviceName}] ${message}`
    };
    handleLogAdd(errorLog);
  }, [handleLogAdd]);

  const handleDeviceClick = useCallback((device: DeviceConfig) => {
    setSelectedDevice(device.type);
    setShowModal(true);
    setIsEditingDevice(false);
    setDeviceEditCode(null);
    setHasUnsavedChanges(false);

    const existingDeviceCode = deviceCodes[device.type];
    if (existingDeviceCode) {
      setDeviceEditCode({ ...existingDeviceCode });
    } else {
      setDeviceEditCode({ ...code });
    }
  }, [code, deviceCodes]);

  const handleCloseModal = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('您有未应用的修改，确定要关闭吗？');
      if (!confirmed) return;
    }
    setShowModal(false);
    setSelectedDevice(null);
    setIsEditingDevice(false);
    setDeviceEditCode(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const handleStartEditing = useCallback(() => {
    setIsEditingDevice(true);
  }, []);

  const handleDeviceCodeChange = useCallback((type: 'html' | 'css' | 'js', value: string) => {
    if (deviceEditCode) {
      const newCode = { ...deviceEditCode, [type]: value };
      setDeviceEditCode(newCode);
      setHasUnsavedChanges(true);
    }
  }, [deviceEditCode]);

  const handleApplyDeviceCode = useCallback(() => {
    if (selectedDevice && deviceEditCode) {
      setDeviceCodes(prev => ({
        ...prev,
        [selectedDevice]: { ...deviceEditCode }
      }));
      setCode(deviceEditCode);
      setHasUnsavedChanges(false);

      const infoLog: LogEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        level: 'info',
        message: `${DEVICE_CONFIGS.find(d => d.type === selectedDevice)?.name} 代码已同步到全局`
      };
      handleLogAdd(infoLog);
    }
  }, [selectedDevice, deviceEditCode, handleLogAdd]);

  const handleThemeChange = useCallback((color: string) => {
    setCurrentTheme(color);
    setShowThemePalette(false);

    const event = new CustomEvent('theme-changed', {
      detail: { color }
    });
    window.dispatchEvent(event);

    const infoLog: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level: 'info',
      message: `主题色已切换为 ${color}`
    };
    handleLogAdd(infoLog);
  }, [handleLogAdd]);

  const getModalIframeContent = (): string => {
    const activeCode = isEditingDevice && deviceEditCode ? deviceEditCode : code;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${activeCode.css}</style>
        </head>
        <body>${activeCode.html}</body>
        <script>${activeCode.js}<\/script>
      </html>
    `;
  };

  const selectedDeviceConfig = DEVICE_CONFIGS.find(d => d.type === selectedDevice);

  const getLineNumbers = (content: string): string => {
    const lines = content.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };

  const [activeEditTab, setActiveEditTab] = useState<'html' | 'css' | 'js'>('html');

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">响应式预览沙箱</h1>
        <div
          className="theme-toggle"
          onClick={() => setShowThemePalette(!showThemePalette)}
        />
        {showThemePalette && (
          <div className="theme-palette" onClick={(e) => e.stopPropagation()}>
            {THEME_COLORS.map(color => (
              <div
                key={color}
                className={`color-option ${currentTheme === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleThemeChange(color)}
              />
            ))}
          </div>
        )}
      </header>

      <div className="main-content">
        <div className="left-panel">
          <DebugPanel
            code={code}
            onCodeChange={handleCodeChange}
            onLogAdd={handleLogAdd}
            logs={logs}
            onLogsClear={handleLogsClear}
          />
        </div>
        <div className="right-panel">
          <PreviewEngine
            code={code}
            deviceCodes={deviceCodes}
            onPreviewReady={handlePreviewReady}
            onError={handlePreviewError}
            onDeviceClick={handleDeviceClick}
            selectedDevice={selectedDevice}
          />
        </div>
      </div>

      {showModal && selectedDeviceConfig && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                当前放大预览：{selectedDeviceConfig.name}
                （{selectedDeviceConfig.width} × {selectedDeviceConfig.height}）
              </span>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-preview">
                <iframe
                  ref={modalIframeRef}
                  sandbox="allow-scripts"
                  style={{
                    width: selectedDeviceConfig.width,
                    height: selectedDeviceConfig.height,
                    border: 'none',
                    backgroundColor: 'white'
                  }}
                  srcDoc={getModalIframeContent()}
                  title="device-modal"
                />
              </div>
              {isEditingDevice && deviceEditCode && (
                <div className="modal-editor">
                  <div className="tabs-container">
                    <div className="tabs">
                    {(['html', 'css', 'js'] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`tab-btn ${activeEditTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveEditTab(tab)}
                      >
                        <span className="tab-bar" />
                        {tab.toUpperCase()}
                      </button>
                    ))}
                    </div>
                  </div>
                  <div className="code-editor-container">
                    {(['html', 'css', 'js'] as const).map((tab) => (
                      <div
                        key={tab}
                        className={`code-editor ${activeEditTab === tab ? 'visible' : 'hidden'}`}
                      >
                        <div className="line-numbers">
                          <pre>{getLineNumbers(deviceEditCode[tab])}</pre>
                        </div>
                        <textarea
                          value={deviceEditCode[tab]}
                          onChange={(e) => handleDeviceCodeChange(tab, e.target.value)}
                          spellCheck={false}
                          className="code-textarea"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!isEditingDevice ? (
                <button className="btn btn-primary" onClick={handleStartEditing}>
                  编辑当前设备
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={handleCloseModal}>
                  取消
                </button>
                  <button className="btn btn-primary" onClick={handleApplyDeviceCode}>
                    应用
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
