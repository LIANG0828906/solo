import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/stores/useStore';
import type { ComponentConfig, VersionSnapshot } from '@/types';

export const VersionPanel: React.FC = () => {
  const {
    versions,
    jsonConfig,
    jsonError,
    addVersion,
    selectVersion,
    loadVersionConfig,
    selectedVersionId,
  } = useStore();

  const handleSave = useCallback(
    (label: 'A' | 'B') => {
      if (jsonError) return;
      try {
        const config: ComponentConfig = JSON.parse(jsonConfig);
        const snapshot: VersionSnapshot = {
          id: uuidv4(),
          label,
          config,
          thumbnail: '',
          createdAt: Date.now(),
        };
        addVersion(snapshot);
        selectVersion(snapshot.id);
      } catch {
        // ignore
      }
    },
    [jsonConfig, jsonError, addVersion, selectVersion]
  );

  const versionA = versions.find((v) => v.label === 'A');
  const versionB = versions.find((v) => v.label === 'B');

  return (
    <div style={{
      padding: '12px 0 0 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1890FF" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        Version Management
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleSave('A')}
          disabled={!!jsonError}
          style={{
            flex: 1,
            padding: '7px 0',
            backgroundColor: jsonError ? '#BFBFBF' : '#1890FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: jsonError ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          }}
          onMouseEnter={(e) => {
            if (!jsonError) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#40A9FF';
          }}
          onMouseLeave={(e) => {
            if (!jsonError) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1890FF';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          Save as A
        </button>
        <button
          onClick={() => handleSave('B')}
          disabled={!!jsonError}
          style={{
            flex: 1,
            padding: '7px 0',
            backgroundColor: jsonError ? '#BFBFBF' : '#1890FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: jsonError ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          }}
          onMouseEnter={(e) => {
            if (!jsonError) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#40A9FF';
          }}
          onMouseLeave={(e) => {
            if (!jsonError) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1890FF';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          Save as B
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {versionA && (
          <VersionCard
            version={versionA}
            isSelected={selectedVersionId === versionA.id}
            onClick={() => loadVersionConfig(versionA.id)}
          />
        )}
        {versionB && (
          <VersionCard
            version={versionB}
            isSelected={selectedVersionId === versionB.id}
            onClick={() => loadVersionConfig(versionB.id)}
          />
        )}
        {!versionA && !versionB && (
          <div style={{
            color: '#999',
            fontSize: '12px',
            padding: '12px',
            textAlign: 'center',
            width: '100%',
          }}>
            No saved versions yet
          </div>
        )}
      </div>
    </div>
  );
};

const VersionCard: React.FC<{
  version: VersionSnapshot;
  isSelected: boolean;
  onClick: () => void;
}> = ({ version, isSelected, onClick }) => {
  const configSummary = `${version.config.type}${version.config.props.text ? `: ${String(version.config.props.text).slice(0, 12)}` : version.config.props.title ? `: ${String(version.config.props.title).slice(0, 12)}` : ''}`;

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: '120px',
        height: '80px',
        borderRadius: '6px',
        border: isSelected ? '2px solid #1890FF' : '1px solid #D9D9D9',
        backgroundColor: '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{
        fontSize: '16px',
        fontWeight: 700,
        color: version.label === 'A' ? '#1890FF' : '#FA8C16',
      }}>
        Version {version.label}
      </div>
      <div style={{
        fontSize: '11px',
        color: '#666',
        maxWidth: '108px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {configSummary}
      </div>
    </div>
  );
};
