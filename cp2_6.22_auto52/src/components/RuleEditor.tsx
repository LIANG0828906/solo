import React, { useState, useCallback } from 'react';
import axios from 'axios';

const ROOMS = [
  { id: 'living', label: '客厅' },
  { id: 'bedroom', label: '卧室' },
  { id: 'kitchen', label: '厨房' },
  { id: 'bathroom', label: '卫生间' },
];

const SENSOR_TYPES = ['temperature', 'humidity', 'light'] as const;
const OPERATORS = ['>', '<', '=', '>=', '<='] as const;
const ACTION_TYPES = ['on', 'off', 'set'] as const;

interface Condition {
  roomId: string;
  sensorType: string;
  operator: string;
  value: number;
}

interface Action {
  deviceId: string;
  action: string;
  value?: number;
}

interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  logic: 'AND' | 'OR';
  actions: Action[];
  enabled: boolean;
}

const emptyCondition = (): Condition => ({
  roomId: 'living',
  sensorType: 'temperature',
  operator: '>',
  value: 25,
});

const emptyAction = (): Action => ({
  deviceId: '',
  action: 'on',
});

const defaultRule = (): Omit<Rule, 'id'> => ({
  name: '',
  conditions: [emptyCondition()],
  logic: 'AND',
  actions: [emptyAction()],
  enabled: true,
});

const RuleEditor: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Omit<Rule, 'id'> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [devices, setDevices] = useState<any[]>([]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await axios.get('/api/rules');
      setRules(res.data);
    } catch {}
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get('/api/devices');
      setDevices(res.data);
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchRules();
    fetchDevices();
  }, [fetchRules, fetchDevices]);

  const openNewRule = () => {
    setEditingRule(defaultRule());
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditRule = (rule: Rule) => {
    setEditingRule({
      name: rule.name,
      conditions: rule.conditions.map((c) => ({ ...c })),
      logic: rule.logic,
      actions: rule.actions.map((a) => ({ ...a })),
      enabled: rule.enabled,
    });
    setEditingId(rule.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!editingRule) return;
    try {
      JSON.parse(JSON.stringify(editingRule));
    } catch {
      alert('Invalid rule format');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/rules/${editingId}`, editingRule);
      } else {
        await axios.post('/api/rules', { ...editingRule, id: crypto.randomUUID() });
      }
      await fetchRules();
      closeModal();
    } catch (err) {
      console.error('Failed to save rule', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/rules/${id}`);
      await fetchRules();
      if (expandedRuleId === id) setExpandedRuleId(null);
    } catch {}
  };

  const toggleEnabled = async (rule: Rule) => {
    try {
      await axios.put(`/api/rules/${rule.id}`, { ...rule, enabled: !rule.enabled });
      await fetchRules();
    } catch {}
  };

  const updateCondition = (idx: number, field: keyof Condition, value: any) => {
    if (!editingRule) return;
    const updated = { ...editingRule };
    updated.conditions = [...updated.conditions];
    updated.conditions[idx] = { ...updated.conditions[idx], [field]: value };
    setEditingRule(updated);
  };

  const addAction = () => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, actions: [...editingRule.actions, emptyAction()] });
  };

  const removeAction = (idx: number) => {
    if (!editingRule) return;
    const updated = { ...editingRule };
    updated.actions = updated.actions.filter((_, i) => i !== idx);
    setEditingRule(updated);
  };

  const updateAction = (idx: number, field: keyof Action, value: any) => {
    if (!editingRule) return;
    const updated = { ...editingRule };
    updated.actions = [...updated.actions];
    updated.actions[idx] = { ...updated.actions[idx], [field]: value };
    setEditingRule(updated);
  };

  const addCondition = () => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, conditions: [...editingRule.conditions, emptyCondition()] });
  };

  const removeCondition = (idx: number) => {
    if (!editingRule) return;
    const updated = { ...editingRule };
    updated.conditions = updated.conditions.filter((_, i) => i !== idx);
    setEditingRule(updated);
  };

  const onDragStart = (idx: number) => setDragIndex(idx);

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    if (!editingRule) return;
    const conds = [...editingRule.conditions];
    const item = conds.splice(dragIndex, 1)[0];
    conds.splice(idx, 0, item);
    setEditingRule({ ...editingRule, conditions: conds });
    setDragIndex(idx);
  };

  const onDrop = () => setDragIndex(null);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Rules</h3>
          <button onClick={openNewRule} style={styles.addBtn}>+ New</button>
        </div>
        <div style={styles.ruleList}>
          {rules.length === 0 && (
            <p style={{ color: '#a0a0b0', padding: '1rem', fontSize: 14 }}>No rules yet</p>
          )}
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                ...styles.ruleCard,
                borderColor: expandedRuleId === rule.id ? '#e8b83a' : 'rgba(255,255,255,0.06)',
              }}
              onClick={() =>
                setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)
              }
            >
              <div style={styles.ruleCardHeader}>
                <span style={styles.ruleName}>{rule.name || 'Unnamed'}</span>
                <span
                  style={{
                    ...styles.badge,
                    background: rule.enabled ? '#4caf50' : '#555',
                  }}
                >
                  {rule.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              {expandedRuleId === rule.id && (
                <div style={styles.ruleDetails}>
                  <p style={styles.ruleDetailText}>
                    Logic: <strong>{rule.logic}</strong>
                  </p>
                  <p style={styles.ruleDetailText}>
                    Conditions: {rule.conditions.length}
                  </p>
                  <p style={styles.ruleDetailText}>
                    Actions: {rule.actions.length}
                  </p>
                  <div style={styles.ruleDetailActions}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(rule); }}
                      style={styles.smallBtn}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditRule(rule); }}
                      style={{ ...styles.smallBtn, background: '#1565c0' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                      style={{ ...styles.smallBtn, background: '#c62828' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modalOpen && editingRule && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingId ? 'Edit Rule' : 'New Rule'}
            </h3>

            <label style={styles.label}>Rule Name</label>
            <input
              style={styles.input}
              value={editingRule.name}
              onChange={(e) =>
                setEditingRule({ ...editingRule, name: e.target.value })
              }
              placeholder="Enter rule name"
            />

            <label style={styles.label}>Logic</label>
            <select
              style={styles.select}
              value={editingRule.logic}
              onChange={(e) =>
                setEditingRule({ ...editingRule, logic: e.target.value as 'AND' | 'OR' })
              }
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>

            <div style={styles.accordionHeader} onClick={() => setConditionsOpen(!conditionsOpen)}>
              <span>Conditions ({editingRule.conditions.length})</span>
              <span>{conditionsOpen ? '▼' : '▶'}</span>
            </div>
            {conditionsOpen && (
              <div style={styles.accordionBody}>
                {editingRule.conditions.map((cond, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={onDrop}
                    style={styles.conditionRow}
                  >
                    <span style={styles.dragHandle}>⠿</span>
                    <select
                      style={styles.smallSelect}
                      value={cond.roomId}
                      onChange={(e) => updateCondition(idx, 'roomId', e.target.value)}
                    >
                      {ROOMS.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <select
                      style={styles.smallSelect}
                      value={cond.sensorType}
                      onChange={(e) => updateCondition(idx, 'sensorType', e.target.value)}
                    >
                      {SENSOR_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      style={{ ...styles.smallSelect, width: 60 }}
                      value={cond.operator}
                      onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    >
                      {OPERATORS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      style={{ ...styles.input, width: 70, padding: '0.3rem 0.5rem' }}
                      value={cond.value}
                      onChange={(e) => updateCondition(idx, 'value', Number(e.target.value))}
                    />
                    <button onClick={() => removeCondition(idx)} style={styles.removeBtn}>✕</button>
                  </div>
                ))}
                <button onClick={addCondition} style={styles.addCondBtn}>+ Add Condition</button>
              </div>
            )}

            <div style={styles.accordionHeader} onClick={() => setActionsOpen(!actionsOpen)}>
              <span>Actions ({editingRule.actions.length})</span>
              <span>{actionsOpen ? '▼' : '▶'}</span>
            </div>
            {actionsOpen && (
              <div style={styles.accordionBody}>
                {editingRule.actions.map((act, idx) => (
                  <div key={idx} style={styles.conditionRow}>
                    <select
                      style={styles.smallSelect}
                      value={act.deviceId}
                      onChange={(e) => updateAction(idx, 'deviceId', e.target.value)}
                    >
                      <option value="">Select device</option>
                      {devices.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <select
                      style={styles.smallSelect}
                      value={act.action}
                      onChange={(e) => updateAction(idx, 'action', e.target.value)}
                    >
                      {ACTION_TYPES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    {act.action === 'set' && (
                      <input
                        type="number"
                        style={{ ...styles.input, width: 70, padding: '0.3rem 0.5rem' }}
                        value={act.value ?? ''}
                        onChange={(e) => updateAction(idx, 'value', Number(e.target.value))}
                        placeholder="Value"
                      />
                    )}
                    <button onClick={() => removeAction(idx)} style={styles.removeBtn}>✕</button>
                  </div>
                ))}
                <button onClick={addAction} style={styles.addCondBtn}>+ Add Action</button>
              </div>
            )}

            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSubmit} style={styles.submitBtn}>Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1.5rem',
    flex: 1,
    minHeight: 0,
  },
  sidebar: {
    width: 300,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 18,
    color: '#e0e0e0',
  },
  addBtn: {
    background: '#e8b83a',
    color: '#1a1a2e',
    fontWeight: 600,
    padding: '0.4rem 1rem',
    borderRadius: 8,
    fontSize: 13,
  },
  ruleList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  ruleCard: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 10,
    padding: '0.9rem 1rem',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'border-color 0.3s ease',
  },
  ruleCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0',
  },
  badge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 6,
    color: '#fff',
    fontWeight: 600,
  },
  ruleDetails: {
    marginTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  ruleDetailText: {
    fontSize: 13,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  ruleDetailActions: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  },
  smallBtn: {
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 6,
    background: '#333',
    color: '#e0e0e0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1a1a2e',
    borderRadius: 14,
    padding: '1.5rem',
    width: 520,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    fontSize: 18,
    color: '#e8b83a',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 10,
    marginBottom: 4,
    display: 'block',
  },
  input: {
    width: '100%',
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: '#e0e0e0',
    fontSize: 14,
  },
  select: {
    width: '100%',
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: '#e0e0e0',
    fontSize: 14,
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0',
    cursor: 'pointer',
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: 600,
    marginTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  accordionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingTop: 6,
  },
  conditionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.4rem 0.5rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    cursor: 'grab',
  },
  dragHandle: {
    color: '#a0a0b0',
    cursor: 'grab',
    fontSize: 16,
  },
  smallSelect: {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '0.3rem 0.4rem',
    color: '#e0e0e0',
    fontSize: 12,
    flex: 1,
    minWidth: 0,
  },
  removeBtn: {
    background: 'transparent',
    color: '#ef5350',
    fontSize: 14,
    padding: '0 6px',
  },
  addCondBtn: {
    background: 'transparent',
    color: '#e8b83a',
    fontSize: 13,
    padding: '0.4rem 0',
    textAlign: 'left' as const,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    background: '#333',
    color: '#e0e0e0',
    padding: '0.5rem 1.2rem',
    borderRadius: 8,
    fontSize: 14,
  },
  submitBtn: {
    background: '#e8b83a',
    color: '#1a1a2e',
    fontWeight: 600,
    padding: '0.5rem 1.2rem',
    borderRadius: 8,
    fontSize: 14,
  },
};

export default RuleEditor;
