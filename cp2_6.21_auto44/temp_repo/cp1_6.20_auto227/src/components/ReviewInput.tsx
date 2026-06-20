import React, { useCallback, memo } from 'react';

interface ReviewInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

const ReviewInput: React.FC<ReviewInputProps> = memo(
  ({ value, onChange, maxLength = 100, disabled = false, placeholder = '写下您的评价...' }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!disabled && e.target.value.length <= maxLength) {
          onChange(e.target.value);
        }
      },
      [onChange, disabled, maxLength]
    );

    return (
      <div className="review-section">
        <div className="review-input-wrapper">
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={2}
            className="review-input"
            disabled={disabled}
          />
          <span className="review-counter">
            {value.length}/{maxLength}
          </span>
        </div>
      </div>
    );
  }
);

ReviewInput.displayName = 'ReviewInput';

export default ReviewInput;
