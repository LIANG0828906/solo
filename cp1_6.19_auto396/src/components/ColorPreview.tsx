import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePaletteStore } from '../store/paletteStore';
import { mixColors, generateWatercolorTexture } from '../utils/colorMixer';

const ColorPreview: React.FC = () => {
  const baseColor = usePaletteStore((state) => state.baseColor);
  const addColors = usePaletteStore((state) => state.addColors);
  const ratios = usePaletteStore((state) => state.ratios);
  const saveRecipe = usePaletteStore((state) => state.saveRecipe);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recipeName, setRecipeName] = useState('');

  const mixedColor = useMemo(() => {
    return mixColors(
      baseColor,
      addColors.map((ac) => ac.color),
      ratios
    );
  }, [baseColor, addColors, ratios]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    generateWatercolorTexture(canvas, mixedColor, 0.05);
  }, [mixedColor]);

  const handleSave = () => {
    saveRecipe(recipeName.trim());
    setRecipeName('');
  };

  return (
    <div className="color-preview-container">
      <div className="section-title" style={{ alignSelf: 'flex-start' }}>
        混合预览
      </div>
      <canvas
        ref={canvasRef}
        className="color-preview-canvas"
      />
      <input
        type="text"
        className="recipe-name-input"
        placeholder="输入配方名称（最多20字）"
        value={recipeName}
        onChange={(e) => setRecipeName(e.target.value.slice(0, 20))}
        maxLength={20}
      />
      <button className="save-btn" onClick={handleSave}>
        保存配方
      </button>
    </div>
  );
};

export default ColorPreview;
