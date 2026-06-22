interface ReaderAnalysisProps {
  onClose: () => void;
}

export default function ReaderAnalysis({ onClose }: ReaderAnalysisProps) {
  return (
    <div className="glass-panel p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-wood-700">读者画像分析</h2>
        <button className="btn-press text-wood-400 hover:text-wood-600" onClick={onClose}>✕</button>
      </div>
      <p className="text-wood-400 text-sm">分析数据加载中...</p>
    </div>
  );
}
