import React, { useState, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  SafeAreaView, StatusBar, TouchableOpacity, Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import { MOCK_WARDROBE } from '../services/aiService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AVATAR_W = SCREEN_W * 0.55;
const AVATAR_H = SCREEN_H * 0.48;

const LAYER_Z_INDEX = {
  'Base Avatar': 0,
  Bottom:        1,
  'Base Layer':  2,
  'Mid Layer':   3,
  Outerwear:     4,
  Footwear:      5,
  Accessory:     6,
};

const LAYER_COLORS = {
  Bottom:        '#F472B6',
  'Base Layer':  '#60A5FA',
  'Mid Layer':   '#FB923C',
  Outerwear:     '#34D399',
  Footwear:      '#FBBF24',
  Accessory:     '#A78BFA',
};

const BASE_AVATAR_URI = 'https://via.placeholder.com/400x700/121212/FFFFFF?text=%F0%9F%91%A4';

const ITEM_EMOJIS = {
  'T-Shirt': '👕', 'Hoodie': '🧥', 'Puffer Jacket': '🥼',
  'Cargo Pants': '👖', 'Snow Boots': '🥾', 'Beanie': '🧢',
  'Denim Jacket': '🧥', 'Jogger Pants': '👖', 'Sneakers': '👟', 'Turtleneck': '👕',
};

export default function AvatarScreen({ route }) {
  const preSelected = route?.params?.selectedIds ?? [];
  const [activeItems, setActiveItems] = useState(preSelected.length > 0 ? preSelected : []);
  const [activeTab, setActiveTab]     = useState('Tops');

  const TABS = ['Tops', 'Jackets', 'Bottoms', 'Footwear', 'Accessories'];

  const filteredWardrobe = useMemo(
    () => MOCK_WARDROBE.filter((i) => i.category === activeTab),
    [activeTab]
  );

  const activeLayers = useMemo(() => {
    const items = MOCK_WARDROBE.filter((i) => activeItems.includes(i.id));
    return items.sort((a, b) => (LAYER_Z_INDEX[a.layer] ?? 0) - (LAYER_Z_INDEX[b.layer] ?? 0));
  }, [activeItems]);

  function toggleItem(item) {
    setActiveItems((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      // Evict existing item in same layer slot
      const sameLayer = MOCK_WARDROBE.find((w) => prev.includes(w.id) && w.layer === item.layer);
      const next = sameLayer ? prev.filter((id) => id !== sameLayer.id) : [...prev];
      return [...next, item.id];
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>МИНИЙ</Text>
          <Text style={styles.headerTitle}>Аватар</Text>
        </View>
        {activeItems.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setActiveItems([])}>
            <Text style={styles.clearBtnText}>Цэвэрлэх</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Avatar Canvas ── */}
      <View style={styles.canvasWrap}>
        <View style={[styles.canvas, { width: AVATAR_W, height: AVATAR_H }]}>
          {/* Corner accent marks */}
          <View style={styles.cornerTL} />
          <View style={styles.cornerBR} />

          {/* zIndex 0: Base avatar */}
          <Image
            source={{ uri: BASE_AVATAR_URI }}
            style={[styles.layerImage, { zIndex: LAYER_Z_INDEX['Base Avatar'] }]}
            resizeMode="contain"
          />

          {/* zIndex 1–6: Outfit layers */}
          {activeLayers.map((item) => (
            <Image
              key={item.id}
              source={{ uri: item.image_url }}
              style={[styles.layerImage, { zIndex: LAYER_Z_INDEX[item.layer] ?? 1 }]}
              resizeMode="contain"
            />
          ))}
        </View>

        {/* Layer count pill */}
        <View style={styles.layerCountPill}>
          <Text style={styles.layerCountText}>{activeLayers.length} давхар</Text>
        </View>
      </View>

      {/* ── Wardrobe Picker ── */}
      <View style={styles.pickerWrap}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsContainer}
        >
          {filteredWardrobe.map((item) => {
            const isActive = activeItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                onPress={() => toggleItem(item)}
                activeOpacity={0.75}
              >
                <View style={styles.pickerArt}>
                  <Text style={styles.pickerEmoji}>{ITEM_EMOJIS[item.type] ?? '🧺'}</Text>
                  {isActive && (
                    <View style={styles.activeOverlay}>
                      <Text style={styles.activeCheck}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.pickerLabel, isActive && styles.pickerLabelActive]} numberOfLines={1}>
                  {item.type}
                </Text>
              </TouchableOpacity>
            );
          })}

          {filteredWardrobe.length === 0 && (
            <View style={styles.emptyPicker}>
              <Text style={styles.emptyText}>Хувцас байхгүй</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Layer Sequence Guide ── */}
      <View style={styles.layerGuide}>
        <Text style={styles.layerGuideTitle}>ДАВХАРШИЛТЫН ДАРААЛАЛ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(LAYER_Z_INDEX)
            .filter(([key]) => key !== 'Base Avatar')
            .sort((a, b) => a[1] - b[1])
            .map(([layer, z]) => {
              const isActive = !!activeLayers.find((i) => i.layer === layer);
              const dotColor = LAYER_COLORS[layer] ?? colors.textMuted;
              return (
                <View key={layer} style={[styles.guideChip, isActive && { borderColor: dotColor }]}>
                  <View style={[styles.guideDot, { backgroundColor: isActive ? dotColor : colors.textMuted }]}>
                    <Text style={styles.guideZ}>{z}</Text>
                  </View>
                  <Text style={[styles.guideLabel, isActive && { color: dotColor }]}>
                    {layer}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerSub:   { ...typography.label, color: colors.textMuted },
  headerTitle: { ...typography.h1,   color: colors.text },
  clearBtn: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.error,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  clearBtnText: { ...typography.caption, color: colors.error, fontWeight: '700' },

  // Canvas
  canvasWrap: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
    position: 'relative',
  },
  canvas: { position: 'relative' },
  layerImage: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%', resizeMode: 'contain',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0, zIndex: 99,
    width: 18, height: 18,
    borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.accent,
    borderTopLeftRadius: borderRadius.md,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0, zIndex: 99,
    width: 18, height: 18,
    borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.accent,
    borderBottomRightRadius: borderRadius.md,
  },
  layerCountPill: {
    position: 'absolute', top: spacing.md + 4, right: spacing.md + 4,
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.accent,
  },
  layerCountText: { ...typography.label, color: colors.accent, fontSize: 9 },

  // Picker
  pickerWrap: {
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabsContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  tab: {
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText:       { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.black, fontWeight: '800' },

  itemsContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  pickerItem: {
    width: 76, borderRadius: borderRadius.md, overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickerItemActive: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  pickerArt: {
    width: 76, height: 86,
    backgroundColor: '#121212',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  pickerEmoji: { fontSize: 38 },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168,85,247,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeCheck:      { fontSize: 26, fontWeight: '900', color: '#fff' },
  pickerLabel:      { ...typography.caption, color: colors.text, textAlign: 'center', padding: 5 },
  pickerLabelActive:{ color: colors.accent, fontWeight: '700' },
  emptyPicker:      { alignItems: 'center', justifyContent: 'center', width: 200 },
  emptyText:        { ...typography.body, color: colors.textMuted },

  // Layer guide
  layerGuide: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  layerGuideTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  guideChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderWidth: 1.5, borderColor: colors.border,
    gap: 5,
  },
  guideDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  guideZ:     { fontSize: 9, fontWeight: '900', color: colors.black },
  guideLabel: { ...typography.caption, color: colors.textMuted },
});
