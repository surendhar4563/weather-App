import { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import WeeklyForecast from './components/WeeklyForecast';
import WeatherDetails from './components/WeatherDetails';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import WeatherBackground from './components/WeatherBackground';
import { fetchWeatherByCity, fetchWeatherByCoords, fetchForecast } from './api/weatherApi';
import { getBackgroundGradient, getWeatherEmoji, getDefaultBackgroundGradient } from './utils/weatherUtils';
import './App.css';

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('metric'); // 'metric' or 'imperial'
  const [city, setCity] = useState('');
  const [bgGradient, setBgGradient] = useState(getDefaultBackgroundGradient);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((cityName) => {
    if (!cityName) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== cityName.toLowerCase());
      const updated = [cityName, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch {
        // ignore localStorage write errors
      }
      return updated;
    });
  }, []);

  const loadWeather = useCallback(async (cityName) => {
    setLoading(true);
    setError('');
    try {
      const [weatherData, forecastData] = await Promise.all([
        fetchWeatherByCity(cityName, unit),
        fetchForecast(cityName, unit),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      const condition = weatherData?.weather?.[0]?.main || 'Clear';
      const sunset = weatherData?.sys?.sunset || 0;
      const sunrise = weatherData?.sys?.sunrise || 0;
      const dt = weatherData?.dt || Math.floor(Date.now() / 1000);
      setBgGradient(getBackgroundGradient(condition, sunset, sunrise, dt));
      setCity(cityName);
      addRecentSearch(cityName);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [unit, addRecentSearch]);

  const loadWeatherByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const [weatherData, forecastData] = await Promise.all([
        fetchWeatherByCoords(lat, lon, unit),
        fetchForecast(`${lat},${lon}`, unit, true),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      const condition = weatherData?.weather?.[0]?.main || 'Clear';
      const sunset = weatherData?.sys?.sunset || 0;
      const sunrise = weatherData?.sys?.sunrise || 0;
      const dt = weatherData?.dt || Math.floor(Date.now() / 1000);
      setBgGradient(getBackgroundGradient(condition, sunset, sunrise, dt));
      setCity(weatherData.name);
      addRecentSearch(weatherData.name);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, [unit, addRecentSearch]);

  // Reload weather when unit changes
  useEffect(() => {
    if (city) {
      loadWeather(city);
    }
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for geo-weather event emitted by SearchBar's locate button
  useEffect(() => {
    const handler = (e) => loadWeatherByCoords(e.detail.lat, e.detail.lon);
    window.addEventListener('geo-weather', handler);
    return () => window.removeEventListener('geo-weather', handler);
  }, [loadWeatherByCoords]);

  // Auto-detect location on first load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather('London'), // fallback
        { timeout: 7000 }
      );
    } else {
      loadWeather('London');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (searchCity, coords) => {
    if (coords && coords.lat && coords.lon) {
      loadWeatherByCoords(coords.lat, coords.lon);
    } else {
      loadWeather(searchCity);
    }
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  const isNightTime = weather?.weather?.[0]?.icon
    ? weather.weather[0].icon.includes('n')
    : weather?.sys
    ? (weather.dt > weather.sys.sunset || weather.dt < weather.sys.sunrise)
    : false;

  const currentCondition = weather?.weather?.[0]?.main || '';
  const cloudCover = weather?.clouds?.all ?? 0;
  const currentTemp = weather?.main?.temp;
  const weatherDesc = weather?.weather?.[0]?.description || '';

  return (
    <div className={`app ${bgGradient}`}>
      {/* 3D Animated Seasons & Weather Background */}
      <WeatherBackground
        condition={currentCondition}
        isNight={isNightTime}
        clouds={cloudCover}
        temp={currentTemp}
        unit={unit}
        description={weatherDesc}
      />

      <div className="app-overlay">
        <div className="container">
          {/* Header */}
          <header className="app-header">
            <div className="header-left">
              <span className="app-logo">🌈🌤️</span>
              <div>
                <h1 className="app-title">WeatherNow 🌍</h1>
                <span className="header-status">
                  ⚡ Live Atmosphere: {currentCondition} {getWeatherEmoji(currentCondition)}
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="unit-toggle"
                onClick={toggleUnit}
                title="Toggle temperature unit"
              >
                🌡️ °{unit === 'metric' ? 'C' : 'F'} ⇄ °{unit === 'metric' ? 'F' : 'C'}
              </button>
            </div>
          </header>

          {/* Search Bar with Live Typing Suggestions */}
          <SearchBar
            onSearch={handleSearch}
            recentSearches={recentSearches}
            currentCity={city}
          />

          {/* Content */}
          {loading && <LoadingSpinner />}
          {error && !loading && (
            <ErrorMessage
              message={error}
              onRetry={() => loadWeather(city || 'London')}
            />
          )}

          {!loading && !error && weather && (
            <div className="weather-content">
              <CurrentWeather weather={weather} unit={unit} />
              <WeatherDetails weather={weather} unit={unit} />
              {forecast && <HourlyForecast forecast={forecast} unit={unit} />}
              {forecast && <WeeklyForecast forecast={forecast} unit={unit} />}
            </div>
          )}

          <footer className="app-footer">
            <p>
              🌈 WeatherNow • 🌍 Realtime Global Forecast • 🌧️ 3D Weather Physics • 🚀 Fast &amp; Reliable
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
