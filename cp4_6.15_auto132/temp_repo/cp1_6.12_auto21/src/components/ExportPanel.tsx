import { useBookStore } from '@/store';

export default function ExportPanel() {
  const exportProgress = useBookStore((s) => s.exportProgress);

  return (
    <div className="glass-panel p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-wood-700 mb-4">导出 PDF</h2>
      <div className="w-full bg-wood-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-300"
          style={{ width: `${exportProgress}%` }}
        />
      </div>
      <p className="text-sm text-wood-500 mt-2 text-center">{Math.round(exportProgress)}%</p>
    </div>
  );
}
