import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { City } from '@/types';
import { searchCities } from '@/data/cityData';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string, city?: City) => void;
  placeholder: string;
  icon: 'origin' | 'destination';
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  placeholder,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const results = searchCities(value);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: City) => {
    onChange(city.name, city);
    setShowDropdown(false);
  };

  const iconColor = icon === 'origin' ? '#4a9eff' : '#ef4444';

  return (
    <div className="autocomplete-wrapper">
      <div className={`input-container ${isFocused ? 'focused' : ''}`}>
        <MapPin size={18} color={iconColor} className="input-icon" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="autocomplete-input"
        />
        {value && (
          <Search size={16} className="search-icon" />
        )}
        <div className="input-underline" />
      </div>
      
      {showDropdown && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          {suggestions.map((city) => (
            <div
              key={city.id}
              className="suggestion-item"
              onClick={() => handleSelect(city)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <MapPin size={14} className="suggestion-icon" />
              <div className="suggestion-content">
                <span className="suggestion-name">{city.name}</span>
                <span className="suggestion-province">{city.province}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
