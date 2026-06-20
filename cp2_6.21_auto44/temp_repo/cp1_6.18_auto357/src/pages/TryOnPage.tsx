import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Save, Palette, Scissors, Move } from 'lucide-react';
import { useClothingStore } from '../store/useClothingStore';
import { initScene, cleanupScene } from '../modules/threeRender';
import {
  handleSleeveLengthChange,
  handleClothingLengthChange,
  handleWaistFitChange,
  handleSwatchClick,
  resetDesignParams,
  SWATCH_COLORS,
  STYLE_OPTIONS,
} from '../modules/userInteraction';
import axios from 'axios';

export default function TryOnPage() {
  const navigate = useNavigate();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { clothing, designParams } = useClothingStore();
  const [activeSwatch, setActiveSwatch] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('retro');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (canvasContainerRef.current) {
      initScene(canvasContainerRef.current);
    }

    return () => {
      cleanupScene();
    };
  }, []);

  const onSleeveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleSleeveLengthChange(Number(e.target.value));
  }, []);

  const onLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleClothingLengthChange(Number(e.target.value));
  }, []);

  const onWaistChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleWaistFitChange(Number(e.target.value));
  }, []);

  const onSwatchClick = useCallback(async (color: string) => {
    setActiveSwatch(color);
    await handleSwatchClick(color);
  }, []);

  const handleReset = () => {
    resetDesignParams();
    setActiveSwatch(null);
  };

  const handleSave = async () => {
    if (!clothing.imageUrl) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('clothingImage', clothing.imageUrl);
      formData.append('designParams', JSON.stringify(designParams));
      formData.append('style', selectedStyle);

      await axios.post('/api/works', formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate('/upload');
  };

  const goToGallery = () => {
    navigate('/works');
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="flex-1 relative">
          <button
            onClick={goBack}
            className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/90 text-wood rounded-full flex items-center gap-2 btn-hover card-shadow"
          >
            <ArrowLeft size={18} />
            返回上传
          </button>

          <div
            ref={canvasContainerRef}
            className="w-full h-full min-h-[400px] lg:min-h-0"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full text-wood/70 text-sm">
            <Move size={16} />
            <span>拖拽可360度旋转查看</span>
          </div>
        </div>

        <div className="lg:w-96 bg-wood text-white p-6 overflow-y-auto">
          <h2 className="text-2xl font-serif mb-6">设计调整</h2>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Scissors size={18} className="text-paper/80" />
              <span className="font-medium">版型调整</span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-paper/80">袖长</span>
                  <span className="text-paper font-medium">
                    {designParams.sleeveLength === 0
                      ? '无袖'
                      : designParams.sleeveLength >= 100
                      ? '长袖'
                      : `${designParams.sleeveLength}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={designParams.sleeveLength}
                  onChange={onSleeveChange}
                  className="w-full custom-slider"
                />
                <div className="flex justify-between text-xs text-paper/50 mt-1">
                  <span>无袖</span>
                  <span>长袖</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-paper/80">衣长</span>
                  <span className="text-paper font-medium">
                    {designParams.clothingLength <= 25
                      ? '短款'
                      : designParams.clothingLength >= 75
                      ? '长款'
                      : '常规'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={designParams.clothingLength}
                  onChange={onLengthChange}
                  className="w-full custom-slider"
                />
                <div className="flex justify-between text-xs text-paper/50 mt-1">
                  <span>短款</span>
                  <span>长款</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-paper/80">腰身松紧</span>
                  <span className="text-paper font-medium">
                    {designParams.waistFit <= 25
                      ? '修身'
                      : designParams.waistFit >= 75
                      ? '宽松'
                      : '适中'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={designParams.waistFit}
                  onChange={onWaistChange}
                  className="w-full custom-slider"
                />
                <div className="flex justify-between text-xs text-paper/50 mt-1">
                  <span>修身</span>
                  <span>宽松</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={18} className="text-paper/80" />
              <span className="font-medium">颜色调整</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {SWATCH_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onSwatchClick(color)}
                  className={`swatch-btn ${activeSwatch === color ? 'active' : ''}`}
                  style={{ backgroundColor: color, borderColor: activeSwatch === color ? '#F5E6CA' : 'transparent' }}
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-paper/80">🏷️</span>
              <span className="font-medium">选择风格</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedStyle === style.id
                      ? 'bg-rust text-white'
                      : 'bg-white/10 text-paper/80 hover:bg-white/20'
                  }`}
                >
                  {style.icon} {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="w-full py-3 bg-white/10 text-paper rounded-full flex items-center justify-center gap-2 btn-hover hover:bg-white/20"
            >
              <RotateCcw size={18} />
              重置参数
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !clothing.imageUrl}
              className="w-full py-3 bg-rust text-white rounded-full flex items-center justify-center gap-2 btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </>
              ) : saved ? (
                <>✓ 保存成功</>
              ) : (
                <>
                  <Save size={18} />
                  保存改造成果
                </>
              )}
            </button>

            <button
              onClick={goToGallery}
              className="w-full py-3 bg-paper/20 text-paper rounded-full btn-hover hover:bg-paper/30"
            >
              浏览作品社区
            </button>
          </div>

          <div className="mt-8 p-4 bg-white/10 rounded-xl">
            <h3 className="font-medium mb-2">当前参数</h3>
            <div className="text-sm text-paper/70 space-y-1">
              <p>袖长: {designParams.sleeveLength}%</p>
              <p>衣长: {designParams.clothingLength}%</p>
              <p>腰身: {designParams.waistFit}%</p>
              {clothing.currentColor && (
                <p className="flex items-center gap-2">
                  颜色:
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-white/30"
                    style={{ backgroundColor: clothing.currentColor }}
                  />
                  {clothing.currentColor}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
