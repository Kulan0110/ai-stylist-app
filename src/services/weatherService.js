// Fetches real-time weather for Ulaanbaatar with a mock fallback.
// Replace WEATHER_API_KEY with your OpenWeatherMap key for live data.

const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_KEY';
const UB_LAT = 47.9077;
const UB_LON = 106.8832;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const MOCK_WEATHER = {
  temp: '-4°C',
  feels_like: '-9°C',
  condition: 'Цасан шуурга',
  condition_en: 'Snow',
  humidity: '72%',
  wind: '18 km/h',
  icon: '13d',
  city: 'Улаанбаатар',
};

const conditionMap = {
  Clear: 'Цэлмэг',
  Clouds: 'Үүлтэй',
  Snow: 'Цасан шуурга',
  Rain: 'Бороотой',
  Drizzle: 'Чийгтэй',
  Thunderstorm: 'Аянга',
  Mist: 'Манантай',
  Fog: 'Манантай',
};

export async function fetchUlaanbaatarWeather() {
  if (WEATHER_API_KEY === 'YOUR_OPENWEATHERMAP_KEY') {
    await _simulateLatency(600);
    return { success: true, data: MOCK_WEATHER };
  }

  try {
    const url = `${BASE_URL}?lat=${UB_LAT}&lon=${UB_LON}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    const json = await response.json();

    return {
      success: true,
      data: {
        temp: `${Math.round(json.main.temp)}°C`,
        feels_like: `${Math.round(json.main.feels_like)}°C`,
        condition: conditionMap[json.weather[0].main] ?? json.weather[0].description,
        condition_en: json.weather[0].main,
        humidity: `${json.main.humidity}%`,
        wind: `${Math.round(json.wind.speed * 3.6)} km/h`,
        icon: json.weather[0].icon,
        city: 'Улаанбаатар',
      },
    };
  } catch {
    return { success: true, data: MOCK_WEATHER };
  }
}

function _simulateLatency(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
