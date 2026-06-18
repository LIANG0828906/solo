import React, { useState, useCallback } from 'react';
import { useStore } from '../store';
import { isValidHex } from '../utils/colorUtils';

const ColorPicker: React.FC = React.memo(() => {
  const { baseColor, setBaseColor } = useStore();
  const [inputValue, setInputValue] = useState(baseColor);
  const [isValid, setIsValid] = useState(true);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.startsWith('#')) {
      setIsValid(isValidHex(value));
    } else if (value.length > 0) {
      const withHash = '#' + value;
      setIsValid(isValidHex(withHash));
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    let value = inputValue;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    if (isValidHex(value)) {
      setBaseColor(value);
      setInputValue(value.toUpperCase());
      setIsValid(true);
    } else {
      setInputValue(baseColor);
      setIsValid(true);
    }
  }, [inputValue, baseColor, setBaseColor]);

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value.toUpperCase());
    setBaseColor(value);
    setIsValid(true);
  }, [setBaseColor]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  }, [handleInputBlur]);

  return (
    <div className="color-picker">
      <label className="color-picker-label">基础色</label>
      <div className={`color-picker-wrapper ${!isValid ? 'invalid' : ''}`}>
        <input
          type="color"
          className="color-picker-native"
          value={baseColor}
          onChange={handleColorPickerChange}
        />
        <input
          type="text"
          className="color-picker-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="#FF6B35"
          maxLength={7}
        />
      </div>
      {!isValid && <span className="color-picker-error">无效的颜色值</span>}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
