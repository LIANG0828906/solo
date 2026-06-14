import React, { useState, useCallback } from 'react';
import { useControls, button, folder } from 'leva';
import { useTerrainStore, type ViewMode } from '@/store/useTerrainStore';
import { saveConfig, loadConfig } from '@/services/apiService';

const ParameterPanel: React.FC = () => {
  const store = useTerrainStore();
  const [shareCode, setShareCode] = useState<string>('');
  const [loadCode, setLoadCode] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useControls(
    '地形参数',
    {
      heightScale: {
        value: store.heightScale,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        label: '高度倍率',
        onChange: (v: number) => store.setHeightScale(v),
      },
      frequency: {
        value: store.frequency,
        min: 1,
        max: 10,
        step: 0.1,
        label: '地形频率',
        onChange: (v: number) => store.setFrequency(v),
      },
      vegetationDensity: {
        value: store.vegetationDensity,
        min: 0,
        max: 100,
        step: 1,
        label: '植被密度 %',
        onChange: (v: number) => store.setVegetationDensity(v),
      },
    },
    [store]
  );

  useControls(
    '光照控制',
    {
      lightAngle: {
        value: store.lightAngle,
        min: 0,
        max: 360,
        step: 1,
        label: '光照角度 °',
        onChange: (v: number) => store.setLightAngle(v),
      },
    },
    [store]
  );

  useControls(
    '视角模式',
    {
      viewMode: {
        value: store.viewMode as ViewMode,
        options: { '第一人称': 'first' as ViewMode, '第三人称': 'third' as ViewMode },
        label: '视角切换',
        onChange: (v: ViewMode) => store.setViewMode(v),
      },
    },
    [store]
  );

  useControls(
    '配置管理',
    {
      saveConfigBtn: button('💾 保存配置', async () => {
        setIsSaving(true);
        setStatusMessage('正在保存...');
        try {
          const config = {
            heightScale: store.heightScale,
            frequency: store.frequency,
            vegetationDensity: store.vegetationDensity,
            lightAngle: store.lightAngle,
            viewMode: store.viewMode,
            seed: store.seed,
            cameraPosition: store.cameraPosition,
            cameraTarget: store.cameraTarget,
          };
          const result = await saveConfig(config);
          if (result.success && result.code) {
            setShareCode(result.code);
            setStatusMessage(`保存成功！分享代码: ${result.code}`);
          } else {
            setStatusMessage(`保存失败: ${result.message || '未知错误'}`);
          }
        } catch {
          setStatusMessage('保存失败: 网络错误');
        } finally {
          setIsSaving(false);
        }
      }),
      randomizeSeedBtn: button('🎲 随机地形', () => {
        store.randomizeSeed();
        setStatusMessage('已生成新地形');
      }),
    },
    [store]
  );

  const handleLoadConfig = useCallback(async () => {
    if (!loadCode || loadCode.length !== 6) {
      setStatusMessage('请输入6位分享代码');
      return;
    }
    setIsLoading(true);
    setStatusMessage('正在加载...');
    try {
      const result = await loadConfig(loadCode.toUpperCase());
      if (result.success && result.config) {
        store.applyConfig(result.config);
        setStatusMessage('加载成功！');
      } else {
        setStatusMessage(`加载失败: ${result.message || '未找到配置'}`);
      }
    } catch {
      setStatusMessage('加载失败: 网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [loadCode, store]);

  const handleCopyCode = useCallback(() => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode).then(() => {
        setStatusMessage('已复制分享代码！');
      }).catch(() => {
        setStatusMessage('复制失败，请手动复制');
      });
    }
  }, [shareCode]);

  return (
    <div className="param-panel-load-section">
      {shareCode && (
        <div className="share-code-display">
          <span className="share-code-label">分享代码</span>
          <div className="share-code-value" onClick={handleCopyCode}>
            {shareCode}
            <span className="copy-hint">点击复制</span>
          </div>
        </div>
      )}
      <div className="load-config-row">
        <input
          type="text"
          className="load-input"
          placeholder="输入6位代码"
          maxLength={6}
          value={loadCode}
          onChange={(e) => setLoadCode(e.target.value.toUpperCase())}
        />
        <button
          className="load-btn"
          onClick={handleLoadConfig}
          disabled={isLoading}
        >
          {isLoading ? '加载中...' : '加载配置'}
        </button>
      </div>
      {statusMessage && (
        <div className={`status-msg ${statusMessage.includes('失败') ? 'error' : 'success'}`}>
          {statusMessage}
        </div>
      )}
      <div className="controls-hint">
        <div className="hint-title">操作提示</div>
        <div className="hint-item">W A S D - 前后左右移动</div>
        <div className="hint-item">鼠标拖拽 - 旋转视角</div>
        <div className="hint-item">点击场景获取焦点</div>
      </div>
    </div>
  );
};

export default ParameterPanel;
