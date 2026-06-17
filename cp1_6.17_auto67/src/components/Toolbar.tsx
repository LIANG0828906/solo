import React, { useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import type { DiffResult } from '@/types';

export const Toolbar: React.FC = () => {
  const { versions, isComparing, diffResult, setIsComparing, setDiffResult } = useStore();

  const versionA = versions.find((v) => v.label === 'A');
  const versionB = versions.find((v) => v.label === 'B');
  const canCompare = !!(versionA && versionB) && !isComparing;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;

    setIsComparing(true);

    try {
      const { useStore: getStore } = await import('@/stores/useStore');
      const state = getStore.getState();

      const containerA = document.createElement('div');
      containerA.style.cssText = 'position:fixed;left:-9999px;top:0;padding:16px;background:#FFFFFF;border-radius:8px;';
      document.body.appendChild(containerA);

      const rootA = await import('react-dom/client');
      const { Renderer } = await import('@/modules/renderer/Renderer');
      const ReactLib = await import('react');

      const refA = ReactLib.createRef<{ getContainer: () => HTMLDivElement | null }>();
      const reactRootA = rootA.createRoot(containerA);
      await new Promise<void>((resolve) => {
        reactRootA.render(ReactLib.createElement(Renderer, { ref: refA, config: versionA.config }));
        requestAnimationFrame(() => resolve());
      });

      await new Promise((r) => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas')).default;
      const canvasA = await html2canvas(containerA, {
        backgroundColor: '#FFFFFF',
        scale: 1,
        logging: false,
      });
      reactRootA.unmount();
      document.body.removeChild(containerA);

      const containerB = document.createElement('div');
      containerB.style.cssText = 'position:fixed;left:-9999px;top:0;padding:16px;background:#FFFFFF;border-radius:8px;';
      document.body.appendChild(containerB);

      const refB = ReactLib.createRef<{ getContainer: () => HTMLDivElement | null }>();
      const reactRootB = rootA.createRoot(containerB);
      await new Promise<void>((resolve) => {
        reactRootB.render(ReactLib.createElement(Renderer, { ref: refB, config: versionB.config }));
        requestAnimationFrame(() => resolve());
      });

      await new Promise((r) => setTimeout(r, 100));

      const canvasB = await html2canvas(containerB, {
        backgroundColor: '#FFFFFF',
        scale: 1,
        logging: false,
      });
      reactRootB.unmount();
      document.body.removeChild(containerB);

      const { diffCanvases } = await import('@/modules/diff/DiffEngine');
      const result: DiffResult = diffCanvases(canvasA, canvasB);

      state.setSnapshotADataURL(canvasA.toDataURL());
      state.setSnapshotBDataURL(canvasB.toDataURL());
      state.setDiffResult(result);
    } catch (error) {
      console.error('Compare failed:', error);
    } finally {
      setIsComparing(false);
    }
  }, [canCompare, versionA, versionB, setIsComparing]);

  const handleExport = useCallback(() => {
    if (!diffResult) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const report = {
      totalDiffPixels: diffResult.totalDiffPixels,
      totalPixels: diffResult.totalPixels,
      diffPercent: diffResult.diffPercent,
      diffRegions: diffResult.diffRegions.map((r) => ({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        avgColorDiff: r.avgColorDiff,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff_report_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diffResult]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E8E8E8',
      flexShrink: 0,
    }}>
      <button
        onClick={handleCompare}
        disabled={!canCompare}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 18px',
          backgroundColor: !canCompare ? '#BFBFBF' : isComparing ? '#FFA940' : '#FA8C16',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: !canCompare ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        }}
        onMouseEnter={(e) => {
          if (canCompare) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFA940';
        }}
        onMouseLeave={(e) => {
          if (canCompare && !isComparing) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FA8C16';
        }}
        onMouseDown={(e) => {
          if (canCompare) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {isComparing ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Comparing...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3l4 4-4 4M8 21H4a1 1 0 01-1-1v-4M20 7H9a2 2 0 00-2 2v10M4 14l-4-4 4-4" />
            </svg>
            Compare
          </>
        )}
      </button>

      <button
        onClick={handleExport}
        disabled={!diffResult}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 18px',
          backgroundColor: !diffResult ? '#BFBFBF' : '#52C41A',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: !diffResult ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        }}
        onMouseEnter={(e) => {
          if (diffResult) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#73D13D';
        }}
        onMouseLeave={(e) => {
          if (diffResult) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#52C41A';
        }}
        onMouseDown={(e) => {
          if (diffResult) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export Report
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: '12px', color: '#999' }}>
        {versionA && versionB
          ? `Comparing A ↔ B`
          : versionA
          ? 'Version A saved'
          : versionB
          ? 'Version B saved'
          : 'No versions saved'}
      </div>
    </div>
  );
};
