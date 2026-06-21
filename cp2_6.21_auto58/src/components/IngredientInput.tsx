import React, { useState } from 'react';
import { Ingredient, UNITS } from '../types';

interface IngredientInputProps {
  onAdd: (ingredient: Ingredient) => void;
  ingredients: Ingredient[];
  onRemove: (index: number) => void;
}

const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}
`;

const containerStyle: React.CSSProperties = {
  padding: '16px',
  background: '#FFFBF5',
  borderRadius: '12px',
  border: '1px solid #E8D5BC',
  fontFamily: "'Quicksand', sans-serif",
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '16px',
  flexWrap: 'wrap',
};

const getInputStyle = (isValid: boolean, isTouched: boolean): React.CSSProperties => ({
  padding: '10px 12px',
  borderRadius: '8px',
  border: `2px solid ${isTouched ? (isValid ? '#4CAF50' : '#F44336') : '#D4C4B0'}`,
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'border-color 0.2s ease',
  animation: isTouched && !isValid ? 'shake 0.3s' : undefined,
});

const nameInputStyle: React.CSSProperties = {
  flex: '2',
  minWidth: '120px',
};

const quantityInputStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '80px',
};

const unitSelectStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '100px',
  cursor: 'pointer',
  background: '#FFFFFF',
};

const addButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#D4A574',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  fontFamily: "'Quicksand', sans-serif",
};

const addButtonDisabledStyle: React.CSSProperties = {
  ...addButtonStyle,
  background: '#C4B4A0',
  cursor: 'not-allowed',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: '#FFFFFF',
  borderRadius: '8px',
  marginBottom: '8px',
  border: '1px solid #E8D5BC',
};

const ingredientInfoStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#4A2F1A',
  fontWeight: 500,
};

const removeButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: '#F44336',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'background 0.2s ease',
};

const errorTextStyle: React.CSSProperties = {
  color: '#F44336',
  fontSize: '12px',
  marginTop: '-8px',
  marginBottom: '12px',
  minHeight: '16px',
};

export const IngredientInput: React.FC<IngredientInputProps> = ({
  onAdd,
  ingredients,
  onRemove,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    quantity: false,
    unit: false,
  });
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const isNameValid = name.trim().length > 0;
  const isQuantityValid = !isNaN(Number(quantity)) && Number(quantity) > 0;
  const isUnitValid = unit.trim().length > 0;
  const isAllValid = isNameValid && isQuantityValid && isUnitValid;

  const handleAdd = () => {
    setTouched({ name: true, quantity: true, unit: true });
    if (!isAllValid) {
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    onAdd({
      name: name.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
    });

    setName('');
    setQuantity('');
    setUnit('');
    setTouched({ name: false, quantity: false, unit: false });
  };

  return (
    <div style={containerStyle}>
      <style>{shakeKeyframes}</style>
      <div style={inputRowStyle}>
        <input
          type="text"
          placeholder="食材名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          style={{
            ...getInputStyle(isNameValid, touched.name),
            ...nameInputStyle,
            animation: touched.name && !isNameValid ? `shake 0.3s ${shakeTrigger}` : undefined,
          }}
        />
        <input
          type="number"
          placeholder="数量"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, quantity: true }))}
          min="0"
          step="any"
          style={{
            ...getInputStyle(isQuantityValid, touched.quantity),
            ...quantityInputStyle,
            animation: touched.quantity && !isQuantityValid ? `shake 0.3s ${shakeTrigger}` : undefined,
          }}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, unit: true }))}
          style={{
            ...getInputStyle(isUnitValid, touched.unit),
            ...unitSelectStyle,
            animation: touched.unit && !isUnitValid ? `shake 0.3s ${shakeTrigger}` : undefined,
          }}
        >
          <option value="">选择单位</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          style={isAllValid ? addButtonStyle : addButtonDisabledStyle}
          onMouseEnter={(e) => {
            if (isAllValid) {
              (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = isAllValid ? '#D4A574' : '#C4B4A0';
          }}
        >
          + 添加
        </button>
      </div>

      <div style={errorTextStyle}>
        {touched.name && !isNameValid && '请输入食材名称'}
        {touched.quantity && !isQuantityValid && '数量必须大于0'}
        {touched.unit && !isUnitValid && '请选择单位'}
      </div>

      {ingredients.length > 0 && (
        <ul style={listStyle}>
          {ingredients.map((ing, index) => (
            <li key={index} style={listItemStyle}>
              <span style={ingredientInfoStyle}>
                {ing.name} - {ing.quantity}{ing.unit}
              </span>
              <button
                onClick={() => onRemove(index)}
                style={removeButtonStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#D32F2F';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F44336';
                }}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IngredientInput;
