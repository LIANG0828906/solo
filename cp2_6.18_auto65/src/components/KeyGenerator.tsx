import { useState } from 'react';
import { useKeyStore } from '../store/keyStore';
import type { KeyRole } from '../types';

export function KeyGenerator() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<KeyRole>('reader');
  const addKey = useKeyStore((state) => state.addKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addKey(name.trim(), role);
    setName('');
    setRole('reader');
  };

  return (
    <div className="card">
      <h2 className="card-title">生成新密钥</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">密钥名称</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            placeholder="输入密钥名称（最多50字符）"
            maxLength={50}
          />
        </div>
        <div className="form-group">
          <label className="form-label">角色权限</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value as KeyRole)}
          >
            <option value="admin">Admin - 管理员</option>
            <option value="editor">Editor - 编辑者</option>
            <option value="reader">Reader - 只读</option>
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim()}
        >
          生成密钥
        </button>
      </form>
    </div>
  );
}
