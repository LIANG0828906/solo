import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Rule, RuleContextType, RuleType } from '../../types';
import { useFieldContext } from '../field/FieldPanel';
import { isPatternValid } from './validationEngine';

const RuleContext = createContext<RuleContextType | null>(null);

export const useRuleContext = () => {
  const context = useContext(RuleContext);
  if (!context) {
    throw new Error('useRuleContext must be used within RuleProvider');
  }
  return context;
};

const ToggleSwitch: React.FC<{
  active: boolean;
  onChange: () => void;
}> = ({ active, onChange }) => (
  <div
    className={`toggle-switch ${active ? 'active' : ''}`}
    onClick={onChange}
  >
    <div className="toggle-switch-knob" />
  </div>
);

const RuleItem: React.FC<{
  rule: Rule;
  name: string;
  children?: React.ReactNode;
  onToggle: () => void;
}> = ({ rule, name, children, onToggle }) => (
  <div className="rule-item">
    <div className="rule-item-header">
      <span className="rule-item-name">{name}</span>
      <ToggleSwitch active={rule.enabled} onChange={onToggle} />
    </div>
    {rule.enabled && children && (
      <div className="rule-item-options">
        {children}
      </div>
    )}
  </div>
);

const RuleConfigPanel: React.FC = () => {
  const { fields, selectedFieldId, updateFieldRules } = useFieldContext();
  const currentField = useMemo(
    () => fields.find(f => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );
  const [patternErrors, setPatternErrors] = useState<Record<string, string>>({});

  const updateRule = useCallback((ruleId: string, updates: Partial<Rule>) => {
    if (!currentField) return;
    const newRules = currentField.rules.map(r =>
      r.id === ruleId ? { ...r, ...updates, options: { ...r.options, ...updates.options } } : r
    );
    updateFieldRules(currentField.id, newRules);
  }, [currentField, updateFieldRules]);

  const toggleRule = useCallback((ruleId: string) => {
    if (!currentField) return;
    const rule = currentField.rules.find(r => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, { enabled: !rule.enabled });
    }
  }, [currentField, updateRule]);

  useEffect(() => {
    setPatternErrors({});
  }, [selectedFieldId]);

  const handlePatternChange = (ruleId: string, value: string) => {
    updateRule(ruleId, { options: { value } });
    if (value && !isPatternValid(value)) {
      setPatternErrors(prev => ({ ...prev, [ruleId]: '正则表达式语法错误' }));
    } else {
      setPatternErrors(prev => {
        const next = { ...prev };
        delete next[ruleId];
        return next;
      });
    }
  };

  if (!currentField) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
        <div className="empty-state-title">请选择一个字段</div>
        <div className="empty-state-desc">从左侧字段列表中选择或添加字段来配置验证规则</div>
      </div>
    );
  }

  const getRule = (type: RuleType) => currentField.rules.find(r => r.type === type);
  const typeLabels: Record<string, string> = {
    string: '字符串',
    number: '数字',
    email: '邮箱',
    phone: '手机号'
  };

  const otherFields = fields.filter(f => f.id !== currentField.id);

  return (
    <div className="rule-config-panel">
      <div className="rule-config-header">
        <span className="rule-config-title">{currentField.name}</span>
        <span className="rule-config-field-type">{typeLabels[currentField.type]}</span>
      </div>

      <div className="rule-section">
        <div className="rule-section-title">基础规则</div>

        {getRule('required') && (
          <RuleItem
            rule={getRule('required')!}
            name="必填"
            onToggle={() => toggleRule(getRule('required')!.id)}
          />
        )}

        {(currentField.type === 'string' || currentField.type === 'email' || currentField.type === 'phone') && (
          <>
            {getRule('minLength') && (
              <RuleItem
                rule={getRule('minLength')!}
                name="最小长度"
                onToggle={() => toggleRule(getRule('minLength')!.id)}
              >
                <div className="rule-options-grid">
                  <div>
                    <label className="rule-option-label">最小字符数</label>
                    <input
                      type="number"
                      className="number-input"
                      value={getRule('minLength')!.options.value ?? 0}
                      onChange={(e) => updateRule(getRule('minLength')!.id, { options: { value: Number(e.target.value) } })}
                      min={0}
                    />
                  </div>
                </div>
              </RuleItem>
            )}

            {getRule('maxLength') && (
              <RuleItem
                rule={getRule('maxLength')!}
                name="最大长度"
                onToggle={() => toggleRule(getRule('maxLength')!.id)}
              >
                <div className="rule-options-grid">
                  <div>
                    <label className="rule-option-label">最大字符数</label>
                    <input
                      type="number"
                      className="number-input"
                      value={getRule('maxLength')!.options.value ?? 100}
                      onChange={(e) => updateRule(getRule('maxLength')!.id, { options: { value: Number(e.target.value) } })}
                      min={0}
                    />
                  </div>
                </div>
              </RuleItem>
            )}
          </>
        )}

        {currentField.type === 'number' && (
          <>
            {getRule('min') && (
              <RuleItem
                rule={getRule('min')!}
                name="最小值"
                onToggle={() => toggleRule(getRule('min')!.id)}
              >
                <div className="rule-options-grid">
                  <div>
                    <label className="rule-option-label">最小数值</label>
                    <input
                      type="number"
                      className="number-input"
                      value={getRule('min')!.options.value ?? 0}
                      onChange={(e) => updateRule(getRule('min')!.id, { options: { value: Number(e.target.value) } })}
                    />
                  </div>
                </div>
              </RuleItem>
            )}

            {getRule('max') && (
              <RuleItem
                rule={getRule('max')!}
                name="最大值"
                onToggle={() => toggleRule(getRule('max')!.id)}
              >
                <div className="rule-options-grid">
                  <div>
                    <label className="rule-option-label">最大数值</label>
                    <input
                      type="number"
                      className="number-input"
                      value={getRule('max')!.options.value ?? 100}
                      onChange={(e) => updateRule(getRule('max')!.id, { options: { value: Number(e.target.value) } })}
                    />
                  </div>
                </div>
              </RuleItem>
            )}
          </>
        )}
      </div>

      <div className="rule-section">
        <div className="rule-section-title">格式规则</div>

        {currentField.type === 'string' && getRule('pattern') && (
          <RuleItem
            rule={getRule('pattern')!}
            name="自定义正则表达式"
            onToggle={() => toggleRule(getRule('pattern')!.id)}
          >
            <div className="rule-options-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <label className="rule-option-label">正则表达式</label>
                <input
                  type="text"
                  className={`pattern-input ${patternErrors[getRule('pattern')!.id] ? 'invalid' : (getRule('pattern')!.options.value && !patternErrors[getRule('pattern')!.id]) ? 'valid' : ''}`}
                  placeholder="例如：^[a-zA-Z0-9]+$"
                  value={getRule('pattern')!.options.value ?? ''}
                  onChange={(e) => handlePatternChange(getRule('pattern')!.id, e.target.value)}
                />
                {patternErrors[getRule('pattern')!.id] && (
                  <div className="pattern-error">{patternErrors[getRule('pattern')!.id]}</div>
                )}
              </div>
              <div>
                <label className="rule-option-label">错误提示信息（可选）</label>
                <input
                  type="text"
                  className="message-input"
                  placeholder="自定义错误提示"
                  value={getRule('pattern')!.options.message ?? ''}
                  onChange={(e) => updateRule(getRule('pattern')!.id, { options: { message: e.target.value } })}
                />
              </div>
            </div>
          </RuleItem>
        )}

        {currentField.type === 'email' && (
          <div className="rule-item" style={{ opacity: 0.7 }}>
            <div className="rule-item-header">
              <span className="rule-item-name">邮箱格式验证</span>
              <span style={{ fontSize: '12px', color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>自动启用</span>
            </div>
          </div>
        )}

        {currentField.type === 'phone' && (
          <div className="rule-item" style={{ opacity: 0.7 }}>
            <div className="rule-item-header">
              <span className="rule-item-name">手机号格式验证</span>
              <span style={{ fontSize: '12px', color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>自动启用</span>
            </div>
          </div>
        )}
      </div>

      <div className="rule-section">
        <div className="rule-section-title">联动规则</div>

        {getRule('linked') && (
          <RuleItem
            rule={getRule('linked')!}
            name="联动字段验证"
            onToggle={() => toggleRule(getRule('linked')!.id)}
          >
            <div className="rule-options-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <label className="rule-option-label">选择联动字段</label>
                <select
                  className="linked-select"
                  value={getRule('linked')!.options.linkedFieldId ?? ''}
                  onChange={(e) => updateRule(getRule('linked')!.id, { options: { linkedFieldId: e.target.value } })}
                >
                  <option value="">请选择字段</option>
                  {otherFields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {getRule('linked')!.options.linkedFieldId && (
                <>
                  <div>
                    <label className="rule-option-label">联动条件</label>
                    <input
                      type="text"
                      className="message-input"
                      placeholder="例如：等于'yes'、包含'abc'、为空、不为空"
                      value={getRule('linked')!.options.condition ?? ''}
                      onChange={(e) => updateRule(getRule('linked')!.id, { options: { condition: e.target.value } })}
                    />
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      支持语法：等于'xxx'、不等于'xxx'、包含'xxx'、为空、不为空
                    </div>
                  </div>
                  <div>
                    <label className="rule-option-label">触发后行为</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                      <input
                        type="checkbox"
                        id="linked-required"
                        checked={getRule('linked')!.options.required !== false}
                        onChange={(e) => updateRule(getRule('linked')!.id, { options: { required: e.target.checked } })}
                      />
                      <label htmlFor="linked-required" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                        条件满足时，本字段变为必填
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </RuleItem>
        )}
      </div>
    </div>
  );
};

interface RuleProviderProps {
  children: React.ReactNode;
}

export const RuleProvider: React.FC<RuleProviderProps> = ({ children }) => {
  const { fields, selectedFieldId } = useFieldContext();
  const currentField = useMemo(
    () => fields.find(f => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );
  const { updateFieldRules } = useFieldContext();

  const updateRule = useCallback((ruleId: string, updates: Partial<Rule>) => {
    if (!currentField) return;
    const newRules = currentField.rules.map(r =>
      r.id === ruleId ? { ...r, ...updates, options: { ...r.options, ...updates.options } } : r
    );
    updateFieldRules(currentField.id, newRules);
  }, [currentField, updateFieldRules]);

  const value: RuleContextType = {
    currentField,
    updateRule
  };

  return (
    <RuleContext.Provider value={value}>
      {children}
    </RuleContext.Provider>
  );
};

export { RuleContext };
export default RuleConfigPanel;
