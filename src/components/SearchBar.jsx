import { useState, useRef, useEffect } from 'react';
import './SearchBar.css';

/**
 * Flag emoji helper from 2-letter ISO country code
 */
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '📍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function SearchBar({ onSearch, recentSearches, currentCity }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Live autocomplete typing suggestions from Open-Meteo
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimerRef.current);
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }
    const trimmed = input.trim();
    if (trimmed) {
      onSearch(trimmed);
      setInput('');
      setShowDropdown(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (item) => {
    onSearch(item.name, { lat: item.latitude, lon: item.longitude });
    setInput('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleSelectRecent = (cityName) => {
    onSearch(cityName);
    setInput('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const listLength = suggestions.length > 0 ? suggestions.length : recentSearches.length;
    if (!showDropdown || listLength === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < listLength - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : listLength - 1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.dispatchEvent(new CustomEvent('geo-weather', {
          detail: { lat: pos.coords.latitude, lon: pos.coords.longitude }
        }));
        setIsGeoLoading(false);
        setShowDropdown(false);
      },
      () => {
        setIsGeoLoading(false);
        alert('Unable to detect your location. Please check browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasSuggestions = suggestions.length > 0;
  const isTyping = input.trim().length >= 2;

  return (
    <div className="search-wrapper">
      <form className="search-bar glass-card" onSubmit={handleSubmit}>
        <div className="search-input-group">
          <span className="search-icon">🔎</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="🔍 Search any city, state or country... 🌍"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowDropdown(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Search city"
          />
          {isSearching && <span className="search-loader">⏳</span>}
          {input && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setInput('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              title="Clear text"
              aria-label="Clear search"
            >
              ❌
            </button>
          )}
        </div>
        <button
          type="button"
          className="geo-btn"
          onClick={handleGeolocate}
          disabled={isGeoLoading}
          title="Auto-Detect My GPS Location"
          aria-label="Use my location"
        >
          {isGeoLoading ? '⏳' : '📍'}
        </button>
        <button type="submit" className="search-btn" aria-label="Search">
          🚀 Search
        </button>
      </form>

      {/* Autocomplete Suggestions / Recent Searches Dropdown */}
      {showDropdown && (
        <div className="search-dropdown glass-card" ref={dropdownRef}>
          {/* Live Typing Suggestions */}
          {isTyping ? (
            <>
              <p className="dropdown-label">
                {isSearching
                  ? '⏳ Searching places...'
                  : hasSuggestions
                  ? '📍 Matching Locations 🌍'
                  : '❌ No locations found'}
              </p>
              {suggestions.map((item, idx) => {
                const flag = getFlagEmoji(item.country_code);
                const region = [item.admin1, item.country].filter(Boolean).join(', ');
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    className={`dropdown-item suggestion-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="suggestion-flag">{flag}</span>
                    <div className="suggestion-details">
                      <span className="suggestion-name">🏙️ {item.name}</span>
                      {region && <span className="suggestion-sub">🗺️ {region}</span>}
                    </div>
                    {item.latitude && item.longitude && (
                      <span className="suggestion-coords">
                        📌 {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          ) : recentSearches.length > 0 ? (
            <>
              <p className="dropdown-label">🕒 Recent Places Searched 🧭</p>
              {recentSearches.map((city, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`dropdown-item ${city === currentCity ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectRecent(city)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="dropdown-icon">🕒</span>
                    <span className="suggestion-name">📍 {city}</span>
                    {city === currentCity && <span className="current-badge">✨ Current</span>}
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
