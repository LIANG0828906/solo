import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';
import { StrengthResult, getStrengthGradient } from '../utils/passwordGenerator';
import { Toast } from '../hooks/usePassword';

interface PasswordResultProps {
  currentPassword: string;
  displayedPassword: string;
  isAnimating: boolean;
  strength: StrengthResult;
  toasts: Toast[];
  onGenerate: () => void;
  onCopy: (text: string) => Promise<boolean>;
}

export const PasswordResult: React.FC<PasswordResultProps> = ({
  currentPassword,
  displayedPassword,
  isAnimating,
  strength,
  toasts,
  onGenerate,
  onCopy
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [copyRipples, setCopyRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [strengthPulse, setStrengthPulse] = useState(false);
  const prevStrengthRef = useRef(strength.score);
  const strengthBarRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);
  const copyRippleIdRef = useRef(0);

  useEffect(() => {
    if (prevStrengthRef.current !== strength.score) {
      prevStrengthRef.current = strength.score;
      setStrengthPulse(true);
    }
  }, [strength.score]);

  const handleStrengthAnimationEnd = useCallback(() => {
    setStrengthPulse(false);
  }, []);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>, setFn: typeof setRipples, idRef: React.MutableRefObject<number>, duration: number) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idRef.current++;
    
    setFn(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setFn(prev => prev.filter(r => r.id !== id));
    }, duration);
  }, []);

  const createCopyRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = copyRippleIdRef.current++;
    
    setCopyRipples(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setCopyRipples(prev => prev.filter(r => r.id !== id));
    }, 300);
  }, []);

  const handleCopy = async () => {
    if (!currentPassword) return;
    const success = await onCopy(currentPassword);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    }
  };

  const renderPasswordChars = () => {
    if (!displayedPassword) {
      return <span style={{ color: 'var(--text-muted)' }}>点击下方按钮生成密码</span>;
    }
    return displayedPassword.split('').map((char, index) => (
      <span
        key={`${index}-${char}`}
        className="password-char"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {char}
      </span>
    ));
  };

  return (
    <section className="result-area animate-fade-in">
      <div className="result-label">您的安全密码</div>
      
      <div className="password-display">
        <div className="password-text">
          {renderPasswordChars()}
        </div>
        <button
          className={`copy-btn ${copySuccess ? 'copy-btn--success' : ''}`}
          onClick={(e) => {
            createCopyRipple(e);
            handleCopy();
          }}
          disabled={!currentPassword}
          title="复制密码"
        >
          {copyRipples.map(ripple => (
            <span
              key={ripple.id}
              className="copy-btn__ripple"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20
              }}
            />
          ))}
          <CSSTransition
            in={!copySuccess}
            timeout={200}
            classNames="copy-icon"
            unmountOnExit
            key="copy-icon"
          >
            <span className="copy-btn__icon">📋</span>
          </CSSTransition>
          <CSSTransition
            in={copySuccess}
            timeout={200}
            classNames="copy-icon"
            unmountOnExit
            key="check-icon"
          >
            <span className="copy-btn__icon">✓</span>
          </CSSTransition>
        </button>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn--primary"
          onClick={(e) => { createRipple(e, setRipples, rippleIdRef, 600); onGenerate(); }}
          disabled={isAnimating}
        >
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className="btn__ripple"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40
              }}
            />
          ))}
          <span className="btn__icon">🎲</span>
          生成新密码
        </button>
        <button
          className="btn btn--secondary"
          onClick={(e) => {
            createRipple(e, setRipples, rippleIdRef, 600);
            if (currentPassword) handleCopy();
          }}
          disabled={!currentPassword}
        >
          <CSSTransition
            in={!copySuccess}
            timeout={200}
            classNames="copy-icon"
            unmountOnExit
            key="btn-copy-icon"
          >
            <span className="btn__icon">📋</span>
          </CSSTransition>
          <CSSTransition
            in={copySuccess}
            timeout={200}
            classNames="copy-icon"
            unmountOnExit
            key="btn-check-icon"
          >
            <span className="btn__icon">✓</span>
          </CSSTransition>
          {copySuccess ? '已复制' : '复制密码'}
        </button>
      </div>

      <div className="strength-section">
        <div className="strength-header">
          <span className="strength-label">密码强度评估</span>
          <span className={`strength-badge strength-badge--${strength.level}`}>
            {strength.label}
          </span>
        </div>
        <div className="strength-bar">
          <div
            ref={strengthBarRef}
            className={`strength-bar__fill ${strengthPulse ? 'strength-bar__fill--pulse' : ''}`}
            style={{
              width: `${strength.score}%`,
              background: getStrengthGradient(strength.score)
            }}
            onAnimationEnd={handleStrengthAnimationEnd}
          />
        </div>
      </div>

      <div className="strength-info">
        <div className="strength-info__item">
          <div className="strength-info__label">信息熵</div>
          <div className="strength-info__value strength-info__value--accent">
            {strength.entropy} bits
          </div>
        </div>
        <div className="strength-info__item">
          <div className="strength-info__label">预计破解时间</div>
          <div className="strength-info__value">{strength.crackTime}</div>
        </div>
        <div className="strength-info__item">
          <div className="strength-info__label">强度得分</div>
          <div className="strength-info__value">{strength.score}%</div>
        </div>
      </div>

      {strength.suggestions.length > 0 && (
        <div className="suggestions" style={{ marginTop: '24px' }}>
          <div className="suggestions__title">
            💡 安全建议与检查
          </div>
          <ul className="suggestions__list">
            {strength.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`suggestions__item ${suggestion.success ? 'suggestions__item--success' : ''}`}
              >
                {suggestion.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {toasts.map(toast => (
        <CSSTransition
          key={toast.id}
          timeout={200}
          classNames="toast"
          unmountOnExit
        >
          <div className={`toast toast--${toast.type}`}>
            <span className="toast__icon">
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            {toast.message}
          </div>
        </CSSTransition>
      ))}
    </section>
  );
};

export default PasswordResult;
