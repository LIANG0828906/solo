import React from 'react';
import { useStarContext } from '../context/StarContext';
import { useStarData } from '../hooks/useStarData';

const NavBar: React.FC = () => {
  const { selectedBody } = useStarContext();
  const { loading } = useStarData();

  const formatCoords = (x: number, y: number, z: number) => {
    const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1);
    return `${fmt(x)}, ${fmt(y)}, ${fmt(z)}`;
  };

  const getFocusInfo = () => {
    if (loading) {
      return { name: '加载星系数据...', coords: '—, —, —' };
    }
    if (!selectedBody) {
      return { name: '自由漫游模式', coords: formatCoords(0, 0, 0) };
    }
    if (selectedBody.type === 'star') {
      return {
        name: selectedBody.data.name,
        coords: formatCoords(
          selectedBody.data.coordinates.x,
          selectedBody.data.coordinates.y,
          selectedBody.data.coordinates.z
        ),
      };
    }
    return {
      name: selectedBody.data.name,
      coords: `${selectedBody.parentStar.name} · ${selectedBody.data.type}`,
    };
  };

  const info = getFocusInfo();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon" />
        <span>
          STAR<span style={{ color: 'var(--color-neon-purple)' }}>VOYAGER</span>
        </span>
      </div>

      <div className="navbar-focus">
        {loading ? (
          <div className="navbar-loading">
            <div className="loading-spinner" />
            <span>正在初始化星图数据库...</span>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="navbar-focus-label">当前聚焦</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div className="navbar-focus-name" title={info.name}>
                {info.name}
              </div>
              <div className="navbar-focus-coords">{info.coords}</div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        <span>
          星系 v1.0
        </span>
      </div>
    </nav>
  );
};

export default NavBar;
