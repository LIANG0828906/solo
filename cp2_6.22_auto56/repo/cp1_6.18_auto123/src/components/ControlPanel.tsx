import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { Download, RotateCcw, Sliders } from 'lucide-react';
import { GeneSlider } from './GeneSlider';
import { FontGeneProfile } from '../types';
import {
  useAppStore,
  selectGeneProfile,
  selectRecognizedGlyphs,
  selectIsExporting,
  selectExportProgress,
} from '../stores/appStore';
import { exportToWOFF2, downloadBlob, generateFontFilename } from '../utils/fontExport';

const GENE_KEYS: (keyof FontGeneProfile)[] = [
  'weight',
  'slant',
  'serifAmount',
  'curveTension',
  'decorationComplexity',
];

export const ControlPanel: React.FC = () => {
  const geneProfile = useAppStore(selectGeneProfile);
  const recognizedGlyphs = useAppStore(selectRecognizedGlyphs);
  const isExporting = useAppStore(selectIsExporting);
  const exportProgress = useAppStore(selectExportProgress);
  
  const updateGeneProfile = useAppStore((state) => state.updateGeneProfile);
  const resetAll = useAppStore((state) => state.resetAll);
  const setExporting = useAppStore((state) => state.setExporting);
  const setExportProgress = useAppStore((state) => state.setExportProgress);
  const setShowExportToast = useAppStore((state) => state.setShowExportToast);
  const setPreviewText = useAppStore((state) => state.setPreviewText);
  const previewText = useAppStore((state) => state.previewText);

  const debounceRef = useRef<number | null>(null);

  const handleGeneChange = useCallback(
    (key: keyof FontGeneProfile, value: number) => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      
      updateGeneProfile({ [key]: value });
      
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
      }, 50);
    },
    [updateGeneProfile]
  );

  const handleExport = useCallback(async () => {
    if (recognizedGlyphs.length === 0 || isExporting) return;

    setExporting(true);
    setExportProgress(0);

    try {
      const blob = await exportToWOFF2(
        recognizedGlyphs,
        geneProfile,
        (progress) => {
          setExportProgress(progress);
        }
      );

      const filename = generateFontFilename(geneProfile);
      downloadBlob(blob, filename);

      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 2000);
    } catch (error) {
      console.error('导出失败:', error);
      alert('字体导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }, [
    recognizedGlyphs,
    geneProfile,
    isExporting,
    setExporting,
    setExportProgress,
    setShowExportToast,
  ]);

  const handleReset = useCallback(() => {
    resetAll();
    setPreviewText('永和天下之人大小国中');
  }, [resetAll, setPreviewText]);

  const sliders = useMemo(
    () =>
      GENE_KEYS.map((key) => (
        <GeneSlider
          key={key}
          geneKey={key}
          value={geneProfile[key]}
          onChange={handleGeneChange}
          disabled={isExporting}
        />
      )),
    [geneProfile, handleGeneChange, isExporting]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-[#1A1A2E] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#6C63FF]" />
          <h2 className="text-[16px] font-semibold text-white">基因参数</h2>
        </div>
        <button
          onClick={handleReset}
          disabled={isExporting}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            bg-[#2D2D44] text-[#E0E0E0] text-xs
            hover:bg-[#3D3D5C] transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <RotateCcw size={14} />
          重置
        </button>
      </div>

      <div className="space-y-1 mb-6">{sliders}</div>

      <div className="mb-5">
        <label className="block text-[13px] text-[#E0E0E0] mb-2 font-medium">
          预览文字
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          disabled={isExporting}
          placeholder="输入文字预览效果..."
          maxLength={20}
          className="
            w-full px-4 py-2.5 rounded-lg
            bg-[#2D2D44] text-white text-sm
            border border-[#3D3D5C]
            focus:border-[#6C63FF] focus:outline-none
            transition-all duration-300
            placeholder:text-[#6B6B7B]
            disabled:opacity-50
          "
        />
      </div>

      {isExporting && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#888899] mb-1">
            <span>正在生成字体...</span>
            <span>{exportProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#2D2D44] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${exportProgress}%`,
                background: 'linear-gradient(90deg, #6C63FF, #FF6584)',
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting || recognizedGlyphs.length === 0}
        className="
          w-full flex items-center justify-center gap-2
          h-10 rounded-lg text-sm font-medium text-white
          bg-[#6C63FF] hover:bg-[#7B73FF]
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:bg-[#6C63FF]
        "
      >
        <Download size={16} />
        {isExporting ? '导出中...' : '导出字体'}
      </button>

      {recognizedGlyphs.length === 0 && !isExporting && (
        <p className="text-[12px] text-[#888899] text-center mt-3">
          请先上传图片或手写文字进行识别
        </p>
      )}
    </div>
  );
};
