import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorPaletteCard } from './ColorPaletteCard';
import { usePaletteStore } from '../store/usePaletteStore';
import './PaletteGrid.css';

interface PaletteGridProps {
  sortKey: number;
  onEdit: (palette: { id: string; name: string; colors: string[] }) => void;
  onDelete: (id: string) => void;
}

export function PaletteGrid({ sortKey, onEdit, onDelete }: PaletteGridProps) {
  const navigate = useNavigate();
  const { palettes, searchQuery, getFilteredPalettes } = usePaletteStore();

  const filteredPalettes = useMemo(() => getFilteredPalettes(), [getFilteredPalettes]);

  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.toLowerCase();

  const handleCardClick = (id: string) => {
    navigate(`/palette/${id}`);
  };

  return (
    <div className="palette-grid" key={sortKey}>
      {palettes.map((palette, index) => {
        const isFiltered =
          isSearching &&
          !palette.name.toLowerCase().includes(searchLower) &&
          !palette.author.toLowerCase().includes(searchLower);

        return (
          <ColorPaletteCard
            key={palette.id}
            palette={palette}
            index={index}
            isFiltered={isFiltered}
            onClick={() => handleCardClick(palette.id)}
            onEdit={() =>
              onEdit({
                id: palette.id,
                name: palette.name,
                colors: palette.colors,
              })
            }
            onDelete={() => onDelete(palette.id)}
          />
        );
      })}
    </div>
  );
}
