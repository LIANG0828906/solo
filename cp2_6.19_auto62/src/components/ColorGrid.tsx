import { useRef, useMemo } from 'react';
import { useTokenStore } from '../store/tokenStore';
import './ColorGrid.css';

export function ColorGrid() {
  const tokens = useTokenStore((state) => state.tokens);
  const updateToken = useTokenStore((state) => state.updateToken);
  const colorInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const colorTokens = useMemo(
    () => tokens.filter((t) => t.category === 'color'),
    [tokens]
  );

  const handleColorClick = (id: string) => {
    const input = colorInputRefs.current.get(id);
    if (input) {
      input.click();
    }
  };

  const handleColorChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    updateToken(id, e.target.value);
  };

  const setInputRef = (id: string, el: HTMLInputElement | null) => {
    colorInputRefs.current.set(id, el);
  };

  return (
    <div className="color-grid-section">
      <h3 className="section-title">颜色预览</h3>
      <div className="color-grid">
        {colorTokens.map((token) => (
          <div
            key={token.id}
            className="color-card"
            onClick={() => handleColorClick(token.id)}
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
              type="color"
              ref={(el) => setInputRef(token.id, el)}
              value={token.value}
              onChange={(e) => handleColorChange(token.id, e)}
              className="color-picker-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
