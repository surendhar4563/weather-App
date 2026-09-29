import {
  groupForecastByDay,
  getDailyExtremes,
  formatDate,
  getWeatherEmoji,
} from '../utils/weatherUtils';
import './WeeklyForecast.css';

function WeeklyForecast({ forecast, unit }) {
  const timezone = forecast.city?.timezone || 0;
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const grouped = groupForecastByDay(forecast.list, timezone);
  const days = Object.entries(grouped).slice(0, 5); // max 5 days

  return (
    <div className="weekly-forecast">
      <h3 className="section-title">📅 5-Day Extended Weather Outlook 🗓️</h3>
      <div className="weekly-list">
        {days.map(([day, items], i) => {
          const { high, low, icon, description } = getDailyExtremes(items);
          const emoji = getWeatherEmoji(icon?.main, icon?.icon);
          const rainChance = Math.round(
            Math.max(...items.map((it) => it.pop || 0)) * 100
          );

          return (
            <div key={i} className="weekly-card glass-card">
              <div className="weekly-day-col">
                <p className="weekly-day">
                  {i === 0 ? '🌟 Today' : `📅 ${day}`}
                </p>
                <p className="weekly-date">
                  🗓️ {formatDate(items[0].dt, timezone)}
                </p>
              </div>
              <div className="weekly-icon-col">
                <span className="weekly-emoji">{emoji}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${icon?.icon}.png`}
                  alt={description}
                  className="weekly-icon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <p className="weekly-desc">{description}</p>
              {rainChance > 0 ? (
                <span className="weekly-rain">💧 {rainChance}%</span>
              ) : (
                <span className="weekly-rain" style={{ opacity: 0.5 }}>
                  ☀️ 0%
                </span>
              )}
              <div className="weekly-temps">
                <span className="weekly-high">🔺 {high}{tempUnit}</span>
                <div className="temp-bar-track">
                  <div
                    className="temp-bar-fill"
                    style={{
                      marginLeft: `${Math.max(0, ((low + 20) / 80) * 100)}%`,
                      width: `${Math.max(5, ((high - low) / 40) * 100)}%`,
                    }}
                  />
                </div>
                <span className="weekly-low">🔻 {low}{tempUnit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyForecast;
