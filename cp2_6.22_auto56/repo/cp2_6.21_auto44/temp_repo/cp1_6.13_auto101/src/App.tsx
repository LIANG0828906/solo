import ControlPanel from './ui/ControlPanel';
import { StarData, SpectralType } from './stars/types';

interface AppProps {
  selectedStar: StarData | null;
  brightness: number;
  activeFilters: SpectralType[];
  onBrightnessChange: (value: number) => void;
  onFilterChange: (filters: SpectralType[]) => void;
}

export default function App({
  selectedStar,
  brightness,
  activeFilters,
  onBrightnessChange,
  onFilterChange,
}: AppProps) {
  return (
    <ControlPanel
      selectedStar={selectedStar}
      brightness={brightness}
      activeFilters={activeFilters}
      onBrightnessChange={onBrightnessChange}
      onFilterChange={onFilterChange}
    />
  );
}
