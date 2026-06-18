import React from 'react';
import { useLandmarkStore } from '../store/landmarkStore';
import { MapPinIcon, StarIcon } from './Icons';

const Navbar: React.FC = () => {
  const { cities, currentCityId, setCurrentCity, favoriteIds, setShowFavoritesSidebar } = useLandmarkStore();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <MapPinIcon className="navbar-logo-icon" />
        <span>CityLens</span>
      </div>

      <div className="city-selector">
        {cities.map((city) => (
          <button
            key={city.id}
            className={`city-btn ${city.id === currentCityId ? 'active' : ''}`}
            onClick={() => setCurrentCity(city.id)}
          >
            {city.name}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        <button
          className="favorites-btn"
          onClick={() => setShowFavoritesSidebar(true)}
          title="我的收藏"
        >
          <StarIcon filled style={{ width: 24, height: 24 }} />
          {favoriteIds.length > 0 && (
            <span className="favorites-count">{favoriteIds.length}</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
