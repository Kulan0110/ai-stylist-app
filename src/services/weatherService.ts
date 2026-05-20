// Fetches real-time weather via Open-Meteo (free, no API key required).
// Falls back to Ulaanbaatar coords if location permission is denied or times out.

import * as Location from 'expo-location';
import type { WeatherData, ApiResult } from '../types';

const OPEN_METEO_URL  = 'https://api.open-meteo.com/v1/forecast';
const FETCH_TIMEOUT   = 10_000; // ms
const GPS_TIMEOUT     = 8_000;  // ms

// Ulaanbaatar fallback coords
const UB_LAT  = 47.9077;
const UB_LON  = 106.8832;
const UB_CITY = 'Улаанбаатар';

// Used only when the API call itself fails completely
const FALLBACK_WEATHER: WeatherData = {
  temp:              '-4°C',
  feels_like:        '-9°C',
  condition:         'Цасан шуурга',
  condition_en:      'Snow',
  wind:              '18 km/h',
  city:              UB_CITY,
  day_temp_max:      '0°C',
  day_temp_min:      '-10°C',
  day_feels_max:     '-5°C',
  day_wind_max:      '25 km/h',
  day_precip_chance: '70%',
  day_condition:     'Цасан шуурга',
  day_condition_en:  'Snow',
};

// WMO weather code → Mongolian label + English key
const WMO_MAP: Record<number, { mn: string; en: string }> = {
  0:  { mn: 'Цэлмэг',            en: 'Clear' },
  1:  { mn: 'Цэлмэг',            en: 'Clear' },
  2:  { mn: 'Хэсэгчлэн үүлтэй', en: 'Clouds' },
  3:  { mn: 'Үүлтэй',            en: 'Clouds' },
  45: { mn: 'Манантай',          en: 'Mist' },
  48: { mn: 'Манантай',          en: 'Mist' },
  51: { mn: 'Чийгтэй',           en: 'Drizzle' },
  53: { mn: 'Чийгтэй',           en: 'Drizzle' },
  55: { mn: 'Чийгтэй',           en: 'Drizzle' },
  61: { mn: 'Бороотой',          en: 'Rain' },
  63: { mn: 'Бороотой',          en: 'Rain' },
  65: { mn: 'Их бороотой',       en: 'Rain' },
  71: { mn: 'Цасан шуурга',      en: 'Snow' },
  73: { mn: 'Цасан шуурга',      en: 'Snow' },
  75: { mn: 'Их цас',            en: 'Snow' },
  77: { mn: 'Мөндөр',            en: 'Snow' },
  80: { mn: 'Бороотой',          en: 'Rain' },
  81: { mn: 'Бороотой',          en: 'Rain' },
  82: { mn: 'Их бороотой',       en: 'Rain' },
  85: { mn: 'Цасан шуурга',      en: 'Snow' },
  86: { mn: 'Их цас',            en: 'Snow' },
  95: { mn: 'Аянга',             en: 'Thunderstorm' },
  96: { mn: 'Аянгатай цас',      en: 'Thunderstorm' },
  99: { mn: 'Аянгатай цас',      en: 'Thunderstorm' },
};

// ---------- Public API -------------------------------------------------------

export async function fetchWeatherByLocation(): Promise<ApiResult<WeatherData>> {
  const { lat, lon, city } = await _getCoords();

  try {
    const params = new URLSearchParams({
      latitude:        String(lat),
      longitude:       String(lon),
      current:         'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
      daily:           'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,wind_speed_10m_max,precipitation_probability_max',
      wind_speed_unit: 'kmh',
      timezone:        'auto',
      forecast_days:   '1',
    });

    const json = await _fetchWithTimeout(`${OPEN_METEO_URL}?${params}`, FETCH_TIMEOUT);

    // Validate response shape
    if (!json.current || !json.daily) {
      throw new Error('Unexpected Open-Meteo response shape');
    }

    const cur  = json.current;
    const day  = json.daily;

    const curWmo = WMO_MAP[cur.weather_code]       ?? { mn: 'Тодорхойгүй', en: 'Unknown' };
    const dayWmo = WMO_MAP[day.weather_code?.[0]]  ?? curWmo;

    return {
      success: true,
      data: {
        // Current moment — used in weather pill header
        temp:              _fmt(cur.temperature_2m),
        feels_like:        _fmt(cur.apparent_temperature),
        condition:         curWmo.mn,
        condition_en:      curWmo.en,
        wind:              `${_safeRound(cur.wind_speed_10m)} km/h`,
        city:              city ?? UB_CITY,
        // Full-day forecast — used by AI outfit/tip generation
        day_temp_max:      _fmt(day.temperature_2m_max?.[0]),
        day_temp_min:      _fmt(day.temperature_2m_min?.[0]),
        day_feels_max:     _fmt(day.apparent_temperature_max?.[0]),
        day_wind_max:      `${_safeRound(day.wind_speed_10m_max?.[0])} km/h`,
        day_precip_chance: `${day.precipitation_probability_max?.[0] ?? 0}%`,
        day_condition:     dayWmo.mn,
        day_condition_en:  dayWmo.en,
      },
    };
  } catch (err: any) {
    console.warn('[weatherService] API fallback:', err.message);
    return {
      success: true,
      data: { ...FALLBACK_WEATHER, city: city ?? FALLBACK_WEATHER.city },
    };
  }
}

// Backward-compat alias used by TodaysTip and HomeScreen
export const fetchUlaanbaatarWeather = fetchWeatherByLocation;

// ---------- Helpers ----------------------------------------------------------

// Fetch with AbortController timeout — throws on timeout or non-2xx
async function _fetchWithTimeout(url: string, ms: number): Promise<any> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Round a number safely; returns '?' if value is null/undefined/NaN
function _safeRound(val: any): number | string {
  const n = Number(val);
  return Number.isFinite(n) ? Math.round(n) : '?';
}

// Format temperature with degree sign; returns '?°C' on invalid input
function _fmt(val: any): string {
  const n = Number(val);
  return Number.isFinite(n) ? `${Math.round(n)}°C` : '?°C';
}

interface Coords {
  lat: number;
  lon: number;
  city: string | null;
}

// Get device GPS coords with a hard timeout; falls back to UB coords
async function _getCoords(): Promise<Coords> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { lat: UB_LAT, lon: UB_LON, city: null };

    // Race GPS against a timeout so the app never hangs
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('GPS timeout')), GPS_TIMEOUT)
      ),
    ]);

    const [place] = await Location.reverseGeocodeAsync({
      latitude:  pos.coords.latitude,
      longitude: pos.coords.longitude,
    }).catch(() => [null]);

    const city = place?.city ?? place?.district ?? place?.region ?? null;
    return { lat: pos.coords.latitude, lon: pos.coords.longitude, city };
  } catch {
    return { lat: UB_LAT, lon: UB_LON, city: null };
  }
}

function _wmoIcon(code: number): string {
  if (code === 0 || code === 1)       return '01d';
  if (code === 2)                     return '02d';
  if (code === 3)                     return '04d';
  if (code === 45 || code === 48)     return '50d';
  if (code >= 51 && code <= 55)       return '09d';
  if (code >= 61 && code <= 65)       return '10d';
  if (code >= 71 && code <= 77)       return '13d';
  if (code >= 80 && code <= 82)       return '09d';
  if (code >= 85 && code <= 86)       return '13d';
  if (code >= 95)                     return '11d';
  return '01d';
}
