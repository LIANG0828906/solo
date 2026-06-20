import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../editor/store/editorStore';
import { EditorCanvas } from '../editor/components/EditorCanvas';
import { PropertyPanel } from '../editor/components/PropertyPanel';
import { Toolbar } from '../editor/components/Toolbar';
import { ChartDialog } from '../editor/components/ChartDialog';
import { ExportPanel } from '../editor/components/ExportPanel';
import { DEFAULT_TEMPLATES } from '../editor/templates';
import { ArrowLeft } from 'lucide-react';

export const Editor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { loadTemplate, undo, redo, canUndo, canRedo } = useEditorStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      navigate('/');
    }
  }, [templateId, loadTemplate, navigate]);

  useEffect(() => {
    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    document.title = `编辑 - ${template?.name || '信息图表'}`;
  }, [templateId]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1280);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (canUndo) undo();
        }
        if ((e.key === 'z' && e.shiftKey) || (e.key === 'y')) {
          e.preventDefault();
          if (canRedo) redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#f5f7fa',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={handleBack}
          style={{
            padding: '0 16px',
            height: 52,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#666',
            borderRight: '1px solid #e0e0e0',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8f0fe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <div style={{ flex: 1 }}>
          <Toolbar
            onAddChart={() => setShowChartDialog(true)}
            onExport={() => setShowExportPanel(true)}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <EditorCanvas canvasRef={canvasRef} />
        </div>

        {!isMobile && <PropertyPanel />}

        {isMobile && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              transition: 'transform 0.3s ease',
              transform: panelCollapsed ? 'translateY(calc(100% - 52px))' : 'translateY(0)',
            }}
          >
            <div
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              style={{
                height: 52,
                backgroundColor: '#fff',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#e0e0e0',
                }}
              />
            </div>
            <div
              style={{
                height: 260,
                backgroundColor: '#fff',
                overflowY: 'auto',
              }}
            >
              <PropertyPanel />
            </div>
          </div>
        )}
      </div>

      <ChartDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
      />

      <ExportPanel
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
};
