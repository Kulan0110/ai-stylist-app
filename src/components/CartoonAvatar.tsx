import React from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
} from 'react-native';
import type { WardrobeItem, AvatarAnalysis } from '../types';

const ACCENT  = '#7c6af5';
const BG      = '#0f0f1a';
const CARD    = '#1a1a2e';
const BORDER  = 'rgba(124,106,245,0.22)';

const ITEM_EMOJIS: Record<string, string> = {
  'T-Shirt':'👕','Hoodie':'🧥','Puffer Jacket':'🥼',
  'Cargo Pants':'👖','Snow Boots':'🥾','Beanie':'🧢',
  'Denim Jacket':'🧥','Jogger Pants':'👖','Sneakers':'👟','Turtleneck':'👕',
};

const LAYER_COLORS: Record<string, string> = {
  'Base Layer':'#60A5FA','Mid Layer':'#FB923C',
  Outerwear:'#34D399',Bottom:'#F472B6',Footwear:'#FBBF24',Accessory:'#A78BFA',
};

// ─── sub-components ──────────────────────────────────────────────────────────

interface MetricBoxProps {
  label: string;
  value: string | number;
  color: string;
}

function MetricBox({ label, value, color }: MetricBoxProps) {
  return (
    <View style={S.metricBox}>
      <Text style={[S.metricVal, { color }]}>{value}</Text>
      <Text style={S.metricLabel}>{label}</Text>
    </View>
  );
}

interface SizeCardProps {
  label: string;
  value: string;
  color: string;
  small?: boolean;
}

function SizeCard({ label, value, color, small }: SizeCardProps) {
  return (
    <View style={[S.sizeCard, { borderColor: color + '44' }]}>
      <Text style={[S.sizeVal, { color, fontSize: small ? 13 : 22 }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={S.sizeLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={S.divider} />;
}

// ─── BmiRange type ────────────────────────────────────────────────────────────
interface BmiRange {
  label: string;
  color: string;
  scaleX?: number;
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  photoUri?: string | null;
  bodyAnalysis?: AvatarAnalysis | null;
  activeLayers?: WardrobeItem[];
  bmi?: string | null;
  bmiRange?: BmiRange | null;
  height?: string | number;
  weight?: string | number;
}

export default function CartoonAvatar({
  photoUri, bodyAnalysis, activeLayers = [],
  bmi, bmiRange, height, weight,
}: Props) {
  const hasMetrics  = height || weight || bmi;
  const hasAnalysis = !!bodyAnalysis;
  const hasOutfit   = activeLayers.length > 0;
  const hasData     = photoUri || hasMetrics || hasAnalysis || hasOutfit;

  return (
    <ScrollView
      style={S.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={S.scroll}
    >
      {/* ── Hero: photo + vibe ─────────────────────────────────────────────── */}
      <View style={S.hero}>
        <View style={S.photoRing}>
          <View style={S.photoCircle}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={S.photo} resizeMode="cover" />
              : <Text style={S.photoEmoji}>👤</Text>
            }
          </View>
        </View>

        {hasAnalysis
          ? (
            <View style={S.vibeBadge}>
              <Text style={S.vibeTx}>✦  {bodyAnalysis!.style_vibe}</Text>
            </View>
          )
          : <Text style={S.heroSub}>MY STYLE CARD</Text>
        }
      </View>

      {/* ── Body metrics ───────────────────────────────────────────────────── */}
      {hasMetrics && (
        <>
          <View style={S.metricsRow}>
            {height ? <MetricBox label="ӨНДӨР" value={`${height}cm`} color="#60A5FA" /> : null}
            {height && weight ? <View style={S.metricDivider} /> : null}
            {weight ? <MetricBox label="ЖИН" value={`${weight}kg`} color="#34D399" /> : null}
            {weight && bmi ? <View style={S.metricDivider} /> : null}
            {bmi ? <MetricBox label="BMI" value={bmi} color={bmiRange?.color ?? ACCENT} /> : null}
            {bmi && bmiRange ? <View style={S.metricDivider} /> : null}
            {bmiRange ? <MetricBox label="ХЭЛБЭР" value={bmiRange.label} color={bmiRange.color} /> : null}
          </View>
          <Divider />
        </>
      )}

      {/* ── Today's outfit ─────────────────────────────────────────────────── */}
      {hasOutfit && (
        <>
          <View style={S.section}>
            <Text style={S.sectionTitle}>ӨНӨӨДРИЙН OUTFIT</Text>
            <View style={S.outfitGrid}>
              {activeLayers.map(item => {
                const dot = LAYER_COLORS[item.layer] ?? ACCENT;
                return (
                  <View key={item.id} style={[S.outfitChip, { borderColor: dot + '55' }]}>
                    <Text style={S.outfitEmoji}>{ITEM_EMOJIS[item.type] ?? '🧺'}</Text>
                    <View style={S.outfitMeta}>
                      <Text style={S.outfitType} numberOfLines={1}>{item.type}</Text>
                      <Text style={S.outfitColor} numberOfLines={1}>{item.color} · {item.brand}</Text>
                      <View style={[S.layerTag, { backgroundColor: dot + '22', borderColor: dot + '66' }]}>
                        <Text style={[S.layerTagTx, { color: dot }]}>{item.layer}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* ── Body analysis ──────────────────────────────────────────────────── */}
      {hasAnalysis && bodyAnalysis && (
        <>
          <View style={S.section}>
            <Text style={S.sectionTitle}>БИЕИЙН ШИНЖИЛГЭЭ</Text>
            <View style={S.sizesRow}>
              <SizeCard label="ДЭЭД" value={bodyAnalysis.top_size} color="#60A5FA" />
              <SizeCard label="ДООД" value={bodyAnalysis.bottom_size} color="#F472B6" />
              <SizeCard label="АРЬС" value={bodyAnalysis.skin_tone} color="#FB923C" small />
              <SizeCard label="ҮС" value={bodyAnalysis.hair_color} color="#A78BFA" small />
            </View>

            {bodyAnalysis.fit_tips_mn ? (
              <View style={S.tipsCard}>
                <Text style={S.tipsIcon}>💡</Text>
                <Text style={S.tipsTx}>{bodyAnalysis.fit_tips_mn}</Text>
              </View>
            ) : null}
          </View>
          <Divider />
        </>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!hasData && (
        <View style={S.empty}>
          <Text style={S.emptyEmoji}>👗</Text>
          <Text style={S.emptyTitle}>Style Card хоосон байна</Text>
          <Text style={S.emptySub}>
            Аватар дэлгэц дээр:{'\n'}
            {'  '}📷  Зураг оруулж Claude шинжилгээ хийх{'\n'}
            {'  '}📐  Метрик (өндөр, жин) тохируулах{'\n'}
            {'  '}👕  Хувцас сонгон давхарлах
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 20, gap: 14 } as any,
  photoRing: {
    width: 136, height: 136, borderRadius: 68, padding: 3,
    borderWidth: 2, borderColor: ACCENT,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 18, elevation: 14,
  },
  photoCircle: {
    width: '100%', height: '100%', borderRadius: 66,
    backgroundColor: '#16162a', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  photo:      { width: '100%', height: '100%' },
  photoEmoji: { fontSize: 60 },
  vibeBadge: {
    backgroundColor: 'rgba(124,106,245,0.16)',
    borderRadius: 99, borderWidth: 1, borderColor: ACCENT,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  vibeTx:  { fontSize: 13, fontWeight: '800', color: ACCENT, letterSpacing: 0.5 },
  heroSub: { fontSize: 10, fontWeight: '800', color: '#44445a', letterSpacing: 2.5 },

  // Metrics
  metricsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  metricBox:     { flex: 1, alignItems: 'center', gap: 3 } as any,
  metricVal:     { fontSize: 18, fontWeight: '900' },
  metricLabel:   { fontSize: 9, fontWeight: '700', color: '#55557a', letterSpacing: 0.8 },
  metricDivider: { width: 1, height: 28, backgroundColor: BORDER, marginHorizontal: 4 },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 14 },

  // Section
  section:      { marginHorizontal: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#44445a', letterSpacing: 1.8, marginBottom: 12 },

  // Outfit grid
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as any,
  outfitChip: {
    width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1,
    padding: 12,
  } as any,
  outfitEmoji: { fontSize: 30 },
  outfitMeta:  { flex: 1, gap: 3 } as any,
  outfitType:  { fontSize: 12, fontWeight: '700', color: '#dde0ff' },
  outfitColor: { fontSize: 10, color: '#6868a0' },
  layerTag: {
    alignSelf: 'flex-start', borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  layerTagTx: { fontSize: 9, fontWeight: '700' },

  // Sizes
  sizesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 } as any,
  sizeCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 4,
  } as any,
  sizeVal:   { fontWeight: '900', textAlign: 'center' },
  sizeLabel: { fontSize: 8, fontWeight: '700', color: '#55557a', letterSpacing: 0.8, textAlign: 'center' },

  // Tips
  tipsCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(124,106,245,0.07)',
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14,
  } as any,
  tipsIcon: { fontSize: 18, marginTop: 1 },
  tipsTx:   { flex: 1, fontSize: 13, color: '#9090c0', lineHeight: 20 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 14 } as any,
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#e8e8f0', textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#6868a0', textAlign: 'center', lineHeight: 24 },
});
