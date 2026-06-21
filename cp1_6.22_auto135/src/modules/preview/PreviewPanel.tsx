import React, { useState, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { useFieldContext } from '../field/FieldPanel';
import { validateField, exportToJSON } from '../rules/validationEngine';
import { ValidationResult } from '../../types';

interface PreviewPanelProps {
  onBack: () => void;
}

const SuccessIcon: React.FC = () => (
  <svg className="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg className="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({ onBack }) => {
  const { fields, selectedFieldId } = useFieldContext();
  const currentField = fields.find(f => f.id === selectedFieldId) || null;
  const [inputValue, setInputValue] = useState<string>('');
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const runValidation = useCallback(() => {
    if (!currentField) {
      setResults([]);
      return;
    }
    const fieldValues: Record<string, any> = {};
    const validationResults = validateField(currentField, inputValue, fields, fieldValues);
    setResults(validationResults);
  }, [currentField, inputValue, fields]);

  useEffect(() => {
    setInputValue('');
    setResults([]);
    setShowResults(false);
  }, [selectedFieldId]);

  useEffect(() => {
    if (!inputValue && results.length === 0) return;
    const timer = setTimeout(() => {
      runValidation();
      setShowResults(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, runValidation, results.length]);

  const getInputType = () => {
    if (!currentField) return 'text';
    switch (currentField.type) {
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  const getInputPlaceholder = () => {
    if (!currentField) return '';
    switch (currentField.type) {
      case 'email':
        return '请输入邮箱地址';
      case 'phone':
        return '请输入手机号码';
      case 'number':
        return '请输入数字';
      default:
        return `请输入${currentField.name}`;
    }
  };

  const getInputStatusClass = () => {
    if (!showResults || results.length === 0) return '';
    const hasErrors = results.some(r => !r.valid);
    if (hasErrors) return 'error';
    if (inputValue && results.every(r => r.valid)) return 'success';
    return '';
  };

  const handleExportJSON = () => {
    const json = exportToJSON(fields);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'validation-rules.json');
  };

  if (!currentField) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <div className="empty-state-title">请选择一个字段</div>
        <div className="empty-state-desc">从左侧字段列表中选择字段来预览验证效果</div>
      </div>
    );
  }

  const allPassed = showResults && results.length > 0 && results.every(r => r.valid);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回配置
        </button>
        <span className="preview-title">实时预览</span>
        <button
          className="export-btn"
          onClick={handleExportJSON}
          disabled={fields.length === 0}
          title={fields.length === 0 ? '请先添加字段' : '导出JSON配置'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出JSON
        </button>
      </div>

      <div className="preview-field-container">
        <label className="preview-field-label">{currentField.name}</label>
        <input
          type={getInputType()}
          className={`preview-input ${getInputStatusClass()}`}
          placeholder={getInputPlaceholder()}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
        />

        {showResults && results.length > 0 && (
          <div className="validation-results">
            {allPassed && (
              <div className="validation-result success" key="all-passed">
                <SuccessIcon />
                <span>验证通过</span>
              </div>
            )}
            {!allPassed && results.filter(r => !r.valid).map((r, idx) => (
              <div className="validation-result error" key={`error-${idx}`}>
                <ErrorIcon />
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
