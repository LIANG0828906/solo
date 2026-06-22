import React from 'react';
import { MealType, Food, MEAL_TYPE_MAP } from '../services/api';

interface DietFormProps {
  onAddMeal: (mealType: MealType, items: Array<{ foodId: number; grams: number }>) => Promise<void>;
}

const DietForm: React.FC<DietFormProps> = ({ onAddMeal }) => {
  const [query, setQuery] = React.useState('');
  const [selectedFood, setSelectedFood] = React.useState<Food | null>(null);
  const [grams, setGrams] = React.useState<number>(100);
  const [mealType, setMealType] = React.useState<MealType>('breakfast');
  const [searchResults, setSearchResults] = React.useState<Food[]>([]);
  const [pendingItems, setPendingItems] = React.useState<Array<{ food: Food; grams: number }>>([]);

  React.useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/foods/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then((data: Food[]) => {
        if (!cancelled) setSearchResults(data.slice(0, 8));
      });
    return () => { cancelled = true; };
  }, [query]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setSearchResults([]);
    setQuery(food.name);
  };

  const handleAddItem = () => {
    if (!selectedFood || grams <= 0) return;
    setPendingItems([...pendingItems, { food: selectedFood, grams }]);
    setSelectedFood(null);
    setQuery('');
    setGrams(100);
  };

  const handleRemoveItem = (idx: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (pendingItems.length === 0) return;
    await onAddMeal(mealType, pendingItems.map(i => ({ foodId: i.food.id, grams: i.grams })));
    setPendingItems([]);
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>记录用餐</h2>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>餐次</label>
        <div style={styles.mealTypeGroup}>
          {(Object.keys(MEAL_TYPE_MAP) as MealType[]).map(mt => (
            <button
              key={mt}
              onClick={() => setMealType(mt)}
              style={{
                ...styles.mealTypeBtn,
                ...(mealType === mt ? styles.mealTypeBtnActive : {}),
              }}
            >
              {MEAL_TYPE_MAP[mt]}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>搜索食物</label>
        <div style={styles.searchWrap}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入食物名称，如：煮鸡蛋"
            style={styles.input}
          />
          {searchResults.length > 0 && (
            <div style={styles.dropdown}>
              {searchResults.map(food => (
                <div
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  style={styles.dropdownItem}
                >
                  <span style={styles.foodName}>{food.name}</span>
                  <span style={styles.foodMeta}>{food.calories}kcal/100g</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFood && (
        <div style={styles.fieldGroup}>
          <div style={styles.selectedInfo}>
            <strong>{selectedFood.name}</strong>
            <span style={styles.foodMeta}>
              蛋白{selectedFood.protein}g · 脂肪{selectedFood.fat}g · 碳水{selectedFood.carbs}g
            </span>
          </div>
          <div style={styles.row}>
            <input
              type="number"
              min={1}
              value={grams}
              onChange={e => setGrams(Number(e.target.value) || 0)}
              style={{ ...styles.input, flex: 1 }}
            />
            <span style={styles.unitLabel}>克</span>
            <button onClick={handleAddItem} style={styles.secondaryBtn}>
              添加到清单
            </button>
          </div>
        </div>
      )}

      {pendingItems.length > 0 && (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>待添加食物清单</label>
          <div style={styles.itemList}>
            {pendingItems.map((item, idx) => (
              <div key={idx} style={styles.itemRow}>
                <span>{item.food.name} × {item.grams}g</span>
                <button onClick={() => handleRemoveItem(idx)} style={styles.removeBtn}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} style={styles.primaryBtn}>
            提交{MEAL_TYPE_MAP[mealType]}记录
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
    color: '#1F2937',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 8,
  },
  mealTypeGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  mealTypeBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
    color: '#4B5563',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  mealTypeBtnActive: {
    background: '#3B82F6',
    color: '#fff',
    borderColor: '#3B82F6',
  },
  searchWrap: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #E5E7EB',
    maxHeight: 260,
    overflowY: 'auto',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F3F4F6',
  },
  foodName: {
    fontWeight: 500,
    color: '#1F2937',
  },
  foodMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedInfo: {
    padding: '10px 14px',
    background: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  unitLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  secondaryBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#E5E7EB',
    color: '#374151',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 12,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 8,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#F9FAFB',
    borderRadius: 6,
    fontSize: 14,
  },
  removeBtn: {
    border: 'none',
    background: 'transparent',
    color: '#EF4444',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
};

export default DietForm;
