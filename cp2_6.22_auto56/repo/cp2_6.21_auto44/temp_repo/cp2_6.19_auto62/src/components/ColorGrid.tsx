import { useMemo } from 'react';
import { useTokenStore } from '../store/tokenStore';
import './ColorGrid.css';

export function ColorGrid() {
  const tokens = useTokenStore((state) => state.tokens);
  const updateToken = useTokenStore((state) => state.updateToken);

  const colorTokens = useMemo(
    () => tokens.filter((t) => t.category === 'color'),
    [tokens]
  );

  const handleColorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    updateToken(id, e.target.value);
  };

  return (
    <div className="color-grid-section">
      <h3 className="section-title">颜色预览</h3>
      <div className="color-grid">
        {colorTokens.map((token) => (
          <label
            key={token.id}
            className="color-card"
            htmlFor={`color-picker-${token.id}`}
          >
            <div
              className="color-swatch-large"
              style={{ backgroundColor: token.value }}
            />
            <div className="color-info">
              <span className="color-name">{token.name}</span>
              <span className="color-hex">{token.value.toUpperCase()}</span>
            </div>
            <input
              id={`color-picker-${token.id}`}
              type="color"
              value={token.value}
              onChange={(e) => handleColorChange(token.id, e)}
              className="color-picker-input"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
