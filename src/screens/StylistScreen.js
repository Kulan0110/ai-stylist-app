import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, Share, Dimensions, Animated,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import OutfitCard from '../components/OutfitCard';
import CustomButton from '../components/CustomButton';

const { width: W, height: H } = Dimensions.get('window');
const CANVAS_W = W * 0.50;
const CANVAS_H = H * 0.46;

// Absolute layering z-index map
const LAYER_Z = {
  'Base Avatar': 0,
  Bottom:        1,
  'Base Layer':  2,
  'Mid Layer':   3,
  Outerwear:     4,
  Footwear:      5,
  Accessory:     6,
};

const LAYER_META = [
  { layer: 'Bottom',     z: 1, color: '#F472B6', icon: '👖' },
  { layer: 'Base Layer', z: 2, color: '#60A5FA', icon: '👕' },
  { layer: 'Mid Layer',  z: 3, color: '#FB923C', icon: '🧥' },
  { layer: 'Outerwear',  z: 4, color: '#34D399', icon: '🥼' },
  { layer: 'Footwear',   z: 5, color: '#FBBF24', icon: '👟' },
  { layer: 'Accessory',  z: 6, color: '#A78BFA', icon: '🧢' },
];

const BASE_AVATAR_URI = 'https://via.placeholder.com/400x700/121212/FFFFFF?text=%F0%9F%91%A4';

export default function StylistScreen({ route, navigation }) {
  const outfitData = route?.params?.outfitData ?? null;
  const [saved, setSaved]           = useState(false);
  const [activeLayerIdx, setActive] = useState(null);
  const fadeAnim                    = useRef(new Animated.Value(0)).current;

  const sortedLayers = useMemo(() => {
    if (!outfitData?.selected_items) return [];
    return [...outfitData.selected_items].sort(
      (a, b) => (LAYER_Z[a.layer] ?? 0) - (LAYER_Z[b.layer] ?? 0)
    );
  }, [outfitData]);

  useMemo(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [outfitData]);

  async function handleShare() {
    if (!outfitData) return;
    await Share.share({ message: `GlowStyle AI ✦ ${outfitData.outfit_title}\n\n${outfitData.stylist_comment}` });
  }

  function getLayerMeta(layerName) {
    return LAYER_META.find((l) => l.layer === layerName) ?? { color: colors.accent, icon: '●', z: 0 };
  }

  // Empty state
  if (!outfitData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyEmoji}>🤖</Text>
          </View>
          <Text style={styles.emptyTitle}>Look байхгүй байна</Text>
          <Text style={styles.emptyText}>
            Нүүр хуудаснаас Vibe сонгоод AI-г ажиллуулаарай.{'\n'}
            Гал харагдана 🔥
          </Text>
          <CustomButton
            label="← Нүүр хуудас руу"
            onPress={() => navigation.navigate('Home')}
            variant="ghost"
            size="md"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topSub}>AI СТАЙЛИСТ</Text>
            <Text style={styles.topTitle}>Өнөөдрийн Look</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── Main split: Canvas + Layer Stack ── */}
        <Animated.View style={[styles.mainSplit, { opacity: fadeAnim }]}>

          {/* Left: Avatar Canvas */}
          <View style={[styles.canvas, { width: CANVAS_W, height: CANVAS_H }]}>
            {/* Corner marks */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerBR} />

            {/* zIndex 0 — Base avatar */}
            <Image
              source={{ uri: BASE_AVATAR_URI }}
              style={[styles.layerImg, { zIndex: LAYER_Z['Base Avatar'] }]}
              resizeMode="contain"
            />

            {/* zIndex 1–6 — Outfit layers in order */}
            {sortedLayers.map((item) => (
              <Image
                key={item.item_id}
                source={{ uri: item.image_url }}
                style={[styles.layerImg, { zIndex: LAYER_Z[item.layer] ?? 1 }]}
                resizeMode="contain"
              />
            ))}

            {/* Outfit title at bottom of canvas */}
            <View style={styles.canvasTitle}>
              <Text style={styles.canvasTitleText} numberOfLines={1}>
                {outfitData.outfit_title}
              </Text>
            </View>
          </View>

          {/* Right: Layer stack */}
          <View style={styles.layerStack}>
            <Text style={styles.stackHeader}>ДАВХАР</Text>

            {LAYER_META.map((meta, idx) => {
              const matched = sortedLayers.find((s) => s.layer === meta.layer);
              const isActive = matched != null;
              const isFocused = activeLayerIdx === idx;

              return (
                <TouchableOpacity
                  key={meta.layer}
                  style={[
                    styles.stackItem,
                    isActive && styles.stackItemActive,
                    isFocused && styles.stackItemFocused,
                  ]}
                  onPress={() => setActive(isFocused ? null : idx)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stackZBadge, { borderColor: meta.color }]}>
                    <Text style={[styles.stackZ, { color: meta.color }]}>{meta.z}</Text>
                  </View>
                  <View style={styles.stackBody}>
                    <Text style={styles.stackEmoji}>{meta.icon}</Text>
                    {isActive && (
                      <View style={[styles.stackActiveDot, { backgroundColor: meta.color }]} />
                    )}
                  </View>
                  {isFocused && isActive && (
                    <Text style={styles.stackLayerName} numberOfLines={1}>
                      {meta.layer}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Active layer detail ── */}
        {activeLayerIdx !== null && (() => {
          const meta    = LAYER_META[activeLayerIdx];
          const matched = sortedLayers.find((s) => s.layer === meta.layer);
          if (!matched) return null;
          return (
            <View style={[styles.layerDetail, { borderColor: meta.color }]}>
              <View style={styles.layerDetailHeader}>
                <Text style={styles.layerDetailEmoji}>{meta.icon}</Text>
                <View>
                  <Text style={[styles.layerDetailName, { color: meta.color }]}>{meta.layer}</Text>
                  <Text style={styles.layerDetailId}>ID: {matched.item_id}</Text>
                </View>
              </View>
              <Text style={styles.layerDetailReason}>{matched.reason_mn}</Text>
            </View>
          );
        })()}

        {/* ── AI Outfit Card ── */}
        <OutfitCard outfitData={outfitData} />

        {/* ── Vibe Score ── */}
        <View style={styles.vibeRow}>
          <VibeBar label="Тохирол"   value={96} color="#A855F7" />
          <VibeBar label="Дулаан"    value={88} color="#60A5FA" />
          <VibeBar label="Стайл"     value={100} color="#34D399" />
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actions}>
          <CustomButton
            label={saved ? '✓ Хадгалагдсан' : '🔖 Хадгалах'}
            onPress={() => setSaved(true)}
            variant={saved ? 'dark' : 'ghost'}
            size="md"
            disabled={saved}
            style={styles.actionBtn}
          />
          <CustomButton
            label="✦ Шинэ Look"
            onPress={() => navigation.navigate('Home')}
            variant="primary"
            size="md"
            style={styles.actionBtn}
          />
        </View>

        {/* ── Гал харагдана banner ── */}
        <View style={styles.fireBanner}>
          <Text style={styles.fireBannerText}>🔥  Гал харагдана — Төгс зохионо  🔥</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function VibeBar({ label, value, color }) {
  return (
    <View style={styles.vibeItem}>
      <View style={styles.vibeBarTrack}>
        <View style={[styles.vibeBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.vibeBarFooter}>
        <Text style={styles.vibeLabel}>{label}</Text>
        <Text style={[styles.vibeValue, { color }]}>{value}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:  { color: colors.text, fontSize: 20, fontWeight: '700' },
  topCenter: { alignItems: 'center' },
  topSub:    { ...typography.label, color: colors.textMuted },
  topTitle:  { ...typography.h3,   color: colors.text },
  shareBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accentAlpha,
    borderWidth: 1.5, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { color: colors.accent, fontSize: 18, fontWeight: '800' },

  // Main split
  mainSplit: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  // Canvas
  canvas: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0, zIndex: 99,
    width: 20, height: 20,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: colors.accent,
    borderTopLeftRadius: borderRadius.lg,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0, zIndex: 99,
    width: 20, height: 20,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: colors.accent,
    borderBottomRightRadius: borderRadius.lg,
  },
  layerImg: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
  },
  canvasTitle: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 98,
    backgroundColor: 'rgba(18,18,18,0.82)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  canvasTitleText: {
    ...typography.label,
    color: colors.accent,
    textAlign: 'center',
  },

  // Layer stack (right column)
  layerStack: {
    flex: 1,
    gap: spacing.sm,
  },
  stackHeader: { ...typography.label, color: colors.textMuted, marginBottom: spacing.xs },
  stackItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    opacity: 0.45,
  },
  stackItemActive:  { opacity: 1 },
  stackItemFocused: { borderColor: colors.accent, backgroundColor: colors.accentAlpha },
  stackZBadge: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  stackZ:         { fontSize: 10, fontWeight: '900' },
  stackBody:      { position: 'relative', alignItems: 'center' },
  stackEmoji:     { fontSize: 22 },
  stackActiveDot: {
    position: 'absolute', bottom: -2, right: -6,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.background,
  },
  stackLayerName: { ...typography.caption, color: colors.accent, textAlign: 'center', fontSize: 9 },

  // Layer detail
  layerDetail: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  layerDetailHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  layerDetailEmoji:  { fontSize: 28 },
  layerDetailName:   { ...typography.h4, fontWeight: '700' },
  layerDetailId:     { ...typography.caption, color: colors.textMuted },
  layerDetailReason: { ...typography.body, color: colors.textOff, lineHeight: 21 },

  // Vibe bars
  vibeRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vibeItem:      { gap: spacing.xs },
  vibeBarTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  vibeBarFill:   { height: '100%', borderRadius: 3 },
  vibeBarFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  vibeLabel:     { ...typography.caption, color: colors.textMuted },
  vibeValue:     { ...typography.caption, fontWeight: '800' },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: { flex: 1 },

  // Fire banner
  fireBanner: {
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.accent,
    padding: spacing.md,
    alignItems: 'center',
  },
  fireBannerText: {
    ...typography.h4,
    color: colors.accent,
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyEmoji:  { fontSize: 44 },
  emptyTitle:  { ...typography.h2, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  emptyText:   { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
