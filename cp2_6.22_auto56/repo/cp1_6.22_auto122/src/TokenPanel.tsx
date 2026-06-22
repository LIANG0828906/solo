import { useState, useCallback } from 'react';
import { useTokenStore } from './store/tokenStore';
import type { Token, TokenType } from './types';

interface TokenItemProps {
  token: Token;
}

function TokenItem({ token }: TokenItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(token.name);
  const [editValue, setEditValue] = useState(token.value);
  const [editGroup, setEditGroup] = useState(token.group);
  const [showCopied, setShowCopied] = useState(false);
  const updateToken = useTokenStore((state) => state.updateToken);
  const deleteToken = useTokenStore((state) => state.deleteToken);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(token.value);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  }, [token.value]);

  const handleSave = useCallback(() => {
    updateToken(token.id, {
      name: editName,
      value: editValue,
      group: editGroup,
    });
    setIsEditing(false);
  }, [token.id, editName, editValue, editGroup, updateToken]);

  const handleCancel = useCallback(() => {
    setEditName(token.name);
    setEditValue(token.value);
    setEditGroup(token.group);
    setIsEditing(false);
  }, [token.name, token.value, token.group]);

  const renderValuePreview = () => {
    if (token.type === 'color') {
      return (
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: token.value,
            border: '2px solid #3A3A4E',
            flexShrink: 0,
          }}
        />
      );
    }
    if (token.type === 'spacing') {
      return (
        <span style={{ fontSize: '13px', color: '#A0A0B0' }}>
          {token.value}px
        </span>
      );
    }
    return (
      <span style={{ fontSize: '13px', color: '#A0A0B0' }}>
        {token.value}
      </span>
    );
  };

  const renderValueEditor = () => {
    if (token.type === 'color') {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={editValue.startsWith('#') ? editValue : '#6366F1'}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              width: '40px',
              height: '32px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
            }}
          />
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="#FFFFFF 或 hsl(0, 0%, 100%)"
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: '#1E1E2E',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#E0E0F0',
              fontSize: '13px',
            }}
          />
        </div>
      );
    }
    if (token.type === 'spacing') {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={parseInt(editValue, 10) || 0}
            onChange={(e) => setEditValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              width: '60px',
              padding: '6px 10px',
              backgroundColor: '#1E1E2E',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#E0E0F0',
              fontSize: '13px',
            }}
          />
          <span style={{ fontSize: '13px', color: '#A0A0B0' }}>px</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {token.name === 'fontFamily' ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: '#1E1E2E',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#E0E0F0',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="system-ui">system-ui</option>
            <option value="-apple-system">-apple-system</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="Roboto">Roboto</option>
            <option value="Helvetica Neue">Helvetica Neue</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        ) : (
          <>
            <input
              type="range"
              min="10"
              max="72"
              value={parseInt(editValue, 10) || 16}
              onChange={(e) => setEditValue(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min="10"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{
                width: '60px',
                padding: '6px 10px',
                backgroundColor: '#1E1E2E',
                border: '1px solid #3A3A4E',
                borderRadius: '6px',
                color: '#E0E0F0',
                fontSize: '13px',
              }}
            />
            <span style={{ fontSize: '13px', color: '#A0A0B0' }}>px</span>
          </>
        )}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: '#1E1E2E',
          border: '1px solid #6366F1',
          borderRadius: '8px',
          marginBottom: '8px',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
            名称
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#2A2A3E',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#E0E0F0',
              fontSize: '13px',
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
            分组
          </label>
          <input
            type="text"
            value={editGroup}
            onChange={(e) => setEditGroup(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#2A2A3E',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#E0E0F0',
              fontSize: '13px',
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
            值
          </label>
          {renderValueEditor()}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #3A3A4E',
              borderRadius: '6px',
              color: '#A0A0B0',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#3A3A4E';
              e.currentTarget.style.color = '#E0E0F0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#A0A0B0';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 14px',
              backgroundColor: '#6366F1',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#818CF8')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6366F1')}
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        backgroundColor: 'transparent',
        borderRadius: '8px',
        marginBottom: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        position: 'relative',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1E1E2E')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {renderValuePreview()}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#E0E0F0' }}>
          {token.name}
        </div>
        <div style={{ fontSize: '12px', color: '#707080' }}>
          {token.group}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            borderRadius: '6px',
            color: '#A0A0B0',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#3A3A4E';
            e.currentTarget.style.color = '#E0E0F0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#A0A0B0';
          }}
        >
          复制
        </button>
        {showCopied && (
          <div
            style={{
              position: 'absolute',
              top: '-32px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#10B981',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              animation: 'bubble 1.5s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            已复制!
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteToken(token.id);
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            borderRadius: '6px',
            color: '#A0A0B0',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#EF4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#A0A0B0';
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

interface GroupCardProps {
  groupName: string;
  tokens: Token[];
}

function GroupCard({ groupName, tokens }: GroupCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      style={{
        backgroundColor: '#2A2A3E',
        border: '1px solid #3A3A4E',
        borderRadius: '12px',
        marginBottom: '16px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#6366F1';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#3A3A4E';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#E0E0F0', textTransform: 'capitalize' }}>
          {groupName}
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: '#707080',
            backgroundColor: '#1E1E2E',
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          {tokens.length} 个令牌
        </span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #3A3A4E' }}>
          {tokens.map((token) => (
            <TokenItem key={token.id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TokenPanel() {
  const tokens = useTokenStore((state) => state.tokens);
  const addToken = useTokenStore((state) => state.addToken);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTokenType, setNewTokenType] = useState<TokenType>('color');
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenGroup, setNewTokenGroup] = useState('');
  const [newTokenValue, setNewTokenValue] = useState('');

  const groups = tokens.reduce((acc, token) => {
    if (!acc[token.group]) {
      acc[token.group] = [];
    }
    acc[token.group].push(token);
    return acc;
  }, {} as Record<string, Token[]>);

  const handleAddToken = useCallback(() => {
    if (!newTokenName.trim() || !newTokenValue.trim()) {
      return;
    }
    addToken({
      name: newTokenName.trim(),
      group: newTokenGroup.trim() || getDefaultGroup(newTokenType),
      type: newTokenType,
      value: newTokenValue.trim(),
    });
    setNewTokenName('');
    setNewTokenGroup('');
    setNewTokenValue(newTokenType === 'color' ? '#6366F1' : '16');
    setShowAddForm(false);
  }, [newTokenName, newTokenGroup, newTokenType, newTokenValue, addToken]);

  const getDefaultGroup = (type: TokenType): string => {
    switch (type) {
      case 'color': return 'colors';
      case 'spacing': return 'spacing';
      case 'font': return 'typography';
    }
  };

  const handleTypeChange = (type: TokenType) => {
    setNewTokenType(type);
    setNewTokenValue(type === 'color' ? '#6366F1' : '16');
  };

  return (
    <div>
      <button
        onClick={() => setShowAddForm(true)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2A2A3E',
          border: '2px dashed #3A3A4E',
          borderRadius: '12px',
          color: '#A0A0B0',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '20px',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#6366F1';
          e.currentTarget.style.color = '#6366F1';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#3A3A4E';
          e.currentTarget.style.color = '#A0A0B0';
        }}
      >
        + 新增令牌
      </button>

      {showAddForm && (
        <div
          style={{
            backgroundColor: '#2A2A3E',
            border: '1px solid #6366F1',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0F0', marginBottom: '12px' }}>
            新增令牌
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '6px' }}>
              类型
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['color', 'spacing', 'font'] as TokenType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: newTokenType === type ? '#6366F1' : '#1E1E2E',
                    border: '1px solid #3A3A4E',
                    borderRadius: '6px',
                    color: newTokenType === type ? '#fff' : '#A0A0B0',
                    fontSize: '13px',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'color' ? '颜色' : type === 'spacing' ? '间距' : '字体'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
              名称
            </label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="如 primary、md、fontSize"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1E1E2E',
                border: '1px solid #3A3A4E',
                borderRadius: '6px',
                color: '#E0E0F0',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
              分组（可选）
            </label>
            <input
              type="text"
              value={newTokenGroup}
              onChange={(e) => setNewTokenGroup(e.target.value)}
              placeholder={getDefaultGroup(newTokenType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1E1E2E',
                border: '1px solid #3A3A4E',
                borderRadius: '6px',
                color: '#E0E0F0',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#A0A0B0', marginBottom: '4px' }}>
              值
            </label>
            {newTokenType === 'color' ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={newTokenValue || '#6366F1'}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  style={{
                    width: '40px',
                    height: '36px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={newTokenValue}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  placeholder="#FFFFFF 或 hsl(0, 0%, 100%)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #3A3A4E',
                    borderRadius: '6px',
                    color: '#E0E0F0',
                    fontSize: '13px',
                  }}
                />
              </div>
            ) : newTokenType === 'spacing' ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={parseInt(newTokenValue, 10) || 0}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min="0"
                  value={newTokenValue}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  style={{
                    width: '70px',
                    padding: '8px 12px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #3A3A4E',
                    borderRadius: '6px',
                    color: '#E0E0F0',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#A0A0B0' }}>px</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="range"
                  min="10"
                  max="72"
                  value={parseInt(newTokenValue, 10) || 16}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min="10"
                  value={newTokenValue}
                  onChange={(e) => setNewTokenValue(e.target.value)}
                  style={{
                    width: '70px',
                    padding: '8px 12px',
                    backgroundColor: '#1E1E2E',
                    border: '1px solid #3A3A4E',
                    borderRadius: '6px',
                    color: '#E0E0F0',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#A0A0B0' }}>px</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #3A3A4E',
                borderRadius: '6px',
                color: '#A0A0B0',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3A3A4E';
                e.currentTarget.style.color = '#E0E0F0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#A0A0B0';
              }}
            >
              取消
            </button>
            <button
              onClick={handleAddToken}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6366F1',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#818CF8')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6366F1')}
            >
              添加
            </button>
          </div>
        </div>
      )}

      {Object.entries(groups).map(([groupName, groupTokens]) => (
        <GroupCard key={groupName} groupName={groupName} tokens={groupTokens} />
      ))}
    </div>
  );
}
