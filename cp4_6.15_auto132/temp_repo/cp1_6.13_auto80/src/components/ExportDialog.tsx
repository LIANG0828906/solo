import { useState } from 'react';
import axios from 'axios';
import { X, Download, Save, Image as ImageIcon, FileCode, Loader2 } from 'lucide-react';
import { PatternCanvasRef } from './PatternCanvas';
import { PatternParams } from '@/types/pattern';
import { usePatternStore } from '@/store/patternStore';
import { downloadSVG, downloadPNG } from '@/utils/svgGenerator';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<PatternCanvasRef>;
  params: PatternParams;
}

export default function ExportDialog({ open, onClose, canvasRef, params }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { addSavedPattern } = usePatternStore();

  if (!open) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      setExporting(true);
      const canvas = canvasRef.current.getCanvas();
      if (canvas) {
        await downloadPNG(canvas, `geopattern-${timestamp}.png`);
      }
    } catch (error) {
      console.error('Export PNG failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    try {
      setExporting(true);
      const svgString = canvasRef.current.exportSVG();
      if (svgString) {
        downloadSVG(svgString, `geopattern-${timestamp}.svg`);
      }
    } catch (error) {
      console.error('Export SVG failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveToServer = async () => {
    if (!canvasRef.current) return;
    try {
      setSaveStatus('saving');
      const svgString = canvasRef.current.exportSVG();
      const thumbnailBase64 = canvasRef.current.generateThumbnail();

      const response = await axios.post('/api/patterns', {
        svgString,
        thumbnailBase64,
        params,
      });

      if (response.data.success) {
        addSavedPattern(response.data.pattern);
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Save to server failed:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#1a1a2e] border border-gray-700 rounded-2xl shadow-2xl
                      w-full max-w-md mx-4 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-bold text-gray-100">导出图案</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-200
                       transition-colors duration-200"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-400">
            选择导出格式下载图案，或保存到服务器图案库中。
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="flex flex-col items-center gap-2 p-4
                         bg-gradient-to-br from-indigo-600/20 to-purple-600/20
                         border border-indigo-500/30 hover:border-indigo-400
                         rounded-xl text-gray-200 hover:text-white
                         transition-all duration-300 ease-out
                         hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              ) : (
                <ImageIcon className="w-8 h-8 text-indigo-400" />
              )}
              <span className="text-sm font-medium">PNG 位图</span>
              <span className="text-xs text-gray-500">高清像素格式</span>
            </button>

            <button
              onClick={handleExportSVG}
              disabled={exporting}
              className="flex flex-col items-center gap-2 p-4
                         bg-gradient-to-br from-purple-600/20 to-pink-600/20
                         border border-purple-500/30 hover:border-purple-400
                         rounded-xl text-gray-200 hover:text-white
                         transition-all duration-300 ease-out
                         hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              ) : (
                <FileCode className="w-8 h-8 text-purple-400" />
              )}
              <span className="text-sm font-medium">SVG 矢量</span>
              <span className="text-xs text-gray-500">无限缩放格式</span>
            </button>
          </div>

          <div className="pt-3 border-t border-gray-700">
            <button
              onClick={handleSaveToServer}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4
                         bg-gradient-to-r from-emerald-600 to-teal-600
                         hover:from-emerald-500 hover:to-teal-500
                         text-white rounded-xl font-medium
                         transition-all duration-300 ease-out
                         hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5
                         disabled:opacity-60 disabled:cursor-not-allowed
                         disabled:hover:translate-y-0"
            >
              {saveStatus === 'saving' && <Loader2 className="w-5 h-5 animate-spin" />}
              {saveStatus === 'saved' && <Save className="w-5 h-5" />}
              {saveStatus === 'idle' && (
                <>
                  <Save className="w-5 h-5" />
                  <span>保存到图案库</span>
                </>
              )}
              {saveStatus === 'saving' && <span>正在保存...</span>}
              {saveStatus === 'saved' && <span>保存成功！</span>}
              {saveStatus === 'error' && <span>保存失败，请重试</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
