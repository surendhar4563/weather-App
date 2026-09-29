import { formatTime, getWeatherEmoji } from '../utils/weatherUtils';
import './CurrentWeather.css';

function CurrentWeather({ weather, unit }) {
  const name = weather.name || 'Unknown Location';
  const country = weather.sys?.country || '';
  const sunrise = weather.sys?.sunrise || 0;
  const sunset = weather.sys?.sunset || 0;
  const cond = weather.weather?.[0] || {};
  const main = cond.main || 'Clear';
  const description = cond.description || 'Clear sky';
  const icon = cond.icon || '01d';
  const temp = weather.main?.temp ?? 0;
  const feels_like = weather.main?.feels_like ?? temp;
  const temp_min = weather.main?.temp_min ?? temp;
  const temp_max = weather.main?.temp_max ?? temp;
  const dt = weather.dt || 0;
  const timezone = weather.timezone || 0;

  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const emoji = getWeatherEmoji(main, icon);
  const sunriseTime = formatTime(sunrise, timezone);
  const sunsetTime = formatTime(sunset, timezone);
  const localTime = formatTime(dt, timezone);

  return (
    <div className="current-weather glass-card">
      <div className="cw-top">
        <div className="cw-location">
          <h2 className="city-name">📍 {name} {country ? `• 🏳️ ${country}` : ''}</h2>
          <p className="local-time">⏰ Local Time: {localTime}</p>
        </div>
        <div className="cw-icon-area">
          <span className="weather-emoji">{emoji}</span>
          <img
            src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
            alt={description}
            className="weather-icon-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      <div className="cw-main">
        <div className="temp-display">
          <span className="temp-value">{Math.round(temp)}</span>
          <span className="temp-unit">{tempUnit}</span>
        </div>
        <p className="weather-desc">
          <span className="desc-emoji">{emoji}</span> {description}
        </p>
        <p className="feels-like">
          🌡️ Real Feel: <strong>{Math.round(feels_like)}{tempUnit}</strong>
        </p>
      </div>

      <div className="cw-range">
        <div className="temp-range-item">
          <span className="range-icon">🔺 Highest:</span>
          <span>{Math.round(temp_max)}{tempUnit}</span>
        </div>
        <div className="range-divider" />
        <div className="temp-range-item">
          <span className="range-icon">🔻 Lowest:</span>
          <span>{Math.round(temp_min)}{tempUnit}</span>
        </div>
      </div>

      <div className="cw-sun-row">
        <div className="sun-item">
          <span>🌅 Sunrise</span>
          <strong>{sunriseTime}</strong>
        </div>
        <div className="sun-divider" />
        <div className="sun-item">
          <span>🌇 Sunset</span>
          <strong>{sunsetTime}</strong>
        </div>
        <div className="sun-divider" />
        <div className="sun-item">
          <span>✨ Condition</span>
          <strong>{main}</strong>
        </div>
      </div>
    </div>
  );
}

export default CurrentWeather;
