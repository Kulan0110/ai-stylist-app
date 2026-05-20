import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../utils/theme';

const DAYS_MN  = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];
const MONTHS_MN = [
  'Нэгдүгээр', 'Хоёрдугаар', 'Гуравдугаар', 'Дөрөвдүгээр',
  'Тавдугаар', 'Зургаадугаар', 'Долдугаар', 'Наймдугаар',
  'Есдүгээр', 'Аравдугаар', 'Арван нэгдүгээр', 'Арван хоёрдугаар',
];

interface PlannedOutfit {
  day: number;
  vibe: string;
  outfit: string;
}

const PLANNED_OUTFITS: PlannedOutfit[] = [
  { day: 3,  vibe: '☕ Кафе',       outfit: 'Cream Turtleneck + Cargo' },
  { day: 7,  vibe: '🎓 Сургууль',   outfit: 'Black Hoodie + Joggers'   },
  { day: 12, vibe: '💜 Дэйт',       outfit: 'Denim Jacket + Sneakers'  },
  { day: 18, vibe: '🎉 Найзуудтай', outfit: 'Olive Puffer + Snow Boots' },
];

function buildCalendar(year: number, month: number): (number | null)[] {
  const first    = new Date(year, month, 1).getDay();
  const startDay = (first + 6) % 7;
  const total    = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const now   = new Date();
  const [year, setYear]   = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());
  const today  = now.getDate();
  const cells  = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>OUTFIT</Text>
            <Text style={styles.headerTitle}>Хуваарь</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Beta</Text>
          </View>
        </View>

        {/* ── Month Nav ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTHS_MN[month]} сар · {year}
          </Text>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Calendar Grid ── */}
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {DAYS_MN.map((d) => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

              const isToday   = isCurrentMonth && day === today;
              const planned   = PLANNED_OUTFITS.find((p) => p.day === day);
              const hasPlan   = !!planned;

              return (
                <TouchableOpacity key={`day-${i}`} style={styles.cell} activeOpacity={0.7}>
                  <View style={[
                    styles.dayCircle,
                    isToday   && styles.dayCircleToday,
                    hasPlan   && !isToday && styles.dayCirclePlan,
                  ]}>
                    <Text style={[
                      styles.dayNum,
                      isToday && styles.dayNumToday,
                      hasPlan && !isToday && styles.dayNumPlan,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasPlan && <View style={styles.planDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Planned Outfits ── */}
        <Text style={styles.sectionTitle}>ТӨЛӨВЛӨГДСӨН LOOK</Text>
        {PLANNED_OUTFITS.map((p, i) => (
          <View key={i} style={styles.planCard}>
            <View style={styles.planDateBadge}>
              <Text style={styles.planDateNum}>{p.day}</Text>
              <Text style={styles.planDateMonth}>{MONTHS_MN[month].slice(0, 3)}</Text>
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planVibe}>{p.vibe}</Text>
              <Text style={styles.planOutfit}>{p.outfit}</Text>
            </View>
            <View style={styles.planEditBtn}>
              <Text style={styles.planEditText}>✦</Text>
            </View>
          </View>
        ))}

        {/* ── Empty CTA ── */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaIcon}>✦</Text>
          <Text style={styles.ctaTitle}>Look төлөвлөх</Text>
          <Text style={styles.ctaSub}>
            Home хуудаснаас AI-гаар look үүсгэж{'\n'}хуваариндаа нэмж болно.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 140 },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerSub:   { ...typography.label, color: colors.textMuted },
  headerTitle: { ...typography.h1,   color: colors.text },
  headerBadge: {
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.accent,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  headerBadgeText: { ...typography.label, color: colors.accent, fontSize: 9 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText:  { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  monthLabel:  { ...typography.h3, color: colors.text },

  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width:          `${100 / 7}%` as any,
    aspectRatio:    1,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  dayCircle: {
    width:          CELL_SIZE - 8,
    height:         CELL_SIZE - 8,
    borderRadius:   (CELL_SIZE - 8) / 2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.accent,
  },
  dayCirclePlan: {
    borderWidth:  1.5,
    borderColor:  colors.accent + '60',
    backgroundColor: colors.accentAlpha,
  },
  dayNum:       { ...typography.body, color: colors.textMuted, fontWeight: '500' },
  dayNumToday:  { color: '#fff', fontWeight: '800' },
  dayNumPlan:   { color: colors.accent, fontWeight: '700' },
  planDot: {
    position:        'absolute',
    bottom:          2,
    width:           4, height: 4,
    borderRadius:    2,
    backgroundColor: colors.accent,
  },

  sectionTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  planCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.card,
    borderRadius:    borderRadius.md,
    borderWidth:     1, borderColor: colors.border,
    padding:         spacing.md,
    marginBottom:    spacing.sm,
    gap:             spacing.md,
  },
  planDateBadge: {
    width: 44, height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentAlpha,
    borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  planDateNum:   { ...typography.h3, color: colors.accent, lineHeight: 20 },
  planDateMonth: { ...typography.label, color: colors.accent, fontSize: 8 },
  planInfo:      { flex: 1 },
  planVibe:      { ...typography.caption, color: colors.accent, fontWeight: '700', marginBottom: 2 },
  planOutfit:    { ...typography.body,    color: colors.text },
  planEditBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accentAlpha,
    borderWidth: 1, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  planEditText: { color: colors.accent, fontSize: 14 },

  ctaCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, borderLeftColor: colors.accent,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaIcon:  { fontSize: 28, color: colors.accent },
  ctaTitle: { ...typography.h3, color: colors.text },
  ctaSub:   { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
