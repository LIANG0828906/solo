import { useColorCardStore } from '../store/ColorCardStore';
import type { ColorCard as ColorCardType } from '../types';
import './ColorCard.css';

interface ColorCardProps {
  card: ColorCardType;
  index: number;
}

export function ColorCard({ card, index }: ColorCardProps) {
  const setCurrentCard = useColorCardStore((state) => state.setCurrentCard);

  const displayTags = card.tags.slice(0, 3);
  const hasMore = card.tags.length > 3;

  const handleClick = () => {
    setCurrentCard(card);
  };

  return (
    <div
      className="color-card"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={handleClick}
    >
      <div
        className="color-card__swatch"
        style={{ backgroundColor: card.hex }}
      />
      <div className="color-card__content">
        <h3 className="color-card__name">{card.name}</h3>
        <p className="color-card__date">{card.createdAt}</p>
        <div className="color-card__tags">
          {displayTags.map((tag) => (
            <span key={tag} className="color-card__tag">
              {tag}
            </span>
          ))}
          {hasMore && <span className="color-card__tag">...</span>}
        </div>
      </div>
    </div>
  );
}
