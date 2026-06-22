import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ingredient } from '../types';
import { getIngredients } from '../api/recipeApi';
import { useStore } from '../store/useStore';

interface IngredientInputProps {
  value: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const UNITS: Ingredient['unit'][] = ['g', 'ml', '个', '勺', '杯'];

const createEmptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: '',
  amount: 0,
  unit: 'g',
});

const IngredientInput = ({ value, onChange }: IngredientInputProps) => {
  const [searchTerm, setSearchTerm] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, Ingredient[]>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchTimeoutRef = useRef<Record<string, number>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ingredientsDB = useStore((state) => state.ingredientsDB);
  const setIngredientsDB = useStore((state) => state.setIngredientsDB);

  useEffect(() => {
    if (ingredientsDB.length === 0) {
      getIngredients().then((data) => {
        setIngredientsDB(data);
      });
    }
  }, [ingredientsDB.length, setIngredientsDB]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!activeDropdown) return;
      const ref = dropdownRefs.current[activeDropdown];
      if (ref && !ref.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const filterSuggestions = useCallback(
    (term: string): Ingredient[] => {
      if (!term.trim()) return [];
      const lower = term.toLowerCase();
      return ingredientsDB
        .filter((ing) => ing.name.toLowerCase().includes(lower))
        .slice(0, 8);
    },
    [ingredientsDB]
  );

  const handleSearch = useCallback(
    (id: string, term: string) => {
      setSearchTerm((prev) => ({ ...prev, [id]: term }));

      if (searchTimeoutRef.current[id]) {
        window.clearTimeout(searchTimeoutRef.current[id]);
      }

      searchTimeoutRef.current[id] = window.setTimeout(() => {
        const filtered = filterSuggestions(term);
        setSuggestions((prev) => ({ ...prev, [id]: filtered }));
        if (term.trim()) {
          setActiveDropdown(id);
        } else {
          setActiveDropdown((curr) => (curr === id ? null : curr));
        }
      }, 150);
    },
    [filterSuggestions]
  );

  const handleSelectSuggestion = useCallback(
    (id: string, suggestion: Ingredient) => {
      onChange(
        value.map((ing) =>
          ing.id === id
            ? {
                ...ing,
                name: suggestion.name,
                caloriesPer100g: suggestion.caloriesPer100g,
                proteinPer100g: suggestion.proteinPer100g,
                fatPer100g: suggestion.fatPer100g,
                carbsPer100g: suggestion.carbsPer100g,
              }
            : ing
        )
      );
      setSearchTerm((prev) => ({ ...prev, [id]: suggestion.name }));
      setActiveDropdown(null);
    },
    [onChange, value]
  );

  const updateIngredient = useCallback(
    (id: string, patch: Partial<Ingredient>) => {
      onChange(value.map((ing) => (ing.id === id ? { ...ing, ...patch } : ing)));
    },
    [onChange, value]
  );

  const removeIngredient = useCallback(
    (id: string) => {
      onChange(value.filter((ing) => ing.id !== id));
      setSearchTerm((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSuggestions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeDropdown === id) {
        setActiveDropdown(null);
      }
    },
    [onChange, value, activeDropdown]
  );

  const addIngredient = useCallback(() => {
    onChange([...value, createEmptyIngredient()]);
  }, [onChange, value]);

  const displayName = useCallback(
    (ing: Ingredient) => searchTerm[ing.id] ?? ing.name,
    [searchTerm]
  );

  const currentSuggestions = useMemo(
    () => (activeDropdown ? suggestions[activeDropdown] ?? [] : []),
    [activeDropdown, suggestions]
  );

  return (
    <div className="ingredient-input">
      {value.map((ing) => (
        <div key={ing.id} className="ingredient-row" ref={(el) => { dropdownRefs.current[ing.id] = el; }}>
          <div className="ingredient-name-wrapper">
            <input
              type="text"
              className="ingredient-name"
              placeholder="食材名称"
              value={displayName(ing)}
              onFocus={() => {
                const term = displayName(ing);
                if (term.trim()) {
                  setSuggestions((prev) => ({
                    ...prev,
                    [ing.id]: filterSuggestions(term),
                  }));
                  setActiveDropdown(ing.id);
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                updateIngredient(ing.id, { name: val });
                handleSearch(ing.id, val);
              }}
            />
            {activeDropdown === ing.id && currentSuggestions.length > 0 && (
              <div className="ingredient-dropdown">
                {currentSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    className="ingredient-dropdown-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(ing.id, sug);
                    }}
                  >
                    <span className="sug-name">{sug.name}</span>
                    {sug.caloriesPer100g != null && (
                      <span className="sug-calories">
                        {Math.round(sug.caloriesPer100g)} kcal/100g
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="number"
            className="ingredient-amount"
            placeholder="数量"
            min={0}
            step="0.1"
            value={ing.amount || ''}
            onChange={(e) =>
              updateIngredient(ing.id, {
                amount: parseFloat(e.target.value) || 0,
              })
            }
          />
          <select
            className="ingredient-unit"
            value={ing.unit}
            onChange={(e) =>
              updateIngredient(ing.id, {
                unit: e.target.value as Ingredient['unit'],
              })
            }
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ingredient-remove btn btn-danger"
            onClick={() => removeIngredient(ing.id)}
            disabled={value.length <= 1}
          >
            删除
          </button>
        </div>
      ))}
      <button
        type="button"
        className="ingredient-add btn btn-secondary"
        onClick={addIngredient}
      >
        + 添加食材
      </button>
    </div>
  );
};

export default IngredientInput;
