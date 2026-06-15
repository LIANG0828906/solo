import React, { useCallback } from 'react';
import { useAppStore } from '../store';
import { useColorScheme } from '../hooks/useColorScheme';
import { playDropSound } from '../utils/audioUtils';
import { mapColorToScheme } from '../utils/colorUtils';
import { COLOR_SCHEMES } from '../data/materials';

interface ColorSchemePanelProps {
  layout: 'vertical' | 'horizontal';
}

export const ColorSchemePanel: React.FC<ColorSchemePanelProps> = ({ layout }) => {
  const { colorScheme: currentSchemeId, setColorScheme, placedMaterials, updateMaterial, materials } =
    useAppStore();
  const { schemes, animateColors } = useColorScheme(currentSchemeId);

  const handleSchemeClick = useCallback(
    (schemeId: string) => {
      if (schemeId === currentSchemeId) return;

      const targetScheme = COLOR_SCHEMES.find((s) => s.id === schemeId);
      if (!targetScheme) return;

      const colorTransitions = placedMaterials
        .map((placed) => {
          const material = materials.find((m) => m.id === placed.materialId);
          if (!material) return null;

          const toColor = mapColorToScheme(material.baseColor, targetScheme);

          return {
            id: placed.id,
            fromColor: placed.currentColor,
            toColor,
          };
        })
        .filter(Boolean) as { id: string; fromColor: string; toColor: string }[];

      setColorScheme(schemeId);
      playDropSound();

      if (colorTransitions.length > 0) {
        animateColors(
          colorTransitions,
          (id, color) => {
            updateMaterial(id, { currentColor: color });
          },
          500
        );
      }
    },
    [currentSchemeId, placedMaterials, materials, setColorScheme, animateColors, updateMaterial]
  );

  return (
    <div
      className="p-4"
      style={{
        background: '#f5deb3',
        border: '1px dashed #d2b48c',
        borderRadius: '4px',
        boxShadow: '2px 2px 8px rgba(141, 110, 99, 0.3)',
        position: 'relative',
      }}
    >
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: '20px',
          height: '20px',
          background: 'linear-gradient(135deg, transparent 50%, #e8d4a0 50%)',
          borderLeft: '1px dashed #d2b48c',
          borderBottom: '1px dashed #d2b48c',
        }}
      />

      <h3
        className="text-sm mb-3 text-center"
        style={{
          fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
          color: '#3e2723',
          fontWeight: 'bold',
        }}
      >
        配色方案
      </h3>

      <div
        className={`flex ${
          layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap justify-center'
        } gap-2`}
      >
        {schemes.map((scheme) => (
          <button
            key={scheme.id}
            onClick={() => handleSchemeClick(scheme.id)}
            className={`p-2 rounded transition-all duration-200 flex items-center gap-2 ${
              currentSchemeId === scheme.id ? 'ring-2 ring-offset-1' : ''
            }`}
            style={{
              fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
              color: '#3e2723',
              background:
                currentSchemeId === scheme.id
                  ? 'rgba(141, 110, 99, 0.2)'
                  : 'rgba(255,255,255,0.5)',
              border: currentSchemeId === scheme.id ? '1px solid #3e2723' : '1px solid transparent',
              transform: 'translateY(0)',
              boxShadow:
                currentSchemeId === scheme.id ? 'inset 0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.background = 'rgba(141, 110, 99, 0.3)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (currentSchemeId !== scheme.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
              }
            }}
          >
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{
                background: `linear-gradient(135deg, ${scheme.startColor}, ${scheme.endColor})`,
              }}
            />
            <span className="text-xs">{scheme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
