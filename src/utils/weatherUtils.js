/**
 * Utility helpers for weather data formatting, emoji mapping & seasonal logic
 */

/** Returns default calendar season based on current date month */
export function getDefaultSeason() {
  const month = new Date().getMonth(); // 0 = Jan, 8 = Sep, 11 = Dec
  if (month >= 2 && month <= 4) return 'sunny'; // Spring (Mar-May)
  if (month >= 5 && month <= 7) return 'sunny'; // Summer (Jun-Aug)
  if (month >= 8 && month <= 10) return 'rain'; // Autumn / Monsoon Rain (Sep-Nov)
  return 'snow'; // Winter (Dec-Feb)
}

/** Returns default initial background gradient based on hour and season */
export function getDefaultBackgroundGradient() {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  if (isNight) return 'gradient-night';
  const season = getDefaultSeason();
  if (season === 'snow') return 'gradient-snow';
  if (season === 'rain') return 'gradient-rainy';
  return 'gradient-clear-day';
}

/** Returns a CSS class name for background gradient based on condition + time of day */
export function getBackgroundGradient(condition, sunset, sunrise, currentTime) {
  const isNight = currentTime > sunset || currentTime < sunrise;
  const c = condition?.toLowerCase();

  if (isNight) return 'gradient-night';
  if (c === 'clear') return 'gradient-clear-day';
  if (c === 'clouds') return 'gradient-cloudy';
  if (c === 'rain' || c === 'drizzle') return 'gradient-rainy';
  if (c === 'thunderstorm') return 'gradient-storm';
  if (c === 'snow') return 'gradient-snow';
  if (c === 'mist' || c === 'fog' || c === 'haze') return 'gradient-foggy';
  return 'gradient-clear-day';
}

/** Format Unix timestamp to local time string */
export function formatTime(unixTimestamp, timezone = 0) {
  const date = new Date((unixTimestamp + timezone) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** Format Unix timestamp to short day name */
export function formatDay(unixTimestamp, timezone = 0) {
  return new Date((unixTimestamp + timezone) * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** Format Unix timestamp to month/day */
export function formatDate(unixTimestamp, timezone = 0) {
  return new Date((unixTimestamp + timezone) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Get wind direction with compass emoji from degrees */
export function getWindDirection(deg) {
  if (deg === undefined || deg === null || isNaN(deg)) return '🧭 Variable';
  const dirs = [
    '⬆️ N',
    '↗️ NE',
    '➡️ E',
    '↘️ SE',
    '⬇️ S',
    '↙️ SW',
    '⬅️ W',
    '↖️ NW',
  ];
  return dirs[Math.round(deg / 45) % 8] || '🧭 N';
}

/** Get UV index label with colorful emojis */
export function getUVLabel(uvi) {
  if (uvi <= 2) return { label: '🟢 Low UV', color: '#4ade80' };
  if (uvi <= 5) return { label: '🟡 Moderate UV', color: '#facc15' };
  if (uvi <= 7) return { label: '🟠 High UV', color: '#fb923c' };
  if (uvi <= 10) return { label: '🔴 Very High UV', color: '#f87171' };
  return { label: '🟣 Extreme UV', color: '#c084fc' };
}

/** Get AQI label with emojis */
export function getAQILabel(aqi) {
  const labels = [
    '',
    '🟢 Good Air Quality',
    '🟡 Fair Air Quality',
    '🟠 Moderate Pollution',
    '🔴 Poor Air Quality',
    '🟣 Hazardous Air Quality',
  ];
  return labels[aqi] || '⚪ Unknown';
}

/** Convert meters/sec to km/h */
export function mpsToKmh(mps) {
  return (mps * 3.6).toFixed(1);
}

/** Get rich weather emoji combo from condition & day/night status */
export function getWeatherEmoji(condition, icon = '') {
  const isNight = icon?.includes('n');
  const c = condition?.toLowerCase() || '';

  if (c.includes('thunder') || c.includes('storm')) return '⛈️⚡';
  if (c.includes('rain')) return isNight ? '🌧️🌙' : '🌧️☔';
  if (c.includes('drizzle')) return '🌦️💧';
  if (c.includes('snow') || c.includes('sleet') || c.includes('ice')) return '❄️☃️';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '🌫️🌁';
  if (c.includes('dust') || c.includes('sand') || c.includes('tornado')) return '🌪️💨';
  if (c.includes('clear')) return isNight ? '🌙✨' : '☀️🌞';
  if (c.includes('cloud')) return isNight ? '☁️🌙' : '⛅☁️';

  return isNight ? '🌙' : '🌤️';
}

/** Group forecast list by day */
export function groupForecastByDay(list, timezone = 0) {
  const days = {};
  list.forEach((item) => {
    const day = formatDay(item.dt, timezone);
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  return days;
}

/** Get daily high/low from grouped forecast */
export function getDailyExtremes(dayItems) {
  const temps = dayItems.map((i) => i.main.temp);
  return {
    high: Math.round(Math.max(...temps)),
    low: Math.round(Math.min(...temps)),
    icon: dayItems[Math.floor(dayItems.length / 2)]?.weather[0],
    description: dayItems[Math.floor(dayItems.length / 2)]?.weather[0]?.description,
  };
}

/** Get humidity comfort label with emojis */
export function getHumidityLabel(humidity) {
  if (humidity < 30) return '🌵 Very Dry';
  if (humidity < 60) return '🌿 Comfortable & Crisp';
  if (humidity < 80) return '💧 Humid & Muggy';
  return '🌊 High Moisture';
}

/** Get visibility label with emojis */
export function getVisibilityLabel(meters) {
  if (meters >= 10000) return '🔭 Crystal Clear';
  if (meters >= 5000) return '👀 Good Visibility';
  if (meters >= 2000) return '🌫️ Moderate Haze';
  return '🌁 Dense Fog / Poor';
}
