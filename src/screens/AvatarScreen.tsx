import React, { useState, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Dimensions, TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import { analyzeAvatar } from '../services/aiService';
import { useWardrobe } from '../context/WardrobeContext';
import { useAuth } from '../context/AuthContext';
import CartoonAvatar     from '../components/CartoonAvatar';
import Avatar3DCustomizer from '../components/Avatar3DCustomizer';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList, WardrobeItem, AvatarAnalysis } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AVATAR_W = SCREEN_W * 0.52;
const AVATAR_H = SCREEN_H * 0.42;

type Props = BottomTabScreenProps<RootTabParamList, 'Avatar'>;

const LAYER_Z_INDEX: Record<string, number> = {
  'Base Avatar': 0,
  Bottom:        1,
  'Base Layer':  2,
  'Mid Layer':   3,
  Outerwear:     4,
  Footwear:      5,
  Accessory:     6,
};

const LAYER_COLORS: Record<string, string> = {
  Bottom:        '#F472B6',
  'Base Layer':  '#60A5FA',
  'Mid Layer':   '#FB923C',
  Outerwear:     '#34D399',
  Footwear:      '#FBBF24',
  Accessory:     '#A78BFA',
};

const BASE_AVATAR_URI = 'https://via.placeholder.com/400x700/121212/FFFFFF?text=%F0%9F%91%A4';

const ITEM_EMOJIS: Record<string, string> = {
  'T-Shirt': '👕', 'Hoodie': '🧥', 'Puffer Jacket': '🥼',
  'Cargo Pants': '👖', 'Snow Boots': '🥾', 'Beanie': '🧢',
  'Denim Jacket': '🧥', 'Jogger Pants': '👖', 'Sneakers': '👟', 'Turtleneck': '👕',
};

interface BmiRange { max: number; label: string; scaleX: number; color: string; }
const BMI_RANGES: BmiRange[] = [
  { max: 18.5,     label: 'Нимгэн',  scaleX: 0.84, color: '#60A5FA' },
  { max: 25,       label: 'Дундаж',  scaleX: 1.00, color: '#34D399' },
  { max: 30,       label: 'Спорт',   scaleX: 1.14, color: '#FB923C' },
  { max: Infinity, label: 'Хүчтэй', scaleX: 1.28, color: '#F472B6' },
];

function getBmiRange(bmi: number): BmiRange {
  return BMI_RANGES.find((r) => bmi < r.max) ?? BMI_RANGES[BMI_RANGES.length - 1];
}

export default function AvatarScreen({ route }: Props) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!user) return <AuthGate />;

  const preSelected = route?.params?.selectedIds ?? [];
  const { wardrobe } = useWardrobe();

  const [activeItems, setActiveItems] = useState<string[]>(preSelected.length > 0 ? preSelected : []);
  const [activeTab, setActiveTab]     = useState('Tops');

  const [height, setHeight]           = useState('');
  const [weight, setWeight]           = useState('');
  const [tempH, setTempH]             = useState('');
  const [tempW, setTempW]             = useState('');
  const [showMetrics, setShowMetrics] = useState(false);

  const [photoUri, setPhotoUri]           = useState<string | null>(null);
  const [photoBase64, setPhotoBase64]     = useState<string | null>(null);
  const [bodyAnalysis, setBodyAnalysis]   = useState<AvatarAnalysis | null>(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [showCartoon,   setShowCartoon]   = useState(false);
  const [show3D,        setShow3D]        = useState(false);

  const TABS = ['Tops', 'Jackets', 'Bottoms', 'Footwear', 'Accessories'];

  const { bmi, bmiRange } = useMemo(() => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (!h || !w) return { bmi: null, bmiRange: null };
    const val = w / Math.pow(h / 100, 2);
    return { bmi: val.toFixed(1), bmiRange: getBmiRange(val) };
  }, [height, weight]);

  const filteredWardrobe = useMemo(
    () => wardrobe.filter((i) => i.category === activeTab),
    [wardrobe, activeTab],
  );

  const activeLayers = useMemo(() => {
    const items = wardrobe.filter((i) => activeItems.includes(i.id));
    return items.sort((a, b) => (LAYER_Z_INDEX[a.layer] ?? 0) - (LAYER_Z_INDEX[b.layer] ?? 0));
  }, [activeItems]);

  function toggleItem(item: WardrobeItem) {
    setActiveItems((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      const sameLayer = wardrobe.find((w) => prev.includes(w.id) && w.layer === item.layer);
      const next = sameLayer ? prev.filter((id) => id !== sameLayer.id) : [...prev];
      return [...next, item.id];
    });
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Зөвшөөрөл хэрэгтэй', 'Галерид хандах зөвшөөрөл олгоно уу.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
      setBodyAnalysis(null);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const res = await analyzeAvatar({
      imageBase64: photoBase64,
      mimeType:    'image/jpeg',
      height:      parseFloat(height) || 170,
      weight:      parseFloat(weight) || 65,
    });
    if (res.success) setBodyAnalysis(res.data);
    setAnalyzing(false);
  }

  function openMetrics() {
    setTempH(height);
    setTempW(weight);
    setShowMetrics(true);
  }

  function saveMetrics() {
    setHeight(tempH);
    setWeight(tempW);
    setBodyAnalysis(null);
    setShowMetrics(false);
  }

  const modalBmi = useMemo(() => {
    const h = parseFloat(tempH), w = parseFloat(tempW);
    if (!h || !w) return null;
    const val = w / Math.pow(h / 100, 2);
    return { value: val.toFixed(1), range: getBmiRange(val) };
  }, [tempH, tempW]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>МИНИЙ</Text>
          <Text style={styles.headerTitle}>Аватар</Text>
          <Text style={styles.headerUser}>👤 {user.name}</Text>
        </View>
        <View style={styles.headerRight}>
          {activeItems.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setActiveItems([])}>
              <Text style={styles.clearBtnText}>Цэвэрлэх</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.metricsBtn} onPress={openMetrics}>
            <Text style={styles.metricsBtnText}>
              {bmi ? `BMI ${bmi}` : '📐 Метрик'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCartoon} onPress={() => setShowCartoon(true)}>
            <Text style={styles.btnCartoonTx}>👤 Style Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnCartoon, { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.12)' }]}
            onPress={() => setShow3D(true)}
          >
            <Text style={[styles.btnCartoonTx, { color: '#34D399' }]}>🎭 3D</Text>
          </TouchableOpacity>
          <SignOutButton />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {bmi && bmiRange && (
          <View style={[styles.metricsStrip, { borderColor: bmiRange.color + '55' }]}>
            <Text style={styles.metricItem}>↕ {height} cm</Text>
            <View style={styles.metricDivider} />
            <Text style={styles.metricItem}>⚖ {weight} kg</Text>
            <View style={styles.metricDivider} />
            <Text style={[styles.metricBmiVal, { color: bmiRange.color }]}>BMI {bmi}</Text>
            <View style={[styles.bodyTypeBadge, {
              backgroundColor: bmiRange.color + '22',
              borderColor:     bmiRange.color,
            }]}>
              <Text style={[styles.bodyTypeText, { color: bmiRange.color }]}>{bmiRange.label}</Text>
            </View>
          </View>
        )}

        <View style={styles.canvasWrap}>
          <View style={[styles.canvas, { width: AVATAR_W, height: AVATAR_H }]}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerBR} />

            <Image
              source={{ uri: photoUri ?? BASE_AVATAR_URI }}
              style={[
                styles.layerImage,
                { zIndex: 0, transform: [{ scaleX: bmiRange?.scaleX ?? 1.0 }] },
              ]}
              resizeMode="contain"
            />

            {activeLayers.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.image_url }}
                style={[styles.layerImage, { zIndex: LAYER_Z_INDEX[item.layer] ?? 1 }]}
                resizeMode="contain"
              />
            ))}
          </View>

          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
            <Text style={styles.photoBtnIcon}>{photoUri ? '🔄' : '📷'}</Text>
          </TouchableOpacity>

          <View style={styles.layerCountPill}>
            <Text style={styles.layerCountText}>{activeLayers.length} давхар</Text>
          </View>
        </View>

        {bodyAnalysis ? (
          <View style={styles.analysisPanel}>
            <View style={styles.analysisRow}>
              <SizeChip label="Дээд" size={bodyAnalysis.top_size} />
              <SizeChip label="Доод" size={bodyAnalysis.bottom_size} />
              <View style={styles.vibeChip}>
                <Text style={styles.vibeChipText}>✦ {bodyAnalysis.style_vibe}</Text>
              </View>
            </View>
            <Text style={styles.fitTips}>{bodyAnalysis.fit_tips_mn}</Text>
            <TouchableOpacity onPress={() => setBodyAnalysis(null)}>
              <Text style={styles.reanalyzeText}>↺ Дахин шинжлэх</Text>
            </TouchableOpacity>
          </View>
        ) : photoUri ? (
          <TouchableOpacity
            style={[styles.analyzeBtn, analyzing && styles.analyzeBtnLoading]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing
              ? <ActivityIndicator color={colors.accent} size="small" />
              : <Text style={styles.analyzeBtnText}>✦ Claude-аар биеийн шинжилгээ хийх</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.photoPrompt} onPress={pickPhoto}>
            <Text style={styles.photoPromptText}>📷  Зураг оруулж биеийн шинжилгээ хийх</Text>
          </TouchableOpacity>
        )}

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
                  <Text
                    style={[styles.pickerLabel, isActive && styles.pickerLabelActive]}
                    numberOfLines={1}
                  >
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
                    <Text style={[styles.guideLabel, isActive && { color: dotColor }]}>{layer}</Text>
                  </View>
                );
              })}
          </ScrollView>
        </View>

      </ScrollView>

      <Modal
        visible={showMetrics}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMetrics(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowMetrics(false)} />
        <View style={styles.metricsSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Биеийн Метрик</Text>
          <Text style={styles.sheetSub}>Өндөр болон жингээ оруулна уу</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>ӨНДӨР (cm)</Text>
              <TextInput
                style={styles.input}
                value={tempH}
                onChangeText={setTempH}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={colors.textMuted}
                maxLength={3}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>ЖИН (kg)</Text>
              <TextInput
                style={styles.input}
                value={tempW}
                onChangeText={setTempW}
                keyboardType="numeric"
                placeholder="65"
                placeholderTextColor={colors.textMuted}
                maxLength={3}
              />
            </View>
          </View>

          {modalBmi && (
            <View style={[styles.bmiPreview, { borderColor: modalBmi.range.color }]}>
              <Text style={[styles.bmiPreviewVal, { color: modalBmi.range.color }]}>
                BMI {modalBmi.value}
              </Text>
              <Text style={[styles.bmiPreviewLabel, { color: modalBmi.range.color }]}>
                {modalBmi.range.label}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={saveMetrics}>
            <Text style={styles.saveBtnText}>Хадгалах</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={show3D} animationType="slide" onRequestClose={() => setShow3D(false)}>
        <Avatar3DCustomizer
          wardrobe={wardrobe}
          initialLayers={activeLayers}
          onClose={() => setShow3D(false)}
        />
      </Modal>

      <Modal visible={showCartoon} animationType="slide" onRequestClose={() => setShowCartoon(false)}>
        <View style={{ flex: 1, backgroundColor: '#0f0f1a' }}>
          <View style={styles.styleCardHeader}>
            <Text style={styles.styleCardTitle}>👤  Миний Style Card</Text>
            <TouchableOpacity style={styles.styleCardClose} onPress={() => setShowCartoon(false)}>
              <Text style={styles.styleCardCloseTx}>✕ Хаах</Text>
            </TouchableOpacity>
          </View>
          <CartoonAvatar
            photoUri={photoUri}
            bodyAnalysis={bodyAnalysis}
            activeLayers={activeLayers}
            bmi={bmi}
            bmiRange={bmiRange}
            height={height}
            weight={weight}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface SizeChipProps { label: string; size: string; }
function SizeChip({ label, size }: SizeChipProps) {
  return (
    <View style={styles.sizeChip}>
      <Text style={styles.sizeChipLabel}>{label}</Text>
      <Text style={styles.sizeChipVal}>{size}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 140 },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerSub:   { ...typography.label, color: colors.textMuted },
  headerTitle: { ...typography.h1,   color: colors.text },
  headerUser:  { ...typography.caption, color: colors.accent, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clearBtn: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.error,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  clearBtnText: { ...typography.caption, color: colors.error, fontWeight: '700' },
  metricsBtn: {
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.accent,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  metricsBtnText: { ...typography.caption, color: colors.accent, fontWeight: '700' },
  btnCartoon: {
    backgroundColor: 'rgba(124,106,245,0.15)',
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.accent,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
  },
  btnCartoonTx: { ...typography.caption, color: colors.accent, fontWeight: '800' },

  metricsStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  metricItem:    { ...typography.caption, color: colors.textOff, fontWeight: '600' },
  metricDivider: { width: 1, height: 12, backgroundColor: colors.border },
  metricBmiVal:  { ...typography.caption, fontWeight: '800' },
  bodyTypeBadge: {
    marginLeft: 'auto',
    borderRadius: borderRadius.full, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  bodyTypeText: { ...typography.label, fontWeight: '800', fontSize: 10 },

  canvasWrap: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  canvas: { position: 'relative' },
  layerImage: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
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
  photoBtn: {
    position: 'absolute', bottom: spacing.md + 4, left: spacing.md + 4,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: colors.border,
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  photoBtnIcon: { fontSize: 18 },
  layerCountPill: {
    position: 'absolute', top: spacing.md + 4, right: spacing.md + 4,
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.accent,
  },
  layerCountText: { ...typography.label, color: colors.accent, fontSize: 9 },

  analysisPanel: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sizeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    gap: 5,
  },
  sizeChipLabel: { ...typography.label, color: colors.textMuted, fontSize: 9 },
  sizeChipVal:   { ...typography.h4,   color: colors.accent, fontWeight: '800' },
  vibeChip: {
    marginLeft: 'auto',
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.accent,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  vibeChipText: { ...typography.label, color: colors.accent, fontWeight: '700' },
  fitTips:      { ...typography.body, color: colors.textOff, lineHeight: 20 },
  reanalyzeText: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'underline' },

  analyzeBtn: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.accentAlpha,
    borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.accent,
    paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  analyzeBtnLoading: { opacity: 0.7 },
  analyzeBtnText: { ...typography.h4, color: colors.accent, fontWeight: '700' },

  photoPrompt: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  photoPromptText: { ...typography.body, color: colors.textMuted },

  pickerWrap: {
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabsContainer:  { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  itemsContainer: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  tab: {
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText:       { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.black, fontWeight: '800' },
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
  pickerEmoji:       { fontSize: 38 },
  activeOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(168,85,247,0.35)', alignItems: 'center', justifyContent: 'center' },
  activeCheck:       { fontSize: 26, fontWeight: '900', color: '#fff' },
  pickerLabel:       { ...typography.caption, color: colors.text, textAlign: 'center', padding: 5 },
  pickerLabelActive: { color: colors.accent, fontWeight: '700' },
  emptyPicker:       { alignItems: 'center', justifyContent: 'center', width: 200 },
  emptyText:         { ...typography.body, color: colors.textMuted },

  layerGuide:      { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
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

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  metricsSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1, borderColor: colors.border,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center',
  },
  sheetTitle: { ...typography.h2, color: colors.text },
  sheetSub:   { ...typography.body, color: colors.textMuted, marginTop: -spacing.sm },
  inputRow:   { flexDirection: 'row', gap: spacing.md },
  inputWrap:  { flex: 1, gap: spacing.xs },
  inputLabel: { ...typography.label, color: colors.textMuted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text,
    ...typography.h3,
    textAlign: 'center',
  },
  bmiPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.md, borderWidth: 1.5,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  bmiPreviewVal:   { ...typography.h2, fontWeight: '900' },
  bmiPreviewLabel: { ...typography.h4, fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.h4, color: colors.black, fontWeight: '800' },

  signOutBtn: {
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
  },
  signOutTx: { fontSize: 11, fontWeight: '700', color: '#f87171' },

  styleCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#16162a',
    borderBottomWidth: 1, borderBottomColor: 'rgba(124,106,245,0.22)',
  },
  styleCardTitle:   { fontSize: 16, fontWeight: '800', color: '#e8e8f0' },
  styleCardClose: {
    backgroundColor: 'rgba(124,106,245,0.15)', borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(124,106,245,0.3)',
  },
  styleCardCloseTx: { fontSize: 12, fontWeight: '700', color: '#7c6af5' },
});

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity
      style={styles.signOutBtn}
      onPress={() =>
        Alert.alert('Гарах', 'Акаунтаас гарах уу?', [
          { text: 'Болих', style: 'cancel' },
          { text: 'Гарах', style: 'destructive', onPress: () => { signOut(); } },
        ], { cancelable: true })
      }
    >
      <Text style={styles.signOutTx}>Гарах</Text>
    </TouchableOpacity>
  );
}

const AG = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0a0a14' },
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  logo:      { alignItems: 'center', marginBottom: 36 },
  logoIcon:  { fontSize: 52, marginBottom: 10 },
  logoTitle: { fontSize: 26, fontWeight: '900', color: '#e8e8f0', letterSpacing: 0.5 },
  logoSub:   { fontSize: 13, color: '#6868a0', marginTop: 4 },

  tabs:      { flexDirection: 'row', backgroundColor: '#16162a', borderRadius: 14, padding: 4, marginBottom: 28 },
  tab:       { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#7c6af5' },
  tabTx:     { fontSize: 14, fontWeight: '700', color: '#6868a0' },
  tabTxOn:   { color: '#fff' },

  label:     { fontSize: 11, fontWeight: '700', color: '#6868a0', letterSpacing: 0.8, marginBottom: 6 },
  inputWrap: { marginBottom: 14 },
  input: {
    backgroundColor: '#16162a', borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(124,106,245,0.25)',
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#dde0ff',
  },
  inputFocus: { borderColor: '#7c6af5' },

  btn: {
    backgroundColor: '#7c6af5', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    marginTop: 6,
    shadowColor: '#7c6af5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnOff: { opacity: 0.6 },
  btnTx:  { fontSize: 15, fontWeight: '800', color: '#fff' },

  errBox: {
    backgroundColor: 'rgba(248,113,113,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    padding: 12, marginBottom: 12,
  },
  errTx: { fontSize: 13, color: '#fca5a5', textAlign: 'center' },

  divider:  { height: 1, backgroundColor: 'rgba(124,106,245,0.15)', marginVertical: 20 },
  switchTx: { textAlign: 'center', fontSize: 13, color: '#6868a0' },
  switchLk: { color: '#7c6af5', fontWeight: '700' },
});

function AuthGate() {
  const { signIn, register } = useAuth();
  const [tab,      setTab]      = useState<'login' | 'register'>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [focused,  setFocused]  = useState('');

  function switchTab(t: 'login' | 'register') { setTab(t); setError(''); }

  function validate(): string | null {
    if (tab === 'register' && !name.trim())
      return 'Нэрээ оруулна уу';
    if (!email.trim() || !email.includes('@'))
      return 'Зөв и-мэйл хаяг оруулна уу';
    if (password.length < 6)
      return 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой';
    if (tab === 'register' && password !== confirm)
      return 'Нууц үг таарахгүй байна';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setBusy(true);
    setError('');
    try {
      if (tab === 'login') {
        await signIn(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const inp = (focused_key: string) => [
    AG.input,
    focused === focused_key && AG.inputFocus,
  ];

  return (
    <SafeAreaView style={AG.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a14" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={AG.scroll} keyboardShouldPersistTaps="handled">

          <View style={AG.logo}>
            <Text style={AG.logoIcon}>✨</Text>
            <Text style={AG.logoTitle}>GlowStyle AI</Text>
            <Text style={AG.logoSub}>Таны хувийн загварын туслагч</Text>
          </View>

          <View style={AG.tabs}>
            <TouchableOpacity
              style={[AG.tab, tab === 'login' && AG.tabActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[AG.tabTx, tab === 'login' && AG.tabTxOn]}>Нэвтрэх</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[AG.tab, tab === 'register' && AG.tabActive]}
              onPress={() => switchTab('register')}
            >
              <Text style={[AG.tabTx, tab === 'register' && AG.tabTxOn]}>Бүртгүүлэх</Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={AG.errBox}>
              <Text style={AG.errTx}>{error}</Text>
            </View>
          )}

          {tab === 'register' && (
            <View style={AG.inputWrap}>
              <Text style={AG.label}>НЭР</Text>
              <TextInput
                style={inp('name')}
                value={name}
                onChangeText={setName}
                placeholder="Өөрийн нэр"
                placeholderTextColor="#44445a"
                autoCapitalize="words"
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
              />
            </View>
          )}

          <View style={AG.inputWrap}>
            <Text style={AG.label}>И-МЭЙЛ</Text>
            <TextInput
              style={inp('email')}
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor="#44445a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
            />
          </View>

          <View style={AG.inputWrap}>
            <Text style={AG.label}>НУУЦ ҮГ</Text>
            <TextInput
              style={inp('password')}
              value={password}
              onChangeText={setPassword}
              placeholder="Дор хаяж 6 тэмдэгт"
              placeholderTextColor="#44445a"
              secureTextEntry
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
            />
          </View>

          {tab === 'register' && (
            <View style={AG.inputWrap}>
              <Text style={AG.label}>НУУЦ ҮГ ДАВТАХ</Text>
              <TextInput
                style={inp('confirm')}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Нууц үгийг дахин оруул"
                placeholderTextColor="#44445a"
                secureTextEntry
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused('')}
              />
            </View>
          )}

          <TouchableOpacity
            style={[AG.btn, busy && AG.btnOff]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={AG.btnTx}>
                  {tab === 'login' ? 'Нэвтрэх →' : 'Бүртгүүлэх →'}
                </Text>
            }
          </TouchableOpacity>

          <View style={AG.divider} />
          <Text style={AG.switchTx}>
            {tab === 'login' ? 'Акаунт байхгүй юу? ' : 'Акаунттай юу? '}
            <Text
              style={AG.switchLk}
              onPress={() => switchTab(tab === 'login' ? 'register' : 'login')}
            >
              {tab === 'login' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
            </Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
