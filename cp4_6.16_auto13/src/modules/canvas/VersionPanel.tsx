import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function VersionPanel() {
  const { versions, loadVersions, restoreVersion } = useEditorStore();
  const [toast, setToast] = useState<string | null>(null);
  const [prevVersionsLen, setPrevVersionsLen] = useState(0);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    if (versions.length > prevVersionsLen && prevVersionsLen > 0) {
      setToast('版本已保存');
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
    setPrevVersionsLen(versions.length);
  }, [versions.length, prevVersionsLen]);

  const handleRestore = (id: string) => {
    restoreVersion(id);
    setToast('版本已恢复');
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-baseline justify-between px-1">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">历史版本</h2>
          <p className="mt-0.5 text-xs text-gray-500">最多保留10个版本</p>
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-white/80 px-5 py-2.5 text-sm font-medium text-gray-800 shadow-lg backdrop-blur-xl border border-white/60 animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        {versions.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl bg-white/40 p-6 text-center backdrop-blur-md border border-white/50">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">还没有保存记录，点击保存按钮生成快照</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.id}
                className="group flex gap-3 rounded-2xl bg-white/50 p-3 backdrop-blur-md border border-white/60 shadow-sm hover:bg-white/70 hover:shadow-md transition-all duration-200"
              >
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-white/70 bg-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  <img
                    src={v.thumbnail}
                    alt={`version-${v.id}`}
                    className="block h-[213px] w-[120px] object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {formatTimestamp(v.timestamp)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {v.elements.length} 个元素
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(v.id)}
                    className="self-start rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95"
                  >
                    恢复
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
