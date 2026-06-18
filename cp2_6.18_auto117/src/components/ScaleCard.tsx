import React, { useEffect } from 'react';
import type { FontScaleLevel } from '../types';
import { FONT_LIST } from '../utils/fontList';
import { SliderControl } from './SliderControl';
import { useScaleStore } from '../store/scaleStore';

interface ScaleCardProps {
  level: FontScaleLevel;
  isSelected: boolean;
}

export const ScaleCard: React.FC<ScaleCardProps> = React.memo(
  ({ level, isSelected }) => {
    const { updateLevel, selectLevel } = useScaleStore();

    useEffect(() => {
      if (isSelected) {
        document
          .querySelector(`[data-level-id="${level.id}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, [isSelected, level.id]);

    const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.scale-card-content')) return;
      selectLevel(level.id);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateLevel(level.id, { name: e.target.value });
    };

    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateLevel(level.id, { fontFamily: e.target.value });
    };

    const handleSliderChange = (key: keyof FontScaleLevel, value: number) => {
      updateLevel(level.id, { [key]: value } as Partial<FontScaleLevel>);
    };

    return (
      <div
        data-level-id={level.id}
        className={`scale-card ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick}
      >
        <div className="scale-card-header">
          <div>
            <div className="scale-card-title">{level.name}</div>
            <div className="scale-card-preview">
              {level.fontSize}px · {level.fontFamily}
            </div>
          </div>
          <div className={`expand-arrow ${isSelected ? 'expanded' : ''}`}>▼</div>
        </div>

        <div className={`scale-card-content ${isSelected ? 'expanded' : ''}`}>
          <div className="form-group">
            <label className="form-label">名称</label>
            <input
              type="text"
              className="name-input"
              value={level.name}
              onChange={handleNameChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">字体族</label>
            <select
              className="font-select"
              value={level.fontFamily}
              onChange={handleFontChange}
              onClick={(e) => e.stopPropagation()}
            >
              {FONT_LIST.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <SliderControl
            label="字号 (px)"
            value={level.fontSize}
            min={16}
            max={96}
            step={2}
            unit="px"
            onChange={(v) => handleSliderChange('fontSize', v)}
          />

          <SliderControl
            label="行高"
            value={level.lineHeight}
            min={1.0}
            max={2.0}
            step={0.1}
            onChange={(v) => handleSliderChange('lineHeight', v)}
          />

          <SliderControl
            label="字重"
            value={level.fontWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => handleSliderChange('fontWeight', v)}
          />

          <SliderControl
            label="字距 (em)"
            value={level.letterSpacing}
            min={-0.05}
            max={0.15}
            step={0.01}
            unit="em"
            onChange={(v) => handleSliderChange('letterSpacing', v)}
          />
        </div>
      </div>
    );
  }
);

ScaleCard.displayName = 'ScaleCard';
