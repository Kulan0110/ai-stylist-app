import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, Animated, Modal, FlatList,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import { fetchUlaanbaatarWeather } from '../services/weatherService';
import { generateOutfit, MOCK_WARDROBE, MOCK_BRANDS_CATALOG } from '../services/aiService';

const { width: W } = Dimensions.get('window');

const OCCASIONS = [
  { id: 'cafe',    label: 'Кафе',               emoji: '☕' },
  { id: 'campus',  label: 'Сургууль',            emoji: '🎓' },
  { id: 'date',    label: 'Дэйт',                emoji: '💜' },
  { id: 'party',   label: 'Найзуудтай уулзалт',  emoji: '🎉' },
  { id: 'mall',    label: 'Молл явах',            emoji: '🛍' },
  { id: 'gym',     label: 'Спорт заал',           emoji: '💪' },
  { id: 'outdoor', label: 'Гадаа тэнэх',         emoji: '🏔' },
  { id: 'work',    label: 'Ажил дээр',            emoji: '💼' },
];

const CONDITION_EMOJI = {
  'Цэлмэг':       '☀️',
  'Үүлтэй':       '☁️',
  'Цасан шуурга': '❄️',
  'Бороотой':     '🌧',
  'Манантай':     '🌫',
};

const STATS = [
  { label: 'Хувцас',   value: '10', unit: 'ш' },
  { label: 'Vibe',     value: '97', unit: '%' },
  { label: 'Streak',   value: '4',  unit: 'өдөр' },
];

// Mini avatar preview layers for the home canvas
const PREVIEW_LAYERS = [
  { zIndex: 1, emoji: '👖', label: 'Bottom' },
  { zIndex: 2, emoji: '👕', label: 'Base'   },
  { zIndex: 3, emoji: '🥼', label: 'Outer'  },
  { zIndex: 4, emoji: '👟', label: 'Kick'   },
];

export default function HomeScreen({ navigation }) {
  const [weather, setWeather]               = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [occasion, setOccasion]             = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [generating, setGenerating]         = useState(false);
  const pulseAnim                           = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadWeather(); }, []);
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
    setWeatherLoading(true);
    const res = await fetchUlaanbaatarWeather();
    if (res.success) setWeather(res.data);
    setWeatherLoading(false);
  }

  async function handleGenerate() {
    if (!occasion) { setShowModal(true); return; }
    setGenerating(true);
    const res = await generateOutfit({
      weather,
      occasion: occasion.label,
      wardrobe: MOCK_WARDROBE,
      brandsCatalog: MOCK_BRANDS_CATALOG,
    });
    setGenerating(false);
    if (res.success) navigation.navigate('Stylist', { outfitData: res.data });
  }

  const condEmoji = weather ? (CONDITION_EMOJI[weather.condition] ?? '🌡') : '🌡';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── App Bar ─── */}
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

        {/* ─── Weather Pill ─── */}
        {weather ? (
          <View style={styles.weatherPill}>
            <Text style={styles.weatherPillEmoji}>{condEmoji}</Text>
            <Text style={styles.weatherPillCity}>{weather.city}</Text>
            <View style={styles.weatherDivider} />
            <Text style={styles.weatherPillTemp}>{weather.temp}</Text>
            <Text style={styles.weatherPillCond}>{weather.condition}</Text>
            <View style={styles.weatherDivider} />
            <Text style={styles.weatherPillWind}>💨 {weather.wind}</Text>
          </View>
        ) : (
          <View style={[styles.weatherPill, styles.weatherPillLoading]}>
            <Text style={styles.weatherPillLoading}>Уур амьсгал ачааллаж байна...</Text>
          </View>
        )}

        {/* ─── Hero Canvas ─── */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>ӨНӨӨДРИЙН LOOK</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.heroCanvas}>
            {/* Background grid texture */}
            <View style={styles.gridOverlay} />

            {/* Silhouette avatar */}
            <View style={styles.avatarSilhouette}>
              <Text style={styles.avatarHead}>◯</Text>
              <View style={styles.avatarBody}>
                {/* Layered clothing glyphs absolute positioned */}
                {PREVIEW_LAYERS.map((layer) => (
                  <Text key={layer.label} style={[styles.avatarLayer, { zIndex: layer.zIndex }]}>
                    {layer.emoji}
                  </Text>
                ))}
              </View>
            </View>

            {/* Occasion badge */}
            {occasion && (
              <View style={styles.occasionBadgeOnCanvas}>
                <Text style={styles.occasionBadgeEmoji}>{occasion.emoji}</Text>
                <Text style={styles.occasionBadgeLabel}>{occasion.label}</Text>
              </View>
            )}

            {/* Corner accent */}
            <View style={styles.canvasCornerTL} />
            <View style={styles.canvasCornerBR} />
          </View>

          {/* Occasion selector below canvas */}
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

        {/* ─── Generate CTA ─── */}
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

        {/* ─── Quick Stats ─── */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}<Text style={styles.statUnit}>{s.unit}</Text></Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Quick Nav ─── */}
        <Text style={styles.sectionTitle}>ХУРДАН ХАНДАЛТ</Text>
        <View style={styles.quickGrid}>
          <QuickTile emoji="👗" label="Хувцас сан" sub="10 item" onPress={() => navigation.navigate('Wardrobe')} />
          <QuickTile emoji="🪞" label="Аватар"     sub="Харах"   onPress={() => navigation.navigate('Avatar')}   />
          <QuickTile emoji="✨" label="Стайлист"   sub="AI look" onPress={() => navigation.navigate('Stylist')}  />
          <QuickTile emoji="📦" label="Нэмэх"      sub="Upload"  onPress={() => {}} accent />
        </View>

        {/* ─── Tip Card ─── */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Өнөөдрийн зөвлөгөө</Text>
          </View>
          <Text style={styles.tipText}>
            УБ-ийн -4°С хүйтэнд <Text style={styles.tipAccent}>Base → Mid → Outer</Text> гурван давхар
            layering тактик ашиглаарай — Vibe-аа алдахгүй дулаахан байх хамгийн күүл арга. Гал харагдана 🔥
          </Text>
        </View>

      </ScrollView>

      {/* ─── Occasion Modal ─── */}
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

function QuickTile({ emoji, label, sub, onPress, accent }) {
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
  scroll: { padding: spacing.md, paddingBottom: 100 },

  // App Bar
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

  // Weather
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

  // Hero
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
    // Simulated grid via repeated border
    borderWidth: 1, borderColor: '#FFFFFF',
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

  // Occasion row
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

  // Stats
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

  // Quick Nav
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

  // Tip
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tipIcon:   { fontSize: 18 },
  tipTitle:  { ...typography.h4, color: colors.text },
  tipText:   { ...typography.body, color: colors.textOff, lineHeight: 22 },
  tipAccent: { color: colors.accent, fontWeight: '700' },

  // Modal
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
