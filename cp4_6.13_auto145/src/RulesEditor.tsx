import React, { useState } from 'react';
import { Rule } from './types';

interface RulesEditorProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

const RulesEditor: React.FC<RulesEditorProps> = ({ rules, onRulesChange }) => {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: '',
    type: 'keyword',
    pattern: '',
    weight: 10,
    suggestion: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' ? parseInt(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'keyword',
      pattern: '',
      weight: 10,
      suggestion: ''
    });
    setEditingRule(null);
    setIsAdding(false);
  };

  const handleAddRule = () => {
    setIsAdding(true);
    setEditingRule(null);
    resetForm();
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsAdding(false);
    setFormData({ ...rule });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    try {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedRules = rules.filter(r => r.id !== ruleId);
        onRulesChange(updatedRules);
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除规则失败:', error);
      alert('删除规则失败，请重试');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingRule) {
        const response = await fetch(`/api/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const updatedRule = await response.json();
          const updatedRules = rules.map(r => 
            r.id === editingRule.id ? updatedRule : r
          );
          onRulesChange(updatedRules);
          resetForm();
        } else {
          throw new Error('更新失败');
        }
      } else if (isAdding) {
        const response = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const newRule = await response.json();
          const updatedRules = [...rules, newRule];
          onRulesChange(updatedRules);
          resetForm();
        } else {
          throw new Error('添加失败');
        }
      }
    } catch (error) {
      console.error('保存规则失败:', error);
      alert('保存规则失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      regex: '正则表达式',
      keyword: '关键词',
      structural: '结构性'
    };
    return labels[type] || type;
  };

  return (
    <div className="panel-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">规则管理</h3>
        {!isAdding && !editingRule && (
          <button className="btn btn-primary btn-sm" onClick={handleAddRule}>
            + 新增规则
          </button>
        )}
      </div>

      {(isAdding || editingRule) && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-light)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>
            {editingRule ? '编辑规则' : '新增规则'}
          </h4>

          <div className="form-group">
            <label className="form-label">规则名称</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="例如：包含实验目的"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">规则类型</label>
              <select
                name="type"
                className="form-select"
                value={formData.type || 'keyword'}
                onChange={handleInputChange}
              >
                <option value="keyword">关键词</option>
                <option value="regex">正则表达式</option>
                <option value="structural">结构性</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">权重</label>
              <input
                type="number"
                name="weight"
                className="form-input"
                value={formData.weight || 10}
                onChange={handleInputChange}
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">匹配模式</label>
            <input
              type="text"
              name="pattern"
              className="form-input"
              value={formData.pattern || ''}
              onChange={handleInputChange}
              placeholder={formData.type === 'regex' ? '例如：^实验目的' : '例如：实验目的'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">修改建议</label>
            <textarea
              name="suggestion"
              className="form-textarea"
              value={formData.suggestion || ''}
              onChange={handleInputChange}
              placeholder="例如：建议在报告开头明确说明实验目的"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="loading-spinner" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              取消
            </button>
          </div>
        </form>
      )}

      <div className="rules-list">
        {rules.map(rule => (
          <div key={rule.id} className="rule-item">
            <div className="rule-item-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="rule-item-name">{rule.name}</div>
                <span className="weight-badge">权重 {rule.weight}</span>
              </div>
              <div className="rule-item-type">
                {getTypeLabel(rule.type)} · {rule.pattern}
              </div>
            </div>
            <div className="rule-item-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleEditRule(rule)}
              >
                编辑
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteRule(rule.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>
          暂无规则，点击上方按钮添加
        </div>
      )}
    </div>
  );
};

export default RulesEditor;
