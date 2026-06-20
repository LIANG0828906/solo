import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DiffViewer, { computeDiff } from './DiffViewer';
import type { Version, DiffChunk } from './types';

const API_BASE = 'http://localhost:3001';
const MAX_VERSIONS = 10;

export default function TextEditor() {
  const [currentText, setCurrentText] = useState<string>('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedFromVersion, setSelectedFromVersion] = useState<string>('');
  const [selectedToVersion, setSelectedToVersion] = useState<string>('');
  const [diffChunks, setDiffChunks] = useState<DiffChunk[] | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useBackend, setUseBackend] = useState<boolean>(true);

  const previousVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => a.timestamp - b.timestamp);
  }, [versions]);

  const fetchDiffFromServer = useCallback(
    async (oldText: string, newText: string): Promise<DiffChunk[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/diff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldText, newText }),
        });
        if (!response.ok) {
          throw new Error('后端请求失败');
        }
        const data = await response.json();
        return data.chunks;
      } catch (err) {
        console.warn('使用后端计算失败，回退到前端计算:', err);
        const result = computeDiff(oldText, newText);
        return result.chunks;
      }
    },
    []
  );

  const updateDiff = useCallback(async () => {
    const fromVer = versions.find((v) => v.id === selectedFromVersion);
    const toVer = versions.find((v) => v.id === selectedToVersion);

    if (!fromVer || !toVer) {
      setDiffChunks(null);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    let chunks: DiffChunk[];
    if (useBackend) {
      chunks = await fetchDiffFromServer(fromVer.content, toVer.content);
    } else {
      const result = computeDiff(fromVer.content, toVer.content);
      chunks = result.chunks;
    }

    const elapsed = performance.now() - startTime;
    console.log(`差异计算耗时: ${elapsed.toFixed(2)}ms`);

    setDiffChunks(chunks);
    setAnimationKey((k) => k + 1);
    setIsLoading(false);
  }, [versions, selectedFromVersion, selectedToVersion, useBackend, fetchDiffFromServer]);

  useEffect(() => {
    updateDiff();
  }, [updateDiff]);

  const handleSaveVersion = () => {
    if (versions.length >= MAX_VERSIONS) {
      setVersions((prev) => prev.slice(1));
    }

    const newVersion: Version = {
      id: uuidv4(),
      content: currentText,
      timestamp: Date.now(),
      label: `版本 ${versions.length + 1}`,
    };

    const newVersions = [...versions, newVersion];
    setVersions(newVersions);

    if (newVersions.length >= 2) {
      setSelectedFromVersion(newVersions[newVersions.length - 2].id);
      setSelectedToVersion(newVersions[newVersions.length - 1].id);
    } else {
      setSelectedFromVersion(newVersion.id);
      setSelectedToVersion(newVersion.id);
    }
  };

  const handleChunkAccept = (chunkId: string) => {
    setDiffChunks((prev) =>
      prev
        ? prev.map((c) => (c.id === chunkId ? { ...c, accepted: true } : c))
        : prev
    );
  };

  const handleChunkReject = (chunkId: string) => {
    setDiffChunks((prev) =>
      prev
        ? prev.map((c) => (c.id === chunkId ? { ...c, accepted: false } : c))
        : prev
    );
  };

  const buildFinalContent = (): string => {
    if (!diffChunks) return currentText;
    return diffChunks
      .map((chunk) => {
        if (chunk.operation === 'equal') return chunk.value;
        if (chunk.accepted === true) {
          return chunk.operation === 'insert' ? chunk.value : '';
        }
        if (chunk.accepted === false) {
          return chunk.operation === 'delete' ? chunk.value : '';
        }
        return chunk.operation === 'insert' ? chunk.value : '';
      })
      .join('');
  };

  const handleExport = () => {
    const content = buildFinalContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exported-version-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAcceptAll = () => {
    setDiffChunks((prev) =>
      prev ? prev.map((c) => (c.operation === 'equal' ? c : { ...c, accepted: true })) : prev
    );
  };

  const handleRejectAll = () => {
    setDiffChunks((prev) =>
      prev ? prev.map((c) => (c.operation === 'equal' ? c : { ...c, accepted: false })) : prev
    );
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN');
  };

  const canSave = versions.length === 0 || currentText !== previousVersion?.content;
  const hasDiff = diffChunks && diffChunks.some((c) => c.operation !== 'equal');

  return (
    <div className="text-editor-wrapper">
      <div className="button-bar">
        <button
          className="btn btn-primary"
          onClick={handleSaveVersion}
          disabled={!canSave || isLoading}
        >
          💾 保存版本
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleExport}
          disabled={!hasDiff && versions.length === 0}
        >
          📤 导出最终版本
        </button>

        {hasDiff && (
          <>
            <button className="btn btn-primary" onClick={handleAcceptAll} disabled={isLoading}>
              ✔ 全部接受
            </button>
            <button className="btn btn-warning" onClick={handleRejectAll} disabled={isLoading}>
              ✖ 全部拒绝
            </button>
          </>
        )}

        <div className="version-selector">
          <label>对比:</label>
          <select
            value={selectedFromVersion}
            onChange={(e) => setSelectedFromVersion(e.target.value)}
            disabled={versions.length < 2 || isLoading}
          >
            {sortedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({formatDate(v.timestamp)})
              </option>
            ))}
          </select>
          <span>→</span>
          <select
            value={selectedToVersion}
            onChange={(e) => setSelectedToVersion(e.target.value)}
            disabled={versions.length < 2 || isLoading}
          >
            {sortedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({formatDate(v.timestamp)})
              </option>
            ))}
          </select>
        </div>

        <label style={{ fontSize: '12px', color: '#b0b0d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={useBackend}
            onChange={(e) => setUseBackend(e.target.checked)}
          />
          使用后端计算
        </label>
      </div>

      <div className="editor-layout">
        <div className="editor-panel left">
          <div className="panel-label">
            <span>✏️ 可编辑文本区域</span>
            {previousVersion && (
              <span className="version-info">
                (基于: {previousVersion.label} - {formatDate(previousVersion.timestamp)})
              </span>
            )}
          </div>
          <textarea
            className="textarea"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="在此输入或粘贴文本..."
            rows={20}
          />
        </div>

        <div className="editor-panel right">
          <div className="panel-label">
            <span>📋 前一版本预览（只读）</span>
          </div>
          <div className="preview-box">
            {previousVersion ? previousVersion.content : '尚无保存的版本'}
          </div>
        </div>
      </div>

      {versions.length >= 2 && (
        <DiffViewer
          oldText={versions.find((v) => v.id === selectedFromVersion)?.content || ''}
          newText={versions.find((v) => v.id === selectedToVersion)?.content || ''}
          chunks={diffChunks}
          onChunksChange={setDiffChunks}
          onChunkAccept={handleChunkAccept}
          onChunkReject={handleChunkReject}
          animationKey={animationKey}
        />
      )}

      {versions.length < 2 && (
        <div className="empty-state">
          <p>保存至少两个版本后，将在此处显示差异对比。</p>
        </div>
      )}
    </div>
  );
}
