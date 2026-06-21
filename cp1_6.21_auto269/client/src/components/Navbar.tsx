import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Plus, User } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  onSearch?: (keyword: string) => void;
  searchValue?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, searchValue = '' }) => {
  const location = useLocation();
  const [inputValue, setInputValue] = React.useState(searchValue);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim().length > 0) {
      fetch(`/api/recipes/search/suggestions?keyword=${encodeURIComponent(value)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (inputValue.trim()) {
      if (location.pathname !== '/search') {
        window.location.href = `/search?q=${encodeURIComponent(inputValue.trim())}`;
      } else {
        onSearch?.(inputValue.trim());
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    if (location.pathname !== '/search') {
      window.location.href = `/search?q=${encodeURIComponent(suggestion)}`;
    } else {
      onSearch?.(suggestion);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <ChefHat size={28} className="logo-icon" />
          <span className="logo-text">食谱管家</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索食谱名称或食材..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="search-input"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="search-suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="navbar-actions">
          <Link to="/create" className="btn btn-primary create-btn">
            <Plus size={18} />
            <span>新建食谱</span>
          </Link>
          <Link to="/profile" className="profile-btn" title="个人空间">
            <User size={22} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
