import React from 'react';
import '../styles/Input.css';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  maxLength?: number;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  rows = 3,
  min,
  max,
  step,
  disabled = false,
  className = '',
}) => {
  if (type === 'textarea') {
    return (
      <div className={`input-wrapper ${className}`}>
        <textarea
          className="custom-input textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
        />
        {maxLength && (
          <span className="char-count">{value.length}/{maxLength}</span>
        )}
      </div>
    );
  }

  if (type === 'number') {
    const handleIncrement = () => {
      const current = parseFloat(value) || 0;
      const stepVal = step || 1;
      const newVal = Math.min(current + stepVal, max || Infinity);
      onChange(String(newVal));
    };

    const handleDecrement = () => {
      const current = parseFloat(value) || 0;
      const stepVal = step || 1;
      const newVal = Math.max(current - stepVal, min || -Infinity);
      onChange(String(newVal));
    };

    return (
      <div className={`input-wrapper number-input-wrapper ${className}`}>
        <button
          type="button"
          className="number-btn"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && parseFloat(value) <= min)}
        >
          −
        </button>
        <input
          type="number"
          className="custom-input number-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        <button
          type="button"
          className="number-btn"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && parseFloat(value) >= max)}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <input
      type="text"
      className={`custom-input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
    />
  );
};

export default Input;
