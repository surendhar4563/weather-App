import { formatTime, formatDay, getWeatherEmoji } from '../utils/weatherUtils';
import './HourlyForecast.css';

function HourlyForecast({ forecast, unit }) {
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const timezone = forecast.city?.timezone || 0;

  // Take next 8 forecast intervals (24 hours)
  const items = forecast.list.slice(0, 8);
  const todayDay = items.length > 0 ? formatDay(items[0].dt, timezone) : '';

  return (
    <div className="hourly-forecast">
      <div className="hourly-header">
        <h3 className="section-title">⏱️ 24-Hour Forecast Timeline 🕒</h3>
        <span className="hourly-badge">⚡ 8 Intervals (No Scroll)</span>
      </div>

      <div className="hourly-grid">
        {items.map((item, i) => {
          const { main, dt, weather, pop } = item;
          const time = formatTime(dt, timezone);
          const dayName = formatDay(dt, timezone);
          const isNextDay = dayName !== todayDay;
          const emoji = getWeatherEmoji(weather[0].main, weather[0].icon);
          const rainChance = Math.round((pop || 0) * 100);

          return (
            <div key={i} className="hourly-card glass-card">
              <div className="hourly-card-top">
                <span className="hourly-time">⏰ {i === 0 ? 'Now' : time}</span>
                {isNextDay && <span className="hourly-day-tag">📅 {dayName}</span>}
              </div>

              <div className="hourly-visual">
                <span className="hourly-emoji">{emoji}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${weather[0].icon}.png`}
                  alt={weather[0].description}
                  className="hourly-icon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <div className="hourly-temp-box">
                <span className="hourly-temp">{Math.round(main.temp)}{tempUnit}</span>
              </div>

              <div className="hourly-footer">
                <span className="hourly-desc">
                  {weather[0].description}
                </span>
                {rainChance > 0 ? (
                  <span className="hourly-rain">💧 Rain: {rainChance}%</span>
                ) : (
                  <span className="hourly-rain dry">☀️ Dry (0%)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HourlyForecast;
