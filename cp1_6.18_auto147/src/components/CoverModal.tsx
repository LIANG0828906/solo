import { useState } from 'react';
import { X, RefreshCw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoverStyle, CoverKeyword } from '@/types';
import { generateCover } from '@/engine/coverGenerator';

interface CoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (svg: string, style: string, keyword: string) => void;
}

const styles: CoverStyle[] = ['爵士暖调', '电子冷感', '民谣清新', '古典典雅'];
const keywords: CoverKeyword[] = ['慵懒', '深邃', '明亮', '忧郁'];

export default function CoverModal({ isOpen, onClose, onSave }: CoverModalProps) {
  const [selectedStyle, setSelectedStyle] = useState<CoverStyle>(styles[0]);
  const [selectedKeyword, setSelectedKeyword] = useState<CoverKeyword>(keywords[0]);
  const [generatedSvg, setGeneratedSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const svg = generateCover(selectedStyle, selectedKeyword);
    setGeneratedSvg(svg);
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (generatedSvg) {
      onSave(generatedSvg, selectedStyle, selectedKeyword);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: '#00000080' }}
      onClick={handleOverlayClick}
    >
      <div
        className="rounded-xl p-6 w-[500px] shadow-2xl"
        style={{ backgroundColor: '#1A1A2E' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-lg font-semibold">生成封面</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-gray-300 text-sm font-medium block mb-2">风格选择</label>
          <div className="flex gap-2 flex-wrap">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedStyle === style
                    ? 'text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
                style={{
                  backgroundColor: selectedStyle === style ? '#533483' : undefined,
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-gray-300 text-sm font-medium block mb-2">关键词选择</label>
          <div className="flex gap-2 flex-wrap">
            {keywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => setSelectedKeyword(keyword)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedKeyword === keyword
                    ? 'text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
                style={{
                  backgroundColor: selectedKeyword === keyword ? '#533483' : undefined,
                }}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div
            className="w-[240px] h-[240px] rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              backgroundColor: '#16213E',
            }}
          >
            {generatedSvg ? (
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: generatedSvg }}
              />
            ) : (
              <span className="text-gray-500 text-sm">点击生成按钮预览封面</span>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{
              backgroundColor: '#533483',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#6A4C93';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#533483';
              }
            }}
          >
            <RefreshCw size={16} className={cn(isGenerating && 'animate-spin')} />
            {isGenerating ? '生成中...' : '生成封面'}
          </button>

          <button
            onClick={handleSave}
            disabled={!generatedSvg}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{
              backgroundColor: '#E94560',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#FF6B6B';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#E94560';
              }
            }}
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
