import { NEBULA_PRESET_LIST, NebulaPreset, NebulaPresetId } from '@/utils/colors';
import { useNebulaStore } from '@/store/nebulaStore';
import { Wand2 } from 'lucide-react';
import styles from './PresetSelector.module.css';

interface PresetSelectorProps {
  currentPresetId?: NebulaPresetId | null;
  onSelect?: (preset: NebulaPreset) => void;
}

export function PresetSelector({ currentPresetId, onSelect }: PresetSelectorProps) {
  const applyPreset = useNebulaStore((state) => state.applyPreset);
  const density = useNebulaStore((state) => state.density);
  const turbulence = useNebulaStore((state) => state.turbulence);
  const colorMode = useNebulaStore((state) => state.colorMode);

  const isPresetActive = (preset: NebulaPreset): boolean => {
    if (currentPresetId) {
      return currentPresetId === preset.id;
    }
    return (
      Math.abs(density - preset.density) < 0.01 &&
      Math.abs(turbulence - preset.turbulence) < 0.5 &&
      colorMode === preset.colorMode
    );
  };

  const handlePresetClick = (preset: NebulaPreset) => {
    applyPreset(preset);
    if (onSelect) {
      onSelect(preset);
    }
  };

  return (
    <div className={styles.presetContainer}>
      <div className={styles.sectionHeader}>
        <Wand2 size={16} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>星云预设</h2>
      </div>
      <div className={styles.presetGrid}>
        {NEBULA_PRESET_LIST.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.id}
              className={`${styles.presetCard} ${active ? styles.active : ''}`}
              onClick={() => handlePresetClick(preset)}
            >
              <span className={styles.presetIcon}>{preset.icon}</span>
              <div className={styles.presetInfo}>
                <span className={styles.presetName}>{preset.name}</span>
                <span className={styles.presetDesc}>{preset.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PresetSelector;
