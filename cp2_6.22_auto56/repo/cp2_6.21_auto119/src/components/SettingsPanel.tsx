import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { useBookmarkStore } from '@/store';
import type { CategoryRule } from '@/types';
import styles from './SettingsPanel.module.css';

interface EditingRule {
  id: string;
  name: string;
  type: 'url' | 'title';
  keyword: string;
  category: string;
}

export const SettingsPanel: React.FC = () => {
  const showSettings = useBookmarkStore((state) => state.showSettings);
  const setShowSettings = useBookmarkStore((state) => state.setShowSettings);
  const rules = useBookmarkStore((state) => state.rules);
  const addRule = useBookmarkStore((state) => state.addRule);
  const updateRule = useBookmarkStore((state) => state.updateRule);
  const deleteRule = useBookmarkStore((state) => state.deleteRule);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<EditingRule>({
    id: '',
    name: '',
    type: 'url',
    keyword: '',
    category: '',
  });

  const resetForm = () => {
    setEditingRule({
      id: '',
      name: '',
      type: 'url',
      keyword: '',
      category: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!editingRule.name.trim() || !editingRule.keyword.trim() || !editingRule.category.trim()) {
      return;
    }
    addRule({
      name: editingRule.name,
      type: editingRule.type,
      keyword: editingRule.keyword,
      category: editingRule.category,
    });
    resetForm();
  };

  const handleEdit = (rule: CategoryRule) => {
    setEditingId(rule.id);
    setEditingRule({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      keyword: rule.keyword,
      category: rule.category,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingRule.name.trim() || !editingRule.keyword.trim() || !editingRule.category.trim()) {
      return;
    }
    updateRule(editingId, {
      name: editingRule.name,
      type: editingRule.type,
      keyword: editingRule.keyword,
      category: editingRule.category,
    });
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条规则吗？')) {
      deleteRule(id);
    }
  };

  if (!showSettings) return null;

  return (
    <>
      <div
        className={styles.overlay}
        onClick={() => {
          setShowSettings(false);
          resetForm();
        }}
      />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>分类规则设置</h2>
          <button
            className={styles.closeBtn}
            onClick={() => {
              setShowSettings(false);
              resetForm();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            规则用于自动将书签分类到不同目录。匹配方式：URL包含或标题包含指定关键词。
          </p>

          <div className={styles.rulesList}>
            {rules.map((rule) => (
              <div key={rule.id} className={styles.ruleItem}>
                {editingId === rule.id ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      placeholder="规则名称"
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                      className={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="关键词"
                      value={editingRule.keyword}
                      onChange={(e) => setEditingRule({ ...editingRule, keyword: e.target.value })}
                      className={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="分类名称"
                      value={editingRule.category}
                      onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })}
                      className={styles.input}
                    />
                    <select
                      value={editingRule.type}
                      onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as 'url' | 'title' })}
                      className={styles.select}
                    >
                      <option value="url">URL包含</option>
                      <option value="title">标题包含</option>
                    </select>
                    <button onClick={handleSaveEdit} className={styles.saveBtn}>
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.ruleInfo}>
                      <span className={styles.ruleName}>{rule.name}</span>
                      <span className={styles.ruleDetail}>
                        {rule.type === 'url' ? 'URL' : '标题'} 包含 "{rule.keyword}" → {rule.category}
                      </span>
                    </div>
                    <div className={styles.ruleActions}>
                      <button
                        onClick={() => handleEdit(rule)}
                        className={styles.iconBtn}
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className={`${styles.iconBtn} ${styles.danger}`}
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {isAdding ? (
            <div className={styles.addForm}>
              <h3 className={styles.formTitle}>添加新规则</h3>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="规则名称（如：技术博客）"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formRow}>
                <select
                  value={editingRule.type}
                  onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as 'url' | 'title' })}
                  className={styles.select}
                >
                  <option value="url">URL包含</option>
                  <option value="title">标题包含</option>
                </select>
                <input
                  type="text"
                  placeholder="关键词"
                  value={editingRule.keyword}
                  onChange={(e) => setEditingRule({ ...editingRule, keyword: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="分类名称（如：技术）"
                  value={editingRule.category}
                  onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formActions}>
                <button onClick={resetForm} className={styles.cancelBtn}>
                  取消
                </button>
                <button onClick={handleAdd} className={styles.addBtn}>
                  <Plus size={16} />
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAdding(true)} className={styles.addRuleBtn}>
              <Plus size={18} />
              添加分类规则
            </button>
          )}
        </div>
      </div>
    </>
  );
};
