import { useMemo, useState } from 'react';
import { useTokenStore } from '../store/tokenStore';
import './TokenTable.css';

export function TokenTable() {
  const tokens = useTokenStore((state) => state.tokens);
  const activeCategory = useTokenStore((state) => state.activeCategory);
  const updateToken = useTokenStore((state) => state.updateToken);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredTokens = useMemo(() => {
    if (activeCategory === 'all') return tokens;
    return tokens.filter((t) => t.category === activeCategory);
  }, [tokens, activeCategory]);

  const handleValueClick = (id: string, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const handleValueChange = (id: string) => {
    updateToken(id, editValue);
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleValueChange(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const isColorToken = (value: string) => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(value);
  };

  return (
    <div className="token-table-container">
      <table className="token-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>类别</th>
            <th>值</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          {filteredTokens.map((token) => (
            <tr key={token.id} className="token-row">
              <td className="token-name">{token.name}</td>
              <td className="token-category">
                <span className={`category-badge category-${token.category}`}>
                  {token.category}
                </span>
              </td>
              <td className="token-value">
                {editingId === token.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleValueChange(token.id)}
                    onKeyDown={(e) => handleKeyDown(e, token.id)}
                    autoFocus
                    className="value-input"
                  />
                ) : (
                  <div
                    className="value-display"
                    onClick={() => handleValueClick(token.id, token.value)}
                  >
                    {isColorToken(token.value) && (
                      <span
                        className="color-swatch"
                        style={{ backgroundColor: token.value }}
                      />
                    )}
                    <span className="value-text">{token.value}</span>
                  </div>
                )}
              </td>
              <td className="token-description">{token.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredTokens.length === 0 && (
        <div className="empty-state">暂无令牌数据</div>
      )}
    </div>
  );
}
