// ==============================================================
// Weather API Service with Automatic Multi-Provider Fallback
// 1. Tries OpenWeatherMap (using your API key)
// 2. Seamlessly falls back to Open-Meteo (No API key needed, 100% free)
//    if the key is invalid, unactivated, or hits rate limits.
// ==============================================================

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '59d4aeac715093e0c5d1647b50f77a74';
const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// In-memory cache for Open-Meteo calls to prevent redundant requests
const openMeteoCache = new Map();

/**
 * Map WMO weather interpretation code to OpenWeatherMap-compatible format
 */
function mapWmoToWeather(code, isDay = 1) {
  const d = isDay ? 'd' : 'n';
  switch (code) {
    case 0:
      return { main: 'Clear', description: 'Clear sky', icon: `01${d}` };
    case 1:
      return { main: 'Clear', description: 'Mainly clear', icon: `01${d}` };
    case 2:
      return { main: 'Clouds', description: 'Partly cloudy', icon: `02${d}` };
    case 3:
      return { main: 'Clouds', description: 'Overcast', icon: `04${d}` };
    case 45:
    case 48:
      return { main: 'Mist', description: 'Foggy', icon: `50${d}` };
    case 51:
    case 53:
    case 55:
      return { main: 'Drizzle', description: 'Light drizzle', icon: `09${d}` };
    case 56:
    case 57:
      return { main: 'Snow', description: 'Freezing drizzle', icon: `13${d}` };
    case 61:
      return { main: 'Rain', description: 'Slight rain', icon: `10${d}` };
    case 63:
      return { main: 'Rain', description: 'Moderate rain', icon: `10${d}` };
    case 65:
      return { main: 'Rain', description: 'Heavy rain', icon: `10${d}` };
    case 66:
    case 67:
      return { main: 'Rain', description: 'Freezing rain', icon: `13${d}` };
    case 71:
    case 73:
    case 75:
    case 77:
      return { main: 'Snow', description: 'Snowfall', icon: `13${d}` };
    case 80:
    case 81:
    case 82:
      return { main: 'Rain', description: 'Rain showers', icon: `09${d}` };
    case 85:
    case 86:
      return { main: 'Snow', description: 'Snow showers', icon: `13${d}` };
    case 95:
      return { main: 'Thunderstorm', description: 'Thunderstorm', icon: `11${d}` };
    case 96:
    case 99:
      return { main: 'Thunderstorm', description: 'Thunderstorm with hail', icon: `11${d}` };
    default:
      return { main: 'Clouds', description: 'Cloudy', icon: `03${d}` };
  }
}

/**
 * Geocode a city name using Open-Meteo Geocoding API
 */
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Geocoding service unavailable');
  }
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Please check spelling.`);
  }
  const item = data.results[0];
  return {
    name: item.name,
    country: item.country_code?.toUpperCase() || item.country || '',
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

/**
 * Reverse geocode coordinates using free client API
 */
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.city || data.locality || data.principalSubdivision || 'Your Location',
        country: data.countryCode || '',
      };
    }
  } catch {
    // fallback if reverse geocoding is blocked
  }
  return { name: 'Your Location', country: '' };
}

/**
 * Fetch raw Open-Meteo bundle (current + forecast) with a 30s cache
 */
async function fetchOpenMeteoBundle(lat, lon, unit) {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)},${unit}`;
  const cached = openMeteoCache.get(key);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }

  const isImperial = unit === 'imperial';
  const unitParams = isImperial
    ? '&temperature_unit=fahrenheit&wind_speed_unit=mph'
    : '&wind_speed_unit=ms';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto${unitParams}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service error (${res.status}). Please try again.`);
  }
  const data = await res.json();
  openMeteoCache.set(key, { timestamp: Date.now(), data });
  return data;
}

/**
 * Convert Open-Meteo response to OpenWeatherMap-like current weather object
 */
function parseOpenMeteoWeather(data, name, country) {
  const offset = data.utc_offset_seconds || 0;
  const nowUtc = Math.floor(Date.now() / 1000);

  const sunriseStr = data.daily?.sunrise?.[0];
  const sunsetStr = data.daily?.sunset?.[0];
  const sunriseTs = sunriseStr
    ? Math.floor(new Date(sunriseStr + 'Z').getTime() / 1000) - offset
    : nowUtc - 21600;
  const sunsetTs = sunsetStr
    ? Math.floor(new Date(sunsetStr + 'Z').getTime() / 1000) - offset
    : nowUtc + 21600;

  return {
    name,
    sys: {
      country,
      sunrise: sunriseTs,
      sunset: sunsetTs,
    },
    weather: [
      mapWmoToWeather(data.current?.weather_code ?? 0, data.current?.is_day ?? 1),
    ],
    main: {
      temp: data.current?.temperature_2m ?? 0,
      feels_like: data.current?.apparent_temperature ?? data.current?.temperature_2m ?? 0,
      temp_min: data.daily?.temperature_2m_min?.[0] ?? data.current?.temperature_2m ?? 0,
      temp_max: data.daily?.temperature_2m_max?.[0] ?? data.current?.temperature_2m ?? 0,
      humidity: data.current?.relative_humidity_2m ?? 0,
      pressure: Math.round(data.current?.surface_pressure || 1013),
    },
    wind: {
      speed: data.current?.wind_speed_10m ?? 0,
      deg: data.current?.wind_direction_10m ?? 0,
      gust: data.current?.wind_gusts_10m ?? 0,
    },
    visibility: data.current?.visibility || 10000,
    clouds: {
      all: data.current?.cloud_cover ?? 0,
    },
    dt: nowUtc,
    timezone: offset,
  };
}

/**
 * Convert Open-Meteo response to OpenWeatherMap-like 5-day / hourly forecast object
 */
function parseOpenMeteoForecast(data, name, country) {
  const offset = data.utc_offset_seconds || 0;
  const nowUtc = Math.floor(Date.now() / 1000);

  const hourlyTimes = data.hourly?.time || [];
  const hourlyTemps = data.hourly?.temperature_2m || [];
  const hourlyCodes = data.hourly?.weather_code || [];
  const hourlyPops = data.hourly?.precipitation_probability || [];

  // Find index of current hour
  const currentHourIso = new Date((nowUtc + offset) * 1000).toISOString().slice(0, 13);
  let startIndex = hourlyTimes.findIndex(t => t.startsWith(currentHourIso));
  if (startIndex === -1) startIndex = 0;

  const list = [];
  // Sample forecast intervals (every 3 hours up to 40 data points)
  for (let i = startIndex; i < hourlyTimes.length && list.length < 40; i += 3) {
    const tStr = hourlyTimes[i];
    const itemUtc = Math.floor(new Date(tStr + 'Z').getTime() / 1000) - offset;
    const hourNum = parseInt(tStr.split('T')[1]?.split(':')[0] || '12', 10);
    const isDay = hourNum >= 6 && hourNum < 20 ? 1 : 0;

    list.push({
      dt: itemUtc,
      main: {
        temp: hourlyTemps[i] ?? 0,
      },
      weather: [
        mapWmoToWeather(hourlyCodes[i] ?? 0, isDay),
      ],
      pop: (hourlyPops[i] ?? 0) / 100,
    });
  }

  return {
    city: {
      name,
      country,
      timezone: offset,
    },
    list,
  };
}

/**
 * Fetch current weather by city name
 */
export async function fetchWeatherByCity(city, unit = 'metric') {
  // 1. Try OpenWeatherMap if key is valid
  if (API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
    try {
      const url = `${OWM_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      console.warn(`OpenWeatherMap returned ${res.status}. Falling back to Open-Meteo.`);
    } catch (err) {
      console.warn('OpenWeatherMap request failed:', err);
    }
  }

  // 2. Seamless fallback to Open-Meteo (No API key needed!)
  const geo = await geocodeCity(city);
  const bundle = await fetchOpenMeteoBundle(geo.latitude, geo.longitude, unit);
  return parseOpenMeteoWeather(bundle, geo.name, geo.country);
}

/**
 * Fetch current weather by coordinates
 */
export async function fetchWeatherByCoords(lat, lon, unit = 'metric') {
  // 1. Try OpenWeatherMap
  if (API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
    try {
      const url = `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      console.warn(`OpenWeatherMap returned ${res.status}. Falling back to Open-Meteo.`);
    } catch (err) {
      console.warn('OpenWeatherMap coords request failed:', err);
    }
  }

  // 2. Seamless fallback to Open-Meteo
  const geo = await reverseGeocode(lat, lon);
  const bundle = await fetchOpenMeteoBundle(lat, lon, unit);
  return parseOpenMeteoWeather(bundle, geo.name, geo.country);
}

/**
 * Fetch 5-day / 3-hour forecast
 */
export async function fetchForecast(query, unit = 'metric', byCoords = false) {
  // 1. Try OpenWeatherMap
  if (API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
    try {
      let url;
      if (byCoords) {
        const [lat, lon] = query.split(',');
        url = `${OWM_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
      } else {
        url = `${OWM_BASE_URL}/forecast?q=${encodeURIComponent(query)}&units=${unit}&appid=${API_KEY}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      console.warn(`OpenWeatherMap forecast returned ${res.status}. Falling back to Open-Meteo.`);
    } catch (err) {
      console.warn('OpenWeatherMap forecast request failed:', err);
    }
  }

  // 2. Seamless fallback to Open-Meteo
  let lat, lon, name, country;
  if (byCoords) {
    const parts = query.split(',');
    lat = parseFloat(parts[0]);
    lon = parseFloat(parts[1]);
    const geo = await reverseGeocode(lat, lon);
    name = geo.name;
    country = geo.country;
  } else {
    const geo = await geocodeCity(query);
    lat = geo.latitude;
    lon = geo.longitude;
    name = geo.name;
    country = geo.country;
  }

  const bundle = await fetchOpenMeteoBundle(lat, lon, unit);
  return parseOpenMeteoForecast(bundle, name, country);
}
