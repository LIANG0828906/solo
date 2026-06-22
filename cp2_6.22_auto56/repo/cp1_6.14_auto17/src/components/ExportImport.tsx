import { useRef, useState } from 'react';
import { Camera, FileDown, FileUp } from 'lucide-react';
import axios from 'axios';
import { usePlanetStore } from '@/store/useStore';

function downloadBlob(data: string, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ExportImport() {
  const { compareList, currentDay, cameraPosition } = usePlanetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleExportSnapshot = async () => {
    setExporting(true);
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        showStatus('error', '未找到3D画布');
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      downloadDataUrl(dataUrl, `solar-snapshot-day${currentDay}.png`);
      showStatus('success', '快照已导出');
    } catch {
      showStatus('error', '快照导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleExportConfig = async () => {
    setExporting(true);
    try {
      const config = {
        planetIds: compareList,
        day: currentDay,
        cameraPosition: cameraPosition ?? [0, 0, 0],
      };

      await axios.post('/api/save-config', config);

      const jsonStr = JSON.stringify(config, null, 2);
      downloadBlob(jsonStr, `solar-config-day${currentDay}.json`, 'application/json');
      showStatus('success', '配置已导出并保存');
    } catch {
      const config = {
        planetIds: compareList,
        day: currentDay,
        cameraPosition: cameraPosition ?? [0, 0, 0],
      };
      const jsonStr = JSON.stringify(config, null, 2);
      downloadBlob(jsonStr, `solar-config-day${currentDay}.json`, 'application/json');
      showStatus('success', '配置已导出（服务器未连接）');
    } finally {
      setExporting(false);
    }
  };

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      if (!Array.isArray(config.planetIds) || typeof config.day !== 'number') {
        showStatus('error', '配置格式无效');
        return;
      }

      const payload = {
        planetIds: config.planetIds,
        day: config.day,
        cameraPosition: config.cameraPosition ?? [0, 0, 0],
      };

      await axios.post('/api/import-config', payload);

      const store = usePlanetStore.getState();
      store.setCurrentDay(config.day);
      if (Array.isArray(config.cameraPosition) && config.cameraPosition.length === 3) {
        store.setCameraPosition(config.cameraPosition as [number, number, number]);
      }

      showStatus('success', '配置已导入并恢复');
    } catch {
      try {
        const text = await file.text();
        const config = JSON.parse(text);
        const store = usePlanetStore.getState();
        if (typeof config.day === 'number') {
          store.setCurrentDay(config.day);
        }
        if (Array.isArray(config.cameraPosition) && config.cameraPosition.length === 3) {
          store.setCameraPosition(config.cameraPosition as [number, number, number]);
        }
        showStatus('success', '配置已本地恢复（服务器未连接）');
      } catch {
        showStatus('error', '导入失败：文件格式错误');
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExportSnapshot}
        disabled={exporting}
        className="glow-hover glass flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        <Camera size={16} />
        <span>{exporting ? '导出中...' : '导出快照'}</span>
      </button>

      <button
        onClick={handleExportConfig}
        disabled={exporting}
        className="glow-hover glass flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        <FileDown size={16} />
        <span>{exporting ? '导出中...' : '导出配置'}</span>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="glow-hover glass flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        <FileUp size={16} />
        <span>{importing ? '导入中...' : '导入配置'}</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportConfig}
        className="hidden"
      />

      {status && (
        <div
          className={`mt-1 rounded px-3 py-1.5 text-xs ${
            status.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
