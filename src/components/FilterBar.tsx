import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';

const ACCENT = '#7c6af5';

interface ChipProps {
  active: boolean;
  accentColor?: string;
  emoji?: string;
  showDot?: boolean;
  label: string;
  count?: number;
  onPress: () => void;
}

function Chip({ active, accentColor = ACCENT, emoji, showDot, label, count, onPress }: ChipProps) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue:         active ? 1 : 0,
      duration:        180,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const bgColor     = progress.interpolate({ inputRange: [0, 1], outputRange: ['#2a2a3a', 'transparent'] });
  const borderWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5] });
  const borderColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['transparent', accentColor] });
  const textColor   = progress.interpolate({ inputRange: [0, 1], outputRange: ['#88889a', '#ffffff'] });
  const badgeBg     = progress.interpolate({ inputRange: [0, 1], outputRange: ['#3a3a50', accentColor] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.72}>
      <Animated.View style={[styles.chip, { backgroundColor: bgColor, borderWidth, borderColor }]}>
        {showDot && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
        {emoji   && <Text style={styles.emoji}>{emoji}</Text>}
        <Animated.Text style={[styles.chipLabel, { color: textColor }]}>{label}</Animated.Text>
        {count !== undefined && (
          <Animated.View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface LayerTab {
  key: string;
  label: string;
  color?: string;
}

interface FilterTab {
  key: string;
  label: string;
  emoji?: string;
}

interface Props {
  layerTabs: LayerTab[];
  layerCounts: Record<string, number>;
  activeLayer: string;
  onLayerChange: (key: string) => void;
  filterTabs: FilterTab[];
  categoryCounts: Record<string, number>;
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

export default function FilterBar({
  layerTabs,
  layerCounts,
  activeLayer,
  onLayerChange,
  filterTabs,
  categoryCounts,
  activeFilter,
  onFilterChange,
}: Props) {
  return (
    <View style={styles.container}>

      {/* ── Давхарга ── */}
      <Text style={styles.sectionLabel}>ДАВХАРГА</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {layerTabs.map((tab) => (
          <Chip
            key={tab.key}
            active={activeLayer === tab.key}
            accentColor={tab.key === 'all' ? ACCENT : tab.color}
            showDot={tab.key !== 'all'}
            label={tab.label}
            count={tab.key !== 'all' ? (layerCounts[tab.key] ?? 0) : undefined}
            onPress={() => onLayerChange(tab.key)}
          />
        ))}
      </ScrollView>

      {/* ── Төрөл ── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>ТӨРӨЛ</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {filterTabs.map((tab) => (
          <Chip
            key={tab.key}
            active={activeFilter === tab.key}
            accentColor={ACCENT}
            emoji={tab.emoji}
            label={tab.label}
            count={categoryCounts[tab.key] ?? 0}
            onPress={() => onFilterChange(tab.key)}
          />
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2a',
    borderRadius:    16,
    padding:         20,
    marginHorizontal: 16,
    marginBottom:    12,
  },

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1.4,
    color:         '#55557a',
    marginBottom:  10,
  },
  sectionGap: { marginTop: 16 },

  chipsRow: { gap: 8, paddingRight: 4 } as any,

  chip: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   9999,
    paddingVertical:   7,
    paddingHorizontal: 12,
    gap: 6,
  } as any,

  dot:       { width: 8, height: 8, borderRadius: 4 },
  emoji:     { fontSize: 13 },
  chipLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  badge: {
    borderRadius:   9999,
    minWidth:       18,
    height:         18,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
});
