import React from 'react';
import {
  View, Text, StyleSheet, StatusBar,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }     from '../context/AuthContext';
import { useWardrobe } from '../context/WardrobeContext';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import type { NavigationProp } from '@react-navigation/native';
import type { RootTabParamList } from '../types';

const ACCENT  = '#7c6af5';
const CARD    = '#1a1a2e';
const BORDER  = 'rgba(124,106,245,0.22)';

interface Props {
  navigation: NavigationProp<RootTabParamList>;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { wardrobe }      = useWardrobe();

  if (!user) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={S.guestWrap}>
          <Text style={S.guestIcon}>👤</Text>
          <Text style={S.guestTitle}>Нэвтрээгүй байна</Text>
          <Text style={S.guestSub}>Бүртгэл үүсгэж эсвэл нэвтэрч{'\n'}хувийн профайлаа тохируулаарай</Text>
          <TouchableOpacity style={S.loginBtn} onPress={() => navigation.navigate('Avatar')}>
            <Text style={S.loginBtnTx}>Нэвтрэх / Бүртгүүлэх →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const categoryStats = ['Tops', 'Jackets', 'Bottoms', 'Footwear', 'Accessories'].map(cat => ({
    label: cat,
    count: wardrobe.filter(i => i.category === cat).length,
  }));

  function handleSignOut() {
    Alert.alert(
      'Гарах',
      `${user.name} акаунтаас гарах уу?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Гарах',
          style: 'destructive',
          onPress: () => { signOut(); },
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero ── */}
        <View style={S.hero}>
          <View style={S.avatar}>
            <Text style={S.avatarInitials}>{initials || '👤'}</Text>
          </View>
          <Text style={S.name}>{user.name}</Text>
          <Text style={S.email}>{user.email}</Text>
        </View>

        {/* ── Wardrobe stats ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>ХУВЦАС САН</Text>
          <View style={S.statsGrid}>
            <StatCard value={wardrobe.length} label="Нийт хувцас" color={ACCENT} />
            {categoryStats.filter(c => c.count > 0).map(c => (
              <StatCard key={c.label} value={c.count} label={c.label} color="#60A5FA" />
            ))}
          </View>
        </View>

        {/* ── Account ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>АКАУНТ</Text>
          <View style={S.infoCard}>
            <InfoRow icon="👤" label="Нэр"    value={user.name}  />
            <View style={S.infoDivider} />
            <InfoRow icon="✉️" label="И-мэйл" value={user.email} />
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>ТОХИРГОО</Text>
          <View style={S.actionsCard}>
            <ActionRow
              icon="🎽"
              label="Avatar тохируулах"
              onPress={() => navigation.navigate('Avatar')}
            />
            <View style={S.infoDivider} />
            <ActionRow
              icon="👕"
              label="Хувцас нэмэх"
              onPress={() => navigation.navigate('Wardrobe')}
            />
          </View>
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={S.signOutBtn} onPress={handleSignOut}>
          <Text style={S.signOutIcon}>🚪</Text>
          <Text style={S.signOutTx}>Гарах</Text>
        </TouchableOpacity>

        <Text style={S.version}>GlowStyle AI · v1.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps { value: number; label: string; color: string; }
function StatCard({ value, label, color }: StatCardProps) {
  return (
    <View style={[S.statCard, { borderColor: color + '33' }]}>
      <Text style={[S.statVal, { color }]}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

interface InfoRowProps { icon: string; label: string; value: string; }
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={S.infoRow}>
      <Text style={S.infoIcon}>{icon}</Text>
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoVal} numberOfLines={1}>{value}</Text>
    </View>
  );
}

interface ActionRowProps { icon: string; label: string; onPress: () => void; }
function ActionRow({ icon, label, onPress }: ActionRowProps) {
  return (
    <TouchableOpacity style={S.infoRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={S.infoIcon}>{icon}</Text>
      <Text style={[S.infoLabel, { flex: 1, color: colors.text }]}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 140 },

  guestWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  guestIcon:  { fontSize: 60 },
  guestTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  guestSub:   { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  loginBtn: {
    backgroundColor: ACCENT, borderRadius: borderRadius.md,
    paddingVertical: 13, paddingHorizontal: 32, marginTop: spacing.sm,
  },
  loginBtnTx: { ...typography.h4, color: '#fff', fontWeight: '800' },

  hero: { alignItems: 'center', paddingTop: 36, paddingBottom: 28, gap: 8 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: ACCENT + '33',
    borderWidth: 2.5, borderColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  avatarInitials: { fontSize: 36, fontWeight: '900', color: ACCENT },
  name:  { ...typography.h2, color: colors.text },
  email: { ...typography.body, color: colors.textMuted },

  section:      { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.textMuted, letterSpacing: 1.5, marginBottom: spacing.sm },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    minWidth: '30%', flex: 1,
    backgroundColor: CARD, borderRadius: borderRadius.md,
    borderWidth: 1, padding: spacing.md,
    alignItems: 'center', gap: 4,
  },
  statVal:   { fontSize: 24, fontWeight: '900' },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  infoCard:    { backgroundColor: CARD, borderRadius: borderRadius.md, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  actionsCard: { backgroundColor: CARD, borderRadius: borderRadius.md, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.sm },
  infoDivider: { height: 1, backgroundColor: BORDER, marginLeft: 48 },
  infoIcon:    { fontSize: 18, width: 28 },
  infoLabel:   { ...typography.caption, color: colors.textMuted, width: 60 },
  infoVal:     { flex: 1, ...typography.body, color: colors.text, textAlign: 'right' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
    paddingVertical: 15,
  },
  signOutIcon: { fontSize: 18 },
  signOutTx:   { ...typography.h4, color: '#f87171', fontWeight: '700' },

  version: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
