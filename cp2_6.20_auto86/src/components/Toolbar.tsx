import React, { useState, useEffect } from 'react';
import useFlowStore from '../store/useFlowStore';
import { downloadSVG, downloadMarkdown } from '../utils/exportUtils';

interface ToolbarProps {
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
}) => {
  const { nodes, edges, addNode, selectedNodeId, deleteNode } = useFlowStore();
  const [isExportingSVG, setIsExportingSVG] = useState(false);
  const [isExportingMD, setIsExportingMD] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddRootNode = () => {
    addNode();
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  const handleExportSVG = () => {
    setIsExportingSVG(true);
    setTimeout(() => {
      downloadSVG(nodes, edges, '思维导图.svg');
      setIsExportingSVG(false);
    }, 500);
  };

  const handleExportMarkdown = () => {
    setIsExportingMD(true);
    setTimeout(() => {
      downloadMarkdown(nodes, edges, '思维导图.md');
      setIsExportingMD(false);
    }, 500);
  };

  const Spinner = () => (
    <svg
      className="spinner"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ marginRight: '6px' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32 80"
        fill="none"
      />
    </svg>
  );

  const toolbarContent = (
    <>
      <button
        onClick={handleAddRootNode}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 200ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4f46e5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#6366f1';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>添加根节点</span>
      </button>

      <button
        onClick={handleDeleteSelected}
        disabled={!selectedNodeId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: selectedNodeId ? '#ffffff' : '#f3f4f6',
          color: selectedNodeId ? '#374151' : '#9ca3af',
          fontSize: '14px',
          fontWeight: 500,
          cursor: selectedNodeId ? 'pointer' : 'not-allowed',
          transition: 'background-color 200ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (selectedNodeId) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedNodeId) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
        <span>删除选中</span>
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
        }}
      >
        <button
          onClick={onZoomOut}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#374151',
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="缩小"
        >
          −
        </button>
        <span
          style={{
            minWidth: '48px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#374151',
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="放大"
        >
          +
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

      <button
        onClick={handleExportSVG}
        disabled={isExportingSVG}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: isExportingSVG ? '#f3f4f6' : '#ffffff',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isExportingSVG ? 'wait' : 'pointer',
          transition: 'background-color 200ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isExportingSVG) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExportingSVG) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        {isExportingSVG && <Spinner />}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        <span>导出SVG</span>
      </button>

      <button
        onClick={handleExportMarkdown}
        disabled={isExportingMD}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: isExportingMD ? '#f3f4f6' : '#ffffff',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isExportingMD ? 'wait' : 'pointer',
          transition: 'background-color 200ms ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isExportingMD) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExportingMD) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        {isExportingMD && <Spinner />}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <span>导出Markdown</span>
      </button>
    </>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'space-between' : 'flex-start',
        gap: '12px',
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginRight: isMobile ? 'auto' : '24px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          协同思维导图
        </span>
      </div>

      {isMobile ? (
        <>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>

          {isMobileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {toolbarContent}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {toolbarContent}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
