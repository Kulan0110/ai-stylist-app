import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { fetchUlaanbaatarWeather } from '../services/weatherService';
import { generateDailyTip }        from '../services/aiService';
import type { WeatherData } from '../types';

const WEATHER_ICONS: Record<string, string> = {
  Clear:        '☀️',
  Clouds:       '⛅',
  Mist:         '🌫️',
  Drizzle:      '🌦️',
  Rain:         '🌧️',
  Snow:         '❄️',
  Thunderstorm: '⛈️',
};

// ── Skeleton bar ─────────────────────────────────────────────────────────────

interface SkeletonBarProps {
  width: number | string;
  height?: number;
  style?: any;
}

function SkeletonBar({ width, height = 13, style }: SkeletonBarProps) {
  const shimmer = useRef(new Animated.Value(0.22)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.50, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.22, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[S.skBar, { width, height, opacity: shimmer }, style]} />
  );
}

function SkeletonCard() {
  return (
    <View style={S.card}>
      <View style={S.skWeatherRow}>
        <SkeletonBar width={52} height={52} style={{ borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBar width="55%" height={20} style={{ borderRadius: 6 }} />
          <SkeletonBar width="36%" height={13} style={{ borderRadius: 5 }} />
        </View>
        <View style={{ gap: 7 }}>
          <SkeletonBar width={72} height={22} style={{ borderRadius: 11 }} />
          <SkeletonBar width={72} height={22} style={{ borderRadius: 11 }} />
        </View>
      </View>

      <View style={S.divider} />

      <SkeletonBar width="40%" height={11} style={{ borderRadius: 5, marginBottom: 14 }} />
      <SkeletonBar width="100%" style={{ borderRadius: 5, marginBottom: 9 }} />
      <SkeletonBar width="92%"  style={{ borderRadius: 5, marginBottom: 9 }} />
      <SkeletonBar width="68%"  style={{ borderRadius: 5, marginBottom: 20 }} />
      <View style={{ alignItems: 'flex-end' }}>
        <SkeletonBar width={96} height={28} style={{ borderRadius: 14 }} />
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TodaysTip() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tip,     setTip]     = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const fadeAnim              = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    fadeAnim.setValue(0);

    const wRes    = await fetchUlaanbaatarWeather();
    const wData   = wRes.success ? wRes.data : null;
    setWeather(wData);

    const tipRes  = await generateDailyTip({ weather: wData });
    setTip(tipRes.success ? (tipRes.data ?? '') : '');

    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return <SkeletonCard />;

  const icon = WEATHER_ICONS[weather?.condition_en ?? ''] ?? '🌡️';

  return (
    <Animated.View style={[S.card, { opacity: fadeAnim }]}>

      {/* ── Weather row ── */}
      <View style={S.weatherRow}>
        <Text style={S.weatherIcon}>{icon}</Text>

        <View style={S.weatherCenter}>
          {weather?.day_temp_max ? (
            <Text style={S.weatherTemp}>
              {weather.day_temp_min} ~ {weather.day_temp_max}
            </Text>
          ) : (
            <Text style={S.weatherTemp}>{weather?.temp ?? '—'}</Text>
          )}
          <Text style={S.weatherCond}>
            {weather?.day_condition ?? weather?.condition ?? 'Тодорхойгүй'}
          </Text>
        </View>

        <View style={S.metaCol}>
          <View style={S.metaPill}>
            <Text style={S.metaEmoji}>🌧</Text>
            <Text style={S.metaValue}>{weather?.day_precip_chance ?? '—'}</Text>
          </View>
          <View style={S.metaPill}>
            <Text style={S.metaEmoji}>💨</Text>
            <Text style={S.metaValue}>{weather?.day_wind_max ?? weather?.wind ?? '—'}</Text>
          </View>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={S.divider} />

      {/* ── Tip ── */}
      <View style={S.tipSection}>
        <View style={S.tipHeader}>
          <Text style={S.tipSparkle}>✨</Text>
          <Text style={S.tipTitle}>ӨНӨӨДРИЙН ЗӨВЛӨГӨӨ</Text>
        </View>
        <Text style={S.tipText}>{tip}</Text>
      </View>

      {/* ── Refresh ── */}
      <TouchableOpacity style={S.refreshBtn} onPress={load} activeOpacity={0.72}>
        <Text style={S.refreshIcon}>🔄</Text>
        <Text style={S.refreshLabel}>Шинэчлэх</Text>
      </TouchableOpacity>

    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius:    20,
    padding:         20,
    marginBottom:    16,
  },

  // Weather
  weatherRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 } as any,
  weatherIcon:   { fontSize: 48, lineHeight: 56 },
  weatherCenter: { flex: 1 },
  weatherTemp: {
    fontSize: 28, fontWeight: '800',
    color: '#ffffff', letterSpacing: -0.5, lineHeight: 32,
  },
  weatherCond: { fontSize: 13, color: '#8888aa', fontWeight: '500', marginTop: 2 },

  metaCol:   { alignItems: 'flex-end', gap: 6 } as any,
  metaPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(124,106,245,0.14)',
    borderRadius: 9999,
    paddingVertical: 4, paddingHorizontal: 10,
    gap: 4,
  } as any,
  metaEmoji: { fontSize: 12 },
  metaValue: { fontSize: 12, fontWeight: '700', color: '#bbbbcc' },

  // Divider
  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 16,
  },

  // Tip
  tipSection:  { marginBottom: 16 },
  tipHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 } as any,
  tipSparkle:  { fontSize: 15 },
  tipTitle: {
    fontSize: 10, fontWeight: '800',
    letterSpacing: 1.4, color: '#7c6af5',
  },
  tipText: { fontSize: 15, lineHeight: 24, color: '#ddddee', fontWeight: '400' },

  // Refresh
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(124,106,245,0.14)',
    borderRadius: 9999,
    paddingVertical: 7, paddingHorizontal: 14,
    gap: 6,
  } as any,
  refreshIcon:  { fontSize: 13 },
  refreshLabel: { fontSize: 12, fontWeight: '700', color: '#7c6af5', letterSpacing: 0.3 },

  // Skeleton
  skBar:        { backgroundColor: '#2a2a42', borderRadius: 6 },
  skWeatherRow: { flexDirection: 'row', alignItems: 'center', gap: 14 } as any,
});
