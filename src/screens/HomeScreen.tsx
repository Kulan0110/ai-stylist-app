import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, Animated, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import TodaysTip    from '../components/TodaysTip';
import { fetchUlaanbaatarWeather } from '../services/weatherService';
import { generateOutfit, MOCK_BRANDS_CATALOG } from '../services/aiService';
import { useWardrobe } from '../context/WardrobeContext';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList, WeatherData } from '../types';

const { width: W } = Dimensions.get('window');

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

interface Occasion {
  id: string;
  label: string;
  emoji: string;
}

const OCCASIONS: Occasion[] = [
  { id: 'cafe',    label: 'Кафе',               emoji: '☕' },
  { id: 'campus',  label: 'Сургууль',            emoji: '🎓' },
  { id: 'date',    label: 'Дэйт',                emoji: '💜' },
  { id: 'party',   label: 'Найзуудтай уулзалт',  emoji: '🎉' },
  { id: 'mall',    label: 'Дэлгүүр явах',        emoji: '🛍' },
  { id: 'gym',     label: 'Спорт заал',           emoji: '💪' },
  { id: 'outdoor', label: 'Гадаа явах',           emoji: '🏔' },
  { id: 'work',    label: 'Ажил дээр',            emoji: '💼' },
];

const CONDITION_EMOJI: Record<string, string> = {
  'Цэлмэг':       '☀️',
  'Үүлтэй':       '☁️',
  'Цасан шуурга': '❄️',
  'Бороотой':     '🌧',
  'Манантай':     '🌫',
};

const STATIC_STATS = [
  { label: 'Vibe',   value: '97', unit: '%' },
  { label: 'Streak', value: '4',  unit: 'өдөр' },
];

const PREVIEW_LAYERS = [
  { zIndex: 1, emoji: '👖', label: 'Bottom' },
  { zIndex: 2, emoji: '👕', label: 'Base'   },
  { zIndex: 3, emoji: '🥼', label: 'Outer'  },
  { zIndex: 4, emoji: '👟', label: 'Kick'   },
];

interface WeatherTheme {
  canvasBg: string;
  screenBg: string;
  glowColor: string;
  particles: string[];
}

const WEATHER_THEMES: Record<string, WeatherTheme> = {
  Clear:        { canvasBg: '#1A1000', screenBg: '#100C00', glowColor: 'rgba(251,191,36,0.18)',  particles: ['☀️','✨','🌟','✨'] },
  Clouds:       { canvasBg: '#101820', screenBg: '#0A0E14', glowColor: 'rgba(100,130,170,0.16)', particles: ['☁️','🌥','☁️','💨'] },
  Snow:         { canvasBg: '#081424', screenBg: '#050A14', glowColor: 'rgba(96,165,250,0.20)',  particles: ['❄️','🌨','❄️','⛄'] },
  Rain:         { canvasBg: '#06101C', screenBg: '#040A12', glowColor: 'rgba(30,100,200,0.20)',  particles: ['🌧','💧','🌧','💧'] },
  Drizzle:      { canvasBg: '#081018', screenBg: '#050A10', glowColor: 'rgba(60,110,180,0.16)',  particles: ['🌦','💧','💧','🌦'] },
  Mist:         { canvasBg: '#121212', screenBg: '#0A0A0A', glowColor: 'rgba(180,180,180,0.12)', particles: ['🌫','💨','🌫','🌁'] },
  Thunderstorm: { canvasBg: '#0C0818', screenBg: '#080512', glowColor: 'rgba(168,85,247,0.25)',  particles: ['⚡','🌩','⚡','🌪'] },
};
const DEFAULT_WEATHER_THEME: WeatherTheme = { canvasBg: '#1E1E1E', screenBg: '#121212', glowColor: 'rgba(168,85,247,0.08)', particles: [] };

const PARTICLE_POSITIONS = [
  { top: 18,   left: 36  },
  { top: 16,   right: 36 },
  { top: 110,  right: 24 },
  { bottom: 65, left: 28 },
];

export default function HomeScreen({ navigation }: Props) {
  const { wardrobe } = useWardrobe();
  const [weather, setWeather]   = useState<WeatherData | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [showModal, setShowModal]           = useState(false);
  const [generating, setGenerating]         = useState(false);
  const pulseAnim                           = useRef(new Animated.Value(1)).current;
  const weatherGlowAnim                    = useRef(new Animated.Value(0.4)).current;

  useEffect(() => { loadWeather(); }, []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(weatherGlowAnim, { toValue: 1,   duration: 3500, useNativeDriver: true }),
        Animated.timing(weatherGlowAnim, { toValue: 0.3, duration: 3500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!generating) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [generating]);

  async function loadWeather() {
    const res = await fetchUlaanbaatarWeather();
    if (res.success) setWeather(res.data);
  }

  async function handleGenerate() {
    if (!occasion) { setShowModal(true); return; }
    setGenerating(true);
    const res = await generateOutfit({
      weather,
      occasion: occasion.label,
      wardrobe,
      brandsCatalog: MOCK_BRANDS_CATALOG,
    });
    setGenerating(false);
    if (res.success) navigation.navigate('Stylist', { outfitData: res.data });
  }

  const condEmoji    = weather ? (CONDITION_EMOJI[weather.day_condition ?? weather.condition] ?? '🌡') : '🌡';
  const weatherTheme = (weather && WEATHER_THEMES[weather.day_condition_en ?? weather.condition_en]) ?? DEFAULT_WEATHER_THEME;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: weatherTheme.screenBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={weatherTheme.screenBg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.appBar}>
          <View>
            <Text style={styles.appBarSub}>ӨНӨӨДРИЙН</Text>
            <Text style={styles.appBarTitle}>GlowStyle <Text style={styles.appBarAccent}>AI</Text></Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => {}}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {weather ? (
          <View style={styles.weatherPill}>
            <Text style={styles.weatherPillEmoji}>{condEmoji}</Text>
            <Text style={styles.weatherPillCity}>{weather.city}</Text>
            <View style={styles.weatherDivider} />
            {weather.day_temp_max ? (
              <Text style={styles.weatherPillTemp}>
                {weather.day_temp_min}~{weather.day_temp_max}
              </Text>
            ) : (
              <Text style={styles.weatherPillTemp}>{weather.temp}</Text>
            )}
            <Text style={styles.weatherPillCond}>
              {weather.day_condition ?? weather.condition}
            </Text>
            <View style={styles.weatherDivider} />
            <Text style={styles.weatherPillWind}>
              💨 {weather.day_wind_max ?? weather.wind}
            </Text>
          </View>
        ) : (
          <View style={[styles.weatherPill, styles.weatherPillLoading]}>
            <Text style={styles.weatherPillCond}>Уур амьсгал ачааллаж байна...</Text>
          </View>
        )}

        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>ӨНӨӨДРИЙН LOOK</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={[styles.heroCanvas, { backgroundColor: weatherTheme.canvasBg }]}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: weatherTheme.glowColor, opacity: weatherGlowAnim }]}
              pointerEvents="none"
            />
            {weatherTheme.particles.map((emoji, i) => (
              <Text key={i} style={[styles.weatherParticle, PARTICLE_POSITIONS[i] as any]} pointerEvents="none">
                {emoji}
              </Text>
            ))}
            <View style={styles.gridOverlay} />

            <View style={styles.avatarSilhouette}>
              <Text style={styles.avatarHead}>◯</Text>
              <View style={styles.avatarBody}>
                {PREVIEW_LAYERS.map((layer) => (
                  <Text key={layer.label} style={[styles.avatarLayer, { zIndex: layer.zIndex }]}>
                    {layer.emoji}
                  </Text>
                ))}
              </View>
            </View>

            {occasion && (
              <View style={styles.occasionBadgeOnCanvas}>
                <Text style={styles.occasionBadgeEmoji}>{occasion.emoji}</Text>
                <Text style={styles.occasionBadgeLabel}>{occasion.label}</Text>
              </View>
            )}

            <View style={styles.canvasCornerTL} />
            <View style={styles.canvasCornerBR} />
          </View>

          <TouchableOpacity
            style={[styles.occasionRow, occasion && styles.occasionRowActive]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.occasionEmoji}>{occasion ? occasion.emoji : '📍'}</Text>
            <Text style={[styles.occasionText, occasion && styles.occasionTextActive]}>
              {occasion ? occasion.label : 'Vibe Сонгох — Хаа очих вэ?'}
            </Text>
            <Text style={styles.occasionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: spacing.xl }}>
          <CustomButton
            label={generating ? '✦ AI тооцоолж байна...' : '✦ Look Үүсгэх'}
            onPress={handleGenerate}
            variant="primary"
            size="lg"
            loading={generating}
            fullWidth
          />
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wardrobe.length}<Text style={styles.statUnit}>ш</Text></Text>
            <Text style={styles.statLabel}>Хувцас</Text>
          </View>
          {STATIC_STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}<Text style={styles.statUnit}>{s.unit}</Text></Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ХУРДАН ХАНДАЛТ</Text>
        <View style={styles.quickGrid}>
          <QuickTile emoji="👗" label="Хувцас сан" sub={`${wardrobe.length} item`} onPress={() => navigation.navigate('Wardrobe')} />
          <QuickTile emoji="🪞" label="Аватар"     sub="Харах"   onPress={() => navigation.navigate('Avatar')}   />
          <QuickTile emoji="✨" label="Стайлист"   sub="AI look" onPress={() => navigation.navigate('Stylist')}  />
          <QuickTile emoji="📦" label="Нэмэх"      sub="Upload"  onPress={() => {}} accent />
        </View>

        <TodaysTip />

      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Vibe Сонгох</Text>
          <Text style={styles.sheetSub}>Өнөөдөр хаа очих вэ?</Text>
          <FlatList
            data={OCCASIONS}
            keyExtractor={(i) => i.id}
            numColumns={2}
            columnWrapperStyle={styles.modalGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalOption, occasion?.id === item.id && styles.modalOptionActive]}
                onPress={() => { setOccasion(item); setShowModal(false); }}
              >
                <Text style={styles.modalOptionEmoji}>{item.emoji}</Text>
                <Text style={[styles.modalOptionLabel, occasion?.id === item.id && styles.modalOptionLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface QuickTileProps {
  emoji: string;
  label: string;
  sub: string;
  onPress: () => void;
  accent?: boolean;
}

function QuickTile({ emoji, label, sub, onPress, accent }: QuickTileProps) {
  return (
    <TouchableOpacity
      style={[styles.quickTile, accent && styles.quickTileAccent]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.quickTileEmoji}>{emoji}</Text>
      <Text style={[styles.quickTileLabel, accent && { color: colors.accent }]}>{label}</Text>
      <Text style={styles.quickTileSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 140 },

  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appBarSub:    { ...typography.label, color: colors.textMuted },
  appBarTitle:  { ...typography.h1,   color: colors.text },
  appBarAccent: { color: colors.accent },
  bellBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: { fontSize: 20 },
  bellDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 2, borderColor: colors.background,
  },

  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  weatherPillLoading: { justifyContent: 'center' },
  weatherPillEmoji:   { fontSize: 18 },
  weatherPillCity:    { ...typography.h4,    color: colors.text },
  weatherDivider:     { width: 1, height: 14, backgroundColor: colors.border },
  weatherPillTemp:    { ...typography.h3,    color: colors.accent, fontWeight: '800' },
  weatherPillCond:    { ...typography.caption, color: colors.textMuted },
  weatherPillWind:    { ...typography.caption, color: colors.textMuted, marginLeft: 'auto' },

  heroSection:  { marginBottom: spacing.lg },
  heroHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  heroLabel:    { ...typography.label, color: colors.textMuted },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.accent,
    gap: 5,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  liveText: { ...typography.label, color: colors.accent, fontSize: 9 },

  heroCanvas: {
    height: 300,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    borderWidth: 1, borderColor: '#FFFFFF',
  },
  weatherParticle: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.30,
  },
  avatarSilhouette: { alignItems: 'center' },
  avatarHead:   { fontSize: 40, color: colors.text, opacity: 0.15, marginBottom: -8 },
  avatarBody:   {
    width: 120,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLayer: {
    position: 'absolute',
    fontSize: 72,
  },
  occasionBadgeOnCanvas: {
    position: 'absolute',
    bottom: spacing.md, left: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.accent,
    gap: spacing.xs,
  },
  occasionBadgeEmoji: { fontSize: 14 },
  occasionBadgeLabel: { ...typography.label, color: colors.accent, fontSize: 9 },
  canvasCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 22, height: 22,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: colors.accent,
    borderTopLeftRadius: borderRadius.lg,
  },
  canvasCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: colors.accent,
    borderBottomRightRadius: borderRadius.lg,
  },

  occasionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  occasionRowActive: { borderColor: colors.accent },
  occasionEmoji: { fontSize: 18 },
  occasionText: { ...typography.h4, color: colors.textMuted, flex: 1 },
  occasionTextActive: { color: colors.text },
  occasionChevron: { color: colors.textMuted, fontSize: 22 },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  statValue: { ...typography.h2, color: colors.text, fontWeight: '800' },
  statUnit:  { ...typography.caption, color: colors.textMuted },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  sectionTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickTile: {
    width: (W - spacing.md * 2 - spacing.sm) / 2 - 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  quickTileAccent: {
    borderColor: colors.accent,
    backgroundColor: colors.accentAlpha,
  },
  quickTileEmoji: { fontSize: 26, marginBottom: spacing.xs },
  quickTileLabel: { ...typography.h4, color: colors.text },
  quickTileSub:   { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1, borderColor: colors.border,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetTitle:  { ...typography.h2,   color: colors.text,    marginBottom: spacing.xs },
  sheetSub:    { ...typography.body,  color: colors.textMuted, marginBottom: spacing.md },
  modalGrid:   { gap: spacing.sm, marginBottom: spacing.sm },
  modalOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  modalOptionActive:      { borderColor: colors.accent, backgroundColor: colors.accentAlpha },
  modalOptionEmoji:       { fontSize: 28, marginBottom: spacing.xs },
  modalOptionLabel:       { ...typography.h4, color: colors.text, textAlign: 'center' },
  modalOptionLabelActive: { color: colors.accent },
});
