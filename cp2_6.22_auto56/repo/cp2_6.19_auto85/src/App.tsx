import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { COMPONENTS, getComponentById } from './data/components';
import { ComponentList } from './components/ComponentList';
import { ComponentSandbox } from './components/ComponentSandbox';
import { ControlPanel } from './components/ControlPanel';
import { CodeExport } from './components/CodeExport';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { useToast } from './hooks/useToast';

const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(COMPONENTS[0].id);
  const [propsMap, setPropsMap] = useState<Record<string, Record<string, any>>>(() => {
    const map: Record<string, Record<string, any>> = {};
    COMPONENTS.forEach((c) => {
      map[c.id] = { ...c.defaultProps };
    });
    return map;
  });
  const [presetIndexMap, setPresetIndexMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    COMPONENTS.forEach((c) => {
      map[c.id] = 0;
    });
    return map;
  });
  const [animKey, setAnimKey] = useState<number>(0);
  const [isPresetChange, setIsPresetChange] = useState<boolean>(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);

  const { toasts, showSuccess, showError } = useToast();

  const currentComponent = useMemo(
    () => getComponentById(selectedId)!,
    [selectedId]
  );
  const currentProps = propsMap[selectedId];
  const currentPresetIndex = presetIndexMap[selectedId];

  const triggerAnim = useCallback((preset: boolean) => {
    setIsPresetChange(preset);
    setAnimKey((k) => k + 1);
  }, []);

  const handleSelectComponent = useCallback(
    (id: string) => {
      setSelectedId(id);
      triggerAnim(true);
      setMobilePanelOpen(false);
    },
    [triggerAnim]
  );

  const handlePropChange = useCallback(
    (key: string, value: any) => {
      setPropsMap((prev) => ({
        ...prev,
        [selectedId]: {
          ...prev[selectedId],
          [key]: value,
        },
      }));
      setPresetIndexMap((prev) => ({
        ...prev,
        [selectedId]: -1,
      }));
      triggerAnim(false);
    },
    [selectedId, triggerAnim]
  );

  const handlePresetSelect = useCallback(
    (presetIndex: number) => {
      const comp = getComponentById(selectedId);
      if (!comp || !comp.presets[presetIndex]) return;
      setPropsMap((prev) => ({
        ...prev,
        [selectedId]: {
          ...comp.presets[presetIndex].props,
        },
      }));
      setPresetIndexMap((prev) => ({
        ...prev,
        [selectedId]: presetIndex,
      }));
      triggerAnim(true);
      showSuccess(`已切换到「${comp.presets[presetIndex].name}」预设`);
    },
    [selectedId, triggerAnim, showSuccess]
  );

  const doReset = useCallback(() => {
    const comp = getComponentById(selectedId);
    if (!comp) {
      showError('组件不存在，重置失败');
      return;
    }
    setPropsMap((prev) => ({
      ...prev,
      [selectedId]: {
        ...comp.defaultProps,
      },
    }));
    setPresetIndexMap((prev) => ({
      ...prev,
      [selectedId]: 0,
    }));
    triggerAnim(true);
    setResetModalOpen(false);
    showSuccess(`「${comp.name}」已重置为默认值`);
  }, [selectedId, triggerAnim, showSuccess, showError]);

  const handleResetRequest = useCallback(() => {
    setResetModalOpen(true);
  }, []);

  const handleCopyCode = useCallback(
    (msg: string) => {
      showSuccess(msg);
    },
    [showSuccess]
  );

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#181825',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {!isMobile && (
          <ComponentList
            components={COMPONENTS}
            selectedId={selectedId}
            onSelect={handleSelectComponent}
          />
        )}

        {isMobile && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#1e1e2e',
              borderBottom: '1px solid #313244',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            {COMPONENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectComponent(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  backgroundColor: c.id === selectedId ? '#89b4fa' : '#313244',
                  color: c.id === selectedId ? '#1e1e2e' : '#cdd6f4',
                  fontWeight: c.id === selectedId ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <ComponentSandbox
            component={currentComponent}
            props={currentProps}
            animKey={animKey}
            isPresetChange={isPresetChange}
          />
          <CodeExport
            componentId={selectedId}
            props={currentProps}
            onToast={handleCopyCode}
          />
        </div>

        {!isMobile && (
          <ControlPanel
            component={currentComponent}
            props={currentProps}
            onPropChange={handlePropChange}
            onPresetSelect={handlePresetSelect}
            onReset={handleResetRequest}
            currentPresetIndex={currentPresetIndex}
          />
        )}
      </div>

      {isMobile && (
        <>
          <button
            onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#89b4fa',
              color: '#1e1e2e',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(137, 180, 250, 0.4)',
              zIndex: 100,
            }}
          >
            ⚙
          </button>
          {mobilePanelOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 99,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
              onClick={() => setMobilePanelOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              >
                <ControlPanel
                  component={currentComponent}
                  props={currentProps}
                  onPropChange={handlePropChange}
                  onPresetSelect={handlePresetSelect}
                  onReset={handleResetRequest}
                  currentPresetIndex={currentPresetIndex}
                />
              </div>
            </div>
          )}
        </>
      )}

      <Toast toasts={toasts} />
      <ConfirmModal
        open={resetModalOpen}
        title="确认重置组件？"
        message={`此操作会将「${currentComponent.name}」的所有属性恢复为默认值，当前所有自定义调整将丢失，且无法撤销。是否继续？`}
        confirmText="确认重置"
        cancelText="取消"
        confirmColor="#f38ba8"
        onConfirm={doReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
};

export default App;
