import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function Slider({ label, value, min, max, step = 0.01, onChange, unit = '' }: SliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toFixed(2));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    submitValue();
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitValue();
    } else if (e.key === 'Escape') {
      setInputValue(value.toFixed(2));
      setIsEditing(false);
    }
  };

  const submitValue = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      newValue = value;
    }
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(newValue);
    setIsEditing(false);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            className={styles.valueInput}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            min={min}
            max={max}
            step={step}
          />
        ) : (
          <span className={styles.valueLabel} onClick={handleLabelClick}>
            {value.toFixed(2)}
            {unit}
          </span>
        )}
      </div>
      <div className={styles.sliderWrapper}>
        <div className={styles.sliderTrack} />
        <div className={styles.sliderFill} style={{ width: `${percentage}%` }} />
        <input
          type="range"
          className={styles.sliderInput}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleSliderChange}
        />
      </div>
    </div>
  );
}

export default Slider;
