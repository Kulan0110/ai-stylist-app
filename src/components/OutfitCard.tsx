import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import type { OutfitData, OutfitItem } from '../types';

interface Props {
  outfitData: OutfitData | null;
}

export default function OutfitCard({ outfitData }: Props) {
  const [upsellOpen, setUpsellOpen] = useState(false);
  if (!outfitData) return null;

  const { outfit_title, selected_items, stylist_comment, upsell_product } = outfitData;

  return (
    <View style={styles.card}>

      {/* ── Card header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.aiBadge}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.aiBadgeText}>AI STYLED</Text>
        </View>
        <View style={styles.glowLine} />
      </View>

      {/* ── Outfit title ── */}
      <Text style={styles.outfitTitle}>{outfit_title}</Text>

      {/* ── Stylist comment ── */}
      <View style={styles.commentBlock}>
        <Text style={styles.commentQuote}>"</Text>
        <Text style={styles.commentText}>{stylist_comment}</Text>
      </View>

      {/* ── Item chips ── */}
      <Text style={styles.sectionLabel}>СОНГОСОН ХУВЦАС</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {selected_items.map((item, idx) => (
          <LayerChip key={item.item_id} item={item} index={idx} />
        ))}
      </ScrollView>

      {/* ── Upsell card ── */}
      {upsell_product && (
        <TouchableOpacity
          style={[styles.upsell, upsellOpen && styles.upsellOpen]}
          onPress={() => setUpsellOpen(!upsellOpen)}
          activeOpacity={0.85}
        >
          <View style={styles.upsellTop}>
            <View style={styles.sponsorPill}>
              <Text style={styles.sponsorText}>✦ SPONSOR</Text>
            </View>
            <Text style={styles.upsellBrand}>{upsell_product.brand_name}</Text>
            <Text style={styles.upsellToggle}>{upsellOpen ? '▲' : '▼'}</Text>
          </View>

          <Text style={styles.upsellName}>{upsell_product.product_name}</Text>

          {upsellOpen && (
            <View style={styles.upsellBody}>
              <Text style={styles.upsellReason}>{upsell_product.recommendation_reason_mn}</Text>
              <TouchableOpacity
                style={styles.shopCTA}
                onPress={() => Linking.openURL(upsell_product.product_url)}
              >
                <Text style={styles.shopCTAText}>Одоо авах  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

interface LayerChipProps {
  item: OutfitItem;
  index: number;
}

function LayerChip({ item, index }: LayerChipProps) {
  const Z_COLORS = ['#60A5FA','#FB923C','#34D399','#F472B6','#FBBF24','#A78BFA'];
  const dot = Z_COLORS[index % Z_COLORS.length];

  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: dot }]} />
      <View>
        <Text style={styles.chipLayer}>{item.layer}</Text>
        <Text style={styles.chipReason} numberOfLines={2}>{item.reason_mn}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentAlpha,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    marginRight: spacing.sm,
  } as any,
  aiIcon: { fontSize: 14 },
  aiBadgeText: { ...typography.label, color: colors.accent },
  glowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // Title
  outfitTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Comment
  commentBlock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
  },
  commentQuote: {
    fontSize: 36,
    color: colors.accent,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: -8,
  },
  commentText: {
    ...typography.body,
    color: colors.textOff,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Chips
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  } as any,
  chip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    width: 180,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  } as any,
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  chipLayer: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 3,
  },
  chipReason: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 16,
  },

  // Upsell
  upsell: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentAlpha,
    padding: spacing.md,
  },
  upsellOpen: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  upsellTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  } as any,
  sponsorPill: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sponsorText: { ...typography.label, color: colors.black, fontSize: 9 },
  upsellBrand: { ...typography.h4, color: colors.accent, flex: 1 },
  upsellToggle: { color: colors.textMuted, fontSize: 11 },
  upsellName: { ...typography.h4, color: colors.text },
  upsellBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  upsellReason: {
    ...typography.body,
    color: colors.textOff,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  shopCTA: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  shopCTAText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
