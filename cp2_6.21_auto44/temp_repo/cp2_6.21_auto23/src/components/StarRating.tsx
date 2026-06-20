interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, size = 24, readOnly = false }: StarRatingProps) {
  const handleClick = (starValue: number, isHalf: boolean) => {
    if (readOnly || !onChange) return;
    const newValue = isHalf ? starValue - 0.5 : starValue;
    onChange(newValue);
  };

  return (
    <div className="inline-flex items-center gap-0.5" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const halfFilled = !filled && value >= star - 0.5;
        return (
          <span
            key={star}
            className={`relative inline-block ${readOnly ? '' : 'cursor-pointer'}`}
            style={{ width: size, height: size }}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-[#e0d6c8]"
              style={{ fontSize: size }}
            >
              ★
            </span>
            {(filled || halfFilled) && (
              <span
                className="absolute inset-0 flex items-center justify-center overflow-hidden text-[#ffc107]"
                style={{
                  fontSize: size,
                  clipPath: halfFilled ? 'inset(0 50% 0 0)' : 'none',
                }}
              >
                ★
              </span>
            )}
            {!readOnly && (
              <>
                <span
                  className="absolute inset-0"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                  onClick={() => handleClick(star, true)}
                />
                <span
                  className="absolute inset-0"
                  style={{ clipPath: 'inset(0 0 0 50%)' }}
                  onClick={() => handleClick(star, false)}
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
