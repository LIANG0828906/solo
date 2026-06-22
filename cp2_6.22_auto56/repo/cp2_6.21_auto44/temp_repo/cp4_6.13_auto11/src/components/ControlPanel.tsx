import { useState } from 'react';
import type { Race, CharacterClass, ColorPart, CharacterColors } from '@/types/character';
import RaceSelector from './RaceSelector';
import ClassSelector from './ClassSelector';
import ColorPalette from './ColorPalette';
import ActionButtons from './ActionButtons';

interface ControlPanelProps {
  race: Race;
  characterClass: CharacterClass;
  colors: CharacterColors;
  activePart: ColorPart;
  isAnimating: boolean;
  isExporting: boolean;
  onRaceChange: (r: Race) => void;
  onClassChange: (c: CharacterClass) => void;
  onActivePartChange: (p: ColorPart) => void;
  onColorChange: (part: ColorPart, color: string) => void;
  onRandomize: () => void;
  onExport: () => void;
}

export default function ControlPanel(props: ControlPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const panelContent = (
    <>
      <div className="panel-header">
        <div className="panel-brand">
          <span className="brand-logo">⚔️</span>
          <span className="brand-title">PIXEL FORGE</span>
        </div>
        <div className="panel-subtitle">像素角色精灵生成器</div>
      </div>

      <div className="panel-scroll">
        <RaceSelector
          value={props.race}
          onChange={props.onRaceChange}
          disabled={props.isAnimating}
        />
        <ClassSelector
          value={props.characterClass}
          onChange={props.onClassChange}
          disabled={props.isAnimating}
        />
        <ColorPalette
          colors={props.colors}
          activePart={props.activePart}
          onPartChange={props.onActivePartChange}
          onColorChange={props.onColorChange}
          disabled={props.isAnimating}
        />
        <ActionButtons
          onRandomize={props.onRandomize}
          onExport={props.onExport}
          isAnimating={props.isAnimating}
          isExporting={props.isExporting}
        />
      </div>

      <div className="panel-footer">
        <span>v1.0.0</span>
        <span>Cyberpunk Edition</span>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="hamburger-btn"
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="切换控制面板"
      >
        <span className={`hamburger-line ${isMobileOpen ? 'open' : ''}`} />
      </button>

      <aside className={`control-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
        {panelContent}
      </aside>

      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
