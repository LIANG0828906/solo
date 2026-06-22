import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import CharacterSheet from '../modules/character/CharacterSheet';
import InventoryPanel from './InventoryPanel';
import StatusBar from './StatusBar';
import './GameLayout.css';

function GameLayout() {
  const { character, inventoryOpen, toggleInventory } = useGameStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!character) return null;

  const classNameMap: Record<string, string> = {
    warrior: '战士',
    mage: '法师',
    rogue: '盗贼',
    cleric: '牧师',
  };

  return (
    <div className="game-container">
      <div className="left-panel">
        <div className="player-status-card parchment-panel">
          <div className="player-avatar-info">
            <div
              className={`player-avatar shape-${character.avatarShape}`}
              style={{ backgroundColor: character.avatarColor }}
            >
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div className="player-basic-info">
              <h3>{character.name}</h3>
              <p className="player-class-level">
                {classNameMap[character.class]} · Lv.{character.level}
              </p>
            </div>
          </div>
          <div className="status-bars">
            <StatusBar
              type="health"
              current={character.currentHealth}
              max={character.maxHealth}
              label="生命"
            />
            <StatusBar
              type="mana"
              current={character.currentMana}
              max={character.maxMana}
              label="法力"
            />
            <div className="exp-bar">
              <span className="exp-label">经验</span>
              <div className="status-bar exp-bar-inner">
                <div
                  className="status-bar-fill"
                  style={{
                    width: `${(character.experience / character.experienceToNext) * 100}%`,
                    background:
                      'linear-gradient(to bottom, #f1c40f 0%, #d4a017 50%, #b8860b 100%)',
                  }}
                />
              </div>
              <span className="exp-text">
                {character.experience}/{character.experienceToNext}
              </span>
            </div>
          </div>
          <div className="gold-display">
            <span className="gold-icon">💰</span>
            <span>{character.gold} 金币</span>
          </div>
        </div>

        <div className="nav-buttons">
          <button
            className={`btn-secondary ${location.pathname === '/game' ? 'active' : ''}`}
            onClick={() => navigate('/game')}
          >
            🗺️ 地牢
          </button>
          <button
            className={`btn-secondary ${location.pathname === '/game/character' ? 'active' : ''}`}
            onClick={() => navigate('/game/character')}
          >
            📜 角色
          </button>
          <button className="btn-secondary" onClick={toggleInventory}>
            🎒 背包
          </button>
        </div>

        <CharacterSheet compact />
      </div>

      <div className="right-panel">
        <Outlet />
      </div>

      {inventoryOpen && <InventoryPanel />}
    </div>
  );
}

export default GameLayout;
