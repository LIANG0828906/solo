import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useUiController as useStore } from '../module3/uiController';

interface FavoriteButtonProps {
  recipeId: string;
}

export default function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const { currentUser, toggleFavorite, userFavorites } = useStore();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsFavorite(userFavorites.some(f => f.id === recipeId));
    }
  }, [currentUser, userFavorites, recipeId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    const result = await toggleFavorite(recipeId);
    setIsFavorite(result);
  };

  return (
    <button
      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
      onClick={handleClick}
    >
      <Heart className="heart" />
    </button>
  );
}
