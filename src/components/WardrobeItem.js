import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../utils/theme';

// Duo-tone art mapping — white graphic on #121212 canvas
const ITEM_ART = {
  'T-Shirt':       { glyph: '👕', mnName: 'Цамц' },
  'Hoodie':        { glyph: '🧥', mnName: 'Хүүди' },
  'Puffer Jacket': { glyph: '🥼', mnName: 'Пуффер' },
  'Cargo Pants':   { glyph: '👖', mnName: 'Карго' },
  'Snow Boots':    { glyph: '🥾', mnName: 'Цасны гутал' },
  'Beanie':        { glyph: '🧢', mnName: 'Малгай' },
  'Denim Jacket':  { glyph: '🧥', mnName: 'Жинсэн хантаз' },
  'Jogger Pants':  { glyph: '👖', mnName: 'Жоггер' },
  'Sneakers':      { glyph: '👟', mnName: 'Снийкэр' },
  'Turtleneck':    { glyph: '👕', mnName: 'Боодол' },
};

const LAYER_ACCENT = {
  'Base Layer': '#60A5FA',
  'Mid Layer':  '#FB923C',
  Outerwear:    '#34D399',
  Bottom:       '#F472B6',
  Footwear:     '#FBBF24',
  Accessory:    '#A78BFA',
};

export default function WardrobeItem({ item, onPress, selected = false }) {
  const art = ITEM_ART[item.type] ?? { glyph: '🧺', mnName: item.type };
  const layerColor = LAYER_ACCENT[item.layer] ?? colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.75}
    >
      {/* Duo-tone Art Panel */}
      <View style={styles.artPanel}>
        {/* Radial glow behind glyph when selected */}
        {selected && <View style={styles.glowCircle} />}

        <Text style={styles.glyph}>{art.glyph}</Text>

        {/* Layer dot — top right */}
        <View style={[styles.layerDot, { backgroundColor: layerColor }]} />

        {/* Selected checkmark */}
        {selected && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.meta}>
        <Text style={[styles.mnName, selected && styles.mnNameActive]} numberOfLines={1}>
          {art.mnName}
        </Text>
        <View style={styles.row}>
          <View style={[styles.colorChip, { backgroundColor: _colorHex(item.color) }]} />
          <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function _colorHex(name) {
  const map = {
    White: '#F5F5F5', Black: '#303030', Olive: '#556B2F',
    Khaki: '#C3B091', Grey: '#757575', Cream: '#FAF0DC',
    Indigo: '#3949AB', Charcoal: '#455A64', 'White/Purple': '#A855F7',
  };
  return map[name] ?? '#555555';
}

const styles = StyleSheet.create({
  container: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  containerSelected: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },

  // Duo-tone art panel
  artPanel: {
    height: 140,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  glowCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentGlow,
  },
  glyph: {
    fontSize: 58,
    // Force white/mono appearance on dark bg
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  layerDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.black, fontSize: 12, fontWeight: '900' },

  // Metadata
  meta: {
    padding: spacing.sm + 2,
  },
  mnName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mnNameActive: { color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center' },
  colorChip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: { ...typography.caption, color: colors.textMuted },
});
