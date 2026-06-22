import { useState, useEffect } from 'react';
import { Info, Scissors, Download, ChevronLeft, ChevronRight, Wrench, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { exportReport } from '@/screenshot/screenshot';

export function Panel() {
  const [isRippling, setIsRippling] = useState<string | null>(null);

  const mode = useStore((state) => state.mode);
  const toggleRepairMode = useStore((state) => state.toggleRepairMode);
  const isRepairAnimating = useStore((state) => state.isRepairAnimating);

  const isCutaway = useStore((state) => state.isCutaway);
  const toggleCutaway = useStore((state) => state.toggleCutaway);
  const isCutawayAnimating = useStore((state) => state.isCutawayAnimating);

  const isPanelCollapsed = useStore((state) => state.isPanelCollapsed);
  const togglePanel = useStore((state) => state.togglePanel);
  const isMobileView = useStore((state) => state.isMobileView);

  const artifactInfo = useStore((state) => state.artifactInfo);
  const repairProgress = useStore((state) => state.repairProgress);

  const handleRipple = (id: string) => {
    setIsRippling(id);
    setTimeout(() => setIsRippling(null), 400);
  };

  const handleExport = async () => {
    handleRipple('export');
    await exportReport();
  };

  useEffect(() => {
    const checkWidth = () => {
      useStore.getState().setIsMobileView(window.innerWidth < 1366);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const showCollapsed = isMobileView && isPanelCollapsed;

  if (showCollapsed) {
    return (
      <button
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-white/85 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 ease-out"
        onClick={() => {
          handleRipple('toggle');
          togglePanel();
        }}
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <Info size={20} className="text-gray-700" />
      </button>
    );
  }

  return (
    <div
      className={`fixed top-4 z-50 transition-all duration-300 ease-out ${
        isMobileView ? 'right-4' : 'right-6'
      }`}
      style={{
        width: isMobileView ? '260px' : '280px',
      }}
    >
      {isMobileView && (
        <button
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-16 bg-white/85 backdrop-blur-sm rounded-l-lg shadow-md flex items-center justify-center hover:bg-white transition-all z-10"
          onClick={() => {
            handleRipple('toggle');
            togglePanel();
          }}
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      )}

      <div
        className="bg-white/85 backdrop-blur-md rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div className="px-5 py-4 border-b border-gray-200/60">
          <h2 className="text-base font-semibold text-gray-800 tracking-wide">
            {artifactInfo.dynasty} {artifactInfo.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{artifactInfo.year}</p>
        </div>

        <div className="px-5 py-3 border-b border-gray-200/60">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            尺寸规格
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50/80 rounded-lg py-2">
              <p className="text-sm font-medium text-gray-800">
                {artifactInfo.dimensions.height}
              </p>
              <p className="text-xs text-gray-500">通高</p>
            </div>
            <div className="bg-gray-50/80 rounded-lg py-2">
              <p className="text-sm font-medium text-gray-800">
                {artifactInfo.dimensions.diameter}
              </p>
              <p className="text-xs text-gray-500">口径</p>
            </div>
            <div className="bg-gray-50/80 rounded-lg py-2">
              <p className="text-sm font-medium text-gray-800">
                {artifactInfo.dimensions.footDiameter}
              </p>
              <p className="text-xs text-gray-500">足径</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {mode === 'damaged' ? (
                <AlertTriangle size={16} className="text-amber-600" />
              ) : (
                <Wrench size={16} className="text-emerald-600" />
              )}
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {mode === 'damaged' ? '破损状况' : '修复信息'}
              </h3>
            </div>
          </div>

          {mode === 'damaged' ? (
            <div className="space-y-2">
              {artifactInfo.damages.map((damage, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{damage.type}</p>
                    <p className="text-xs text-gray-500">{damage.description}</p>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {damage.size}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-sm font-medium text-emerald-700 mb-1">修复材料</p>
                <p className="text-xs text-emerald-600">{artifactInfo.repair.material}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {artifactInfo.repair.description}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">修复模式</span>
            <button
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ease-out ${
                mode === 'repaired' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
              onClick={() => {
                handleRipple('repair');
                if (!isRepairAnimating) {
                  toggleRepairMode();
                }
              }}
              disabled={isRepairAnimating}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ease-out ${
                  mode === 'repaired' ? 'left-6' : 'left-0.5'
                }`}
              />
              {isRippling === 'repair' && (
                <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
              )}
            </button>
          </div>

          {isRepairAnimating && (
            <div className="mt-2">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${repairProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-2">
          <button
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ease-out flex items-center justify-center gap-2 relative overflow-hidden ${
              isCutaway
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => {
              handleRipple('cutaway');
              if (!isCutawayAnimating) {
                toggleCutaway();
              }
            }}
            disabled={isCutawayAnimating}
          >
            <Scissors size={16} />
            {isCutaway ? '关闭剖视图' : '开启剖视图'}
            {isRippling === 'cutaway' && (
              <span className="absolute inset-0 bg-white/30 animate-ping" />
            )}
          </button>

          <button
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 ease-out flex items-center justify-center gap-2 relative overflow-hidden"
            onClick={handleExport}
          >
            <Download size={16} />
            导出报告
            {isRippling === 'export' && (
              <span className="absolute inset-0 bg-white/30 animate-ping" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
