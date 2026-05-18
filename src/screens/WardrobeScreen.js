import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, ScrollView, TextInput, Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import WardrobeItem from '../components/WardrobeItem';
import CustomButton from '../components/CustomButton';
import { MOCK_WARDROBE } from '../services/aiService';

const { width: W } = Dimensions.get('window');

const FILTER_TABS = [
  { key: 'all',       label: 'Бүгд',     emoji: '◈' },
  { key: 'Tops',      label: 'Цамц',     emoji: '👕' },
  { key: 'Jackets',   label: 'Хантаз',   emoji: '🥼' },
  { key: 'Bottoms',   label: 'Өмд',      emoji: '👖' },
  { key: 'Footwear',  label: 'Гутал',    emoji: '👟' },
  { key: 'Accessories', label: 'Дагалдах', emoji: '🧢' },
];

const LAYER_LEGEND = [
  { layer: 'Base Layer', color: '#60A5FA', short: 'B' },
  { layer: 'Mid Layer',  color: '#FB923C', short: 'M' },
  { layer: 'Outerwear',  color: '#34D399', short: 'O' },
  { layer: 'Bottom',     color: '#F472B6', short: 'P' },
  { layer: 'Footwear',   color: '#FBBF24', short: 'F' },
  { layer: 'Accessory',  color: '#A78BFA', short: 'A' },
];

export default function WardrobeScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery]               = useState('');
  const [selectedIds, setSelectedIds]   = useState([]);
  const [viewMode, setViewMode]         = useState('grid'); // 'grid' | 'list'

  const filtered = useMemo(() => {
    let items = activeFilter === 'all'
      ? MOCK_WARDROBE
      : MOCK_WARDROBE.filter((i) => i.category === activeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) => i.type.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeFilter, query]);

  const categoryCounts = useMemo(() => {
    const acc = { all: MOCK_WARDROBE.length };
    FILTER_TABS.slice(1).forEach((t) => {
      acc[t.key] = MOCK_WARDROBE.filter((i) => i.category === t.key).length;
    });
    return acc;
  }, []);

  function toggleSelect(item) {
    setSelectedIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  }

  function clearSelection() { setSelectedIds([]); }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>МИНИЙ</Text>
          <Text style={styles.headerTitle}>Хувцас Сан</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Text style={styles.viewToggleText}>{viewMode === 'grid' ? '⊞' : '☰'}</Text>
          </TouchableOpacity>
          <CustomButton label="+ Нэмэх" onPress={() => {}} variant="primary" size="sm" />
        </View>
      </View>

      {/* ── Item count bar ── */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          <Text style={styles.countNum}>{filtered.length}</Text> хувцас
          {activeFilter !== 'all' && ` · ${FILTER_TABS.find((t) => t.key === activeFilter)?.label}`}
        </Text>
        {selectedIds.length > 0 && (
          <Text style={styles.selectedCount}>{selectedIds.length} сонгогдсон</Text>
        )}
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Хувцас хайх..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Layer Legend ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendRow}
      >
        {LAYER_LEGEND.map((l) => (
          <View key={l.layer} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]}>
              <Text style={styles.legendShort}>{l.short}</Text>
            </View>
            <Text style={styles.legendLabel}>{l.layer.replace(' Layer', '')}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Filter Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                  {categoryCounts[tab.key] ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Wardrobe Grid ── */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          viewMode === 'grid'
            ? <WardrobeItem item={item} onPress={toggleSelect} selected={selectedIds.includes(item.id)} />
            : <ListRow item={item} onPress={toggleSelect} selected={selectedIds.includes(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧺</Text>
            <Text style={styles.emptyTitle}>Хувцас олдсонгүй</Text>
            <Text style={styles.emptyText}>
              {query ? 'Өөр нэрээр хайж үзнэ үү.' : 'Шинэ хувцас нэмэхэд бэлэн.'}
            </Text>
            {!query && (
              <CustomButton
                label="+ Хувцас нэмэх"
                onPress={() => {}}
                variant="primary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        }
      />

      {/* ── Selection Action Bar ── */}
      {selectedIds.length > 0 && (
        <View style={styles.actionBar}>
          <View style={styles.actionBarLeft}>
            <Text style={styles.actionCount}>{selectedIds.length}</Text>
            <Text style={styles.actionCountLabel}> хувцас сонгогдсон</Text>
          </View>
          <View style={styles.actionBtns}>
            <CustomButton label="Цуцлах" onPress={clearSelection} variant="dark" size="sm"
              style={{ marginRight: spacing.sm }} />
            <CustomButton
              label="Аватарт нэмэх →"
              onPress={() => navigation.navigate('Avatar', { selectedIds })}
              variant="primary" size="sm"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ListRow({ item, onPress, selected }) {
  const ITEM_ART = {
    'T-Shirt': '👕', 'Hoodie': '🧥', 'Puffer Jacket': '🥼',
    'Cargo Pants': '👖', 'Snow Boots': '🥾', 'Beanie': '🧢',
    'Denim Jacket': '🧥', 'Jogger Pants': '👖', 'Sneakers': '👟', 'Turtleneck': '👕',
  };
  const MN = {
    'T-Shirt': 'Цамц', 'Hoodie': 'Хүүди', 'Puffer Jacket': 'Пуффер',
    'Cargo Pants': 'Карго', 'Snow Boots': 'Цасны гутал', 'Beanie': 'Малгай',
    'Denim Jacket': 'Жинсэн хантаз', 'Jogger Pants': 'Жоггер',
    'Sneakers': 'Снийкэр', 'Turtleneck': 'Боодол',
  };

  return (
    <TouchableOpacity
      style={[styles.listRow, selected && styles.listRowSelected]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.75}
    >
      <View style={styles.listThumb}>
        <Text style={styles.listThumbEmoji}>{ITEM_ART[item.type] ?? '🧺'}</Text>
      </View>
      <View style={styles.listMeta}>
        <Text style={[styles.listMnName, selected && { color: colors.accent }]}>
          {MN[item.type] ?? item.type}
        </Text>
        <Text style={styles.listBrand}>{item.brand} · {item.color}</Text>
        <Text style={styles.listLayer}>{item.layer}</Text>
      </View>
      <Text style={[styles.listCheck, selected && styles.listCheckActive]}>
        {selected ? '✓' : '○'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerSub:    { ...typography.label, color: colors.textMuted },
  headerTitle:  { ...typography.h1,   color: colors.text },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewToggle: {
    width: 38, height: 38,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  viewToggleText: { color: colors.text, fontSize: 18 },

  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  countText:     { ...typography.body, color: colors.textMuted },
  countNum:      { color: colors.text, fontWeight: '700' },
  selectedCount: { ...typography.label, color: colors.accent },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon:  { fontSize: 16, color: colors.textMuted },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
  },
  searchClear: { color: colors.textMuted, fontSize: 16, padding: spacing.xs },

  // Layer legend
  legendRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  legendShort: { fontSize: 9, fontWeight: '900', color: colors.black },
  legendLabel: { ...typography.caption, color: colors.textMuted },

  // Filter tabs
  tabsRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1.5, borderColor: colors.border,
    gap: 5,
  },
  tabActive:          { backgroundColor: colors.accentAlpha, borderColor: colors.accent },
  tabEmoji:           { fontSize: 13 },
  tabLabel:           { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive:     { color: colors.accent },
  tabBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    minWidth: 17, height: 17,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive:     { backgroundColor: colors.accent },
  tabBadgeText:       { fontSize: 9, fontWeight: '800', color: colors.textMuted },
  tabBadgeTextActive: { color: colors.black },

  // Grid
  grid:    { paddingHorizontal: spacing.md, paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between' },

  // List row
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  listRowSelected: { borderColor: colors.accent },
  listThumb: {
    width: 72, height: 72,
    backgroundColor: '#121212',
    alignItems: 'center', justifyContent: 'center',
  },
  listThumbEmoji: { fontSize: 36 },
  listMeta:       { flex: 1 },
  listMnName:     { ...typography.h4, color: colors.text },
  listBrand:      { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  listLayer:      { ...typography.label,   color: colors.textMuted, marginTop: 4 },
  listCheck:      { fontSize: 20, color: colors.border },
  listCheckActive:{ color: colors.accent, fontWeight: '900' },

  // Empty
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  emptyText:  { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // Action bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12,
    elevation: 16,
  },
  actionBarLeft:    { flexDirection: 'row', alignItems: 'baseline' },
  actionCount:      { ...typography.h2, color: colors.accent },
  actionCountLabel: { ...typography.body, color: colors.textMuted },
  actionBtns:       { flexDirection: 'row' },
});
