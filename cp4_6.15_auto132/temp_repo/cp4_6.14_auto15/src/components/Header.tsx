import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Header() {
  const favoriteCount = useStore((state) => state.favorites.length);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          🍳 美食食谱
        </Link>
        <div className="favorite-count">
          <span>❤️</span>
          <span>{favoriteCount}</span>
        </div>
      </div>
    </header>
  );
}
