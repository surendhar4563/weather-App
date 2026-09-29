import {
  getWindDirection,
  getHumidityLabel,
  getVisibilityLabel,
  mpsToKmh,
} from '../utils/weatherUtils';
import './WeatherDetails.css';

function WeatherDetails({ weather, unit }) {
  const humidity = weather.main?.humidity ?? 0;
  const pressure = weather.main?.pressure ?? 1013;
  const speed = weather.wind?.speed ?? 0;
  const deg = weather.wind?.deg ?? 0;
  const gust = weather.wind?.gust;
  const visibility = weather.visibility;
  const cloudCover = weather.clouds?.all ?? 0;

  const speedUnit = unit === 'metric' ? 'km/h' : 'mph';
  const displaySpeed = unit === 'metric' ? mpsToKmh(speed) : (typeof speed === 'number' ? speed.toFixed(1) : '0');
  const displayGust = gust ? (unit === 'metric' ? mpsToKmh(gust) : (typeof gust === 'number' ? gust.toFixed(1) : String(gust))) : null;
  const visKm = visibility ? (visibility / 1000).toFixed(1) : null;

  const details = [
    {
      icon: '💧',
      label: 'Humidity 💦',
      value: `${humidity}%`,
      sub: getHumidityLabel(humidity),
      bar: humidity,
      barColor: humidity > 70 ? '#60a5fa' : '#34d399',
    },
    {
      icon: '🍃',
      label: 'Wind Flow 💨',
      value: `${displaySpeed} ${speedUnit}`,
      sub: `${getWindDirection(deg)} (${deg}°)`,
      bar: Math.min((parseFloat(displaySpeed) / 100) * 100, 100),
      barColor: '#a78bfa',
    },
    {
      icon: '⏲️',
      label: 'Barometer 🌀',
      value: `${pressure} hPa`,
      sub: pressure > 1013 ? '🔺 High Pressure' : '🔻 Low Pressure',
      bar: Math.min(((pressure - 950) / 100) * 100, 100),
      barColor: '#fb923c',
    },
    {
      icon: '🔭',
      label: 'Visibility Range 👁️',
      value: visKm ? `${visKm} km` : 'N/A',
      sub: visKm ? getVisibilityLabel(visibility) : '',
      bar: visKm ? Math.min((parseFloat(visKm) / 10) * 100, 100) : 0,
      barColor: '#f472b6',
    },
    {
      icon: '⛅',
      label: 'Cloud Density ☁️',
      value: `${cloudCover}%`,
      sub:
        cloudCover < 25
          ? '☀️ Clear Skies'
          : cloudCover < 50
          ? '⛅ Partly Cloudy'
          : cloudCover < 85
          ? '☁️ Mostly Cloudy'
          : '🌫️ Completely Overcast',
      bar: cloudCover,
      barColor: '#94a3b8',
    },
    ...(displayGust
      ? [
          {
            icon: '⚡',
            label: 'Peak Wind Gust 🌬️',
            value: `${displayGust} ${speedUnit}`,
            sub: '🌪️ Strongest Instant Burst',
            bar: Math.min((parseFloat(displayGust) / 100) * 100, 100),
            barColor: '#c084fc',
          },
        ]
      : []),
  ];

  return (
    <div className="weather-details">
      <h3 className="section-title">📊 Atmospheric & Weather Metrics 📈</h3>
      <div className="details-grid">
        {details.map((d, i) => (
          <div key={i} className="detail-card glass-card">
            <div className="detail-header">
              <span className="detail-icon">{d.icon}</span>
              <span className="detail-label">{d.label}</span>
            </div>
            <div className="detail-value">{d.value}</div>
            <div className="detail-sub">{d.sub}</div>
            <div className="detail-bar-track">
              <div
                className="detail-bar-fill"
                style={{ width: `${d.bar}%`, background: d.barColor }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeatherDetails;
