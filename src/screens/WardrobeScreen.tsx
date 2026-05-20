import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  TouchableOpacity, TextInput, Dimensions, Modal, Image,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import WardrobeItem from '../components/WardrobeItem';
import CustomButton  from '../components/CustomButton';
import FilterBar     from '../components/FilterBar';
import { analyzeClothingItem, generateClothingImageUrl, convertToCartoonImage } from '../services/aiService';
import { useWardrobe } from '../context/WardrobeContext';
import { useAuth } from '../context/AuthContext';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList, WardrobeItem as WardrobeItemType, ClothingAnalysis } from '../types';

const { width: W } = Dimensions.get('window');

type Props = BottomTabScreenProps<RootTabParamList, 'Wardrobe'>;

const ACCENT = '#7c6af5';
const BORDER = 'rgba(124,106,245,0.22)';

interface FilterTab { key: string; label: string; emoji: string; }
interface LayerTab  { key: string; label: string; color: string; }

const FILTER_TABS: FilterTab[] = [
  { key: 'all',         label: 'Бүгд',    emoji: '◈' },
  { key: 'Tops',        label: 'Цамц',    emoji: '👕' },
  { key: 'Jackets',     label: 'Хантааз', emoji: '🥼' },
  { key: 'Bottoms',     label: 'Өмд',     emoji: '👖' },
  { key: 'Footwear',    label: 'Гутал',   emoji: '👟' },
  { key: 'Accessories', label: 'Дагалдах',emoji: '🧢' },
];

const LAYER_TABS: LayerTab[] = [
  { key: 'all',        label: 'Бүгд',   color: '#A855F7' },
  { key: 'Base Layer', label: 'Base',   color: '#60A5FA' },
  { key: 'Mid Layer',  label: 'Mid',    color: '#FB923C' },
  { key: 'Outerwear',  label: 'Outer',  color: '#34D399' },
  { key: 'Bottom',     label: 'Bottom', color: '#F472B6' },
  { key: 'Footwear',   label: 'Foot',   color: '#FBBF24' },
  { key: 'Accessory',  label: 'Acc',    color: '#A78BFA' },
];

const LAYER_ACCENT: Record<string, string> = {
  'Base Layer': '#60A5FA', 'Mid Layer': '#FB923C', Outerwear: '#34D399',
  Bottom: '#F472B6', Footwear: '#FBBF24', Accessory: '#A78BFA',
};

type AddStep = 'pick' | 'analyzing' | 'confirm';

export default function WardrobeScreen({ navigation }: Props) {
  const { wardrobe, addItem } = useWardrobe();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLayer,  setActiveLayer]  = useState('all');
  const [query,        setQuery]        = useState('');
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');

  const [showAdd,      setShowAdd]      = useState(false);
  const [pickedUri,  setPickedUri]  = useState<string | null>(null);
  const [cartoonUri, setCartoonUri] = useState<string | null>(null);
  const [analyzingMsg, setAnalyzingMsg] = useState('');
  const [addStep,      setAddStep]      = useState<AddStep>('pick');
  const [aiResult,     setAiResult]     = useState<ClothingAnalysis | null>(null);
  const [aiGenUrl,     setAiGenUrl]     = useState<string | null>(null);
  const [editType,     setEditType]     = useState('');
  const [editColor,    setEditColor]    = useState('');
  const [editBrand,    setEditBrand]    = useState('');

  const filtered = useMemo(() => {
    let items = wardrobe;
    if (activeFilter !== 'all') items = items.filter(i => i.category === activeFilter);
    if (activeLayer  !== 'all') items = items.filter(i => i.layer    === activeLayer);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(i =>
        i.type.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)
      );
    }
    return items;
  }, [wardrobe, activeFilter, activeLayer, query]);

  const categoryCounts = useMemo(() => {
    const base = activeLayer === 'all' ? wardrobe : wardrobe.filter(i => i.layer === activeLayer);
    const acc: Record<string, number> = { all: base.length };
    FILTER_TABS.slice(1).forEach(t => { acc[t.key] = base.filter(i => i.category === t.key).length; });
    return acc;
  }, [wardrobe, activeLayer]);

  const layerCounts = useMemo(() => {
    const acc: Record<string, number> = { all: wardrobe.length };
    LAYER_TABS.slice(1).forEach(t => { acc[t.key] = wardrobe.filter(i => i.layer === t.key).length; });
    return acc;
  }, [wardrobe]);

  function toggleSelect(item: WardrobeItemType) {
    setSelectedIds(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  }

  function openAdd() {
    if (!user) {
      navigation.navigate('Avatar');
      return;
    }
    setPickedUri(null);
    setPickedB64(null);
    setCartoonUri(null);
    setAiResult(null);
    setAiGenUrl(null);
    setAnalyzingMsg('');
    setAddStep('pick');
    setShowAdd(true);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Зөвшөөрөл хэрэгтэй', 'Галерид хандах зөвшөөрөл олгоно уу.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.7,
      base64:     true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setPickedUri(asset.uri);
    setAddStep('analyzing');

    setAnalyzingMsg('🎨 Cartoon болгож байна...');
    const cartoonRes     = await convertToCartoonImage(asset.uri);
    const finalCartoonUri = cartoonRes.data?.uri ?? asset.uri;
    setCartoonUri(finalCartoonUri);

    setAnalyzingMsg('🤖 Claude AI шинжилж байна...');

    let analysisBase64 = asset.base64;
    if (finalCartoonUri !== asset.uri && finalCartoonUri?.startsWith('data:')) {
      const comma = finalCartoonUri.indexOf(',');
      if (comma !== -1) analysisBase64 = finalCartoonUri.slice(comma + 1);
    }

    const res = await analyzeClothingItem({
      imageBase64: analysisBase64,
      mimeType:    'image/jpeg',
    });

    if (res.success) {
      const data = res.data;
      setAiResult(data);
      setEditType(data.type);
      setEditColor(data.color);
      setEditBrand(data.brand);
      const genUrl = generateClothingImageUrl({ type: data.type, color: data.color, style: data.style });
      setAiGenUrl(genUrl);
      setAddStep('confirm');
    } else {
      Alert.alert('Алдаа', 'AI шинжилгээ амжилтгүй боллоо. Дахин оролдоно уу.');
      setAddStep('pick');
    }
  }

  function saveItem() {
    const type  = editType  || aiResult?.type  || 'Other';
    const color = editColor || aiResult?.color || 'Unknown';
    const style = aiResult?.style || 'Casual';
    const newItem: WardrobeItemType = {
      id:           `item_${Date.now()}`,
      type,
      color,
      brand:        editBrand || aiResult?.brand    || 'Unknown',
      style,
      category:     aiResult?.category || 'Tops',
      layer:        aiResult?.layer    || 'Base Layer',
      image_url:    cartoonUri || aiGenUrl || pickedUri || '',
      original_uri: pickedUri || '',
    };
    addItem(newItem);
    setShowAdd(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

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
          <CustomButton label="+ Нэмэх" onPress={openAdd} variant="primary" size="sm" />
        </View>
      </View>

      <View style={styles.countBar}>
        <Text style={styles.countText}>
          <Text style={styles.countNum}>{filtered.length}</Text> хувцас
          {activeFilter !== 'all' && ` · ${FILTER_TABS.find(t => t.key === activeFilter)?.label}`}
        </Text>
        {selectedIds.length > 0 && (
          <Text style={styles.selectedCount}>{selectedIds.length} сонгогдсон</Text>
        )}
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Хувцас, брэнд хайх..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClearBtn}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FilterBar
        layerTabs={LAYER_TABS}   layerCounts={layerCounts}
        activeLayer={activeLayer} onLayerChange={setActiveLayer}
        filterTabs={FILTER_TABS}  categoryCounts={categoryCounts}
        activeFilter={activeFilter} onFilterChange={setActiveFilter}
      />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          viewMode === 'grid'
            ? <WardrobeItem item={item} onPress={toggleSelect} selected={selectedIds.includes(item.id)} />
            : <ListRow      item={item} onPress={toggleSelect} selected={selectedIds.includes(item.id)} />
        }
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
                onPress={openAdd}
                variant="primary" size="sm"
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        }
      />

      {selectedIds.length > 0 && (
        <View style={styles.actionBar}>
          <View style={styles.actionBarLeft}>
            <Text style={styles.actionCount}>{selectedIds.length}</Text>
            <Text style={styles.actionCountLabel}> хувцас сонгогдсон</Text>
          </View>
          <View style={styles.actionBtns}>
            <CustomButton label="Цуцлах" onPress={() => setSelectedIds([])} variant="dark" size="sm"
              style={{ marginRight: spacing.sm }} />
            <CustomButton
              label="Аватарт нэмэх →"
              onPress={() => navigation.navigate('Avatar', { selectedIds })}
              variant="primary" size="sm"
            />
          </View>
        </View>
      )}

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => addStep !== 'analyzing' && setShowAdd(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>✨  AI Хувцас нэмэх</Text>

          {addStep === 'pick' && (
            <View style={styles.pickBox}>
              <Text style={styles.pickHint}>
                Зургаас таних тул хувцасаа тодорхой харагдуулж авна уу
              </Text>
              <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
                <Text style={styles.pickBtnIcon}>📷</Text>
                <Text style={styles.pickBtnTx}>Галлереас зураг сонгох</Text>
              </TouchableOpacity>
            </View>
          )}

          {addStep === 'analyzing' && (
            <View style={styles.analyzingBox}>
              {pickedUri && (
                <Image source={{ uri: pickedUri }} style={styles.previewImg} resizeMode="cover" />
              )}
              <View style={styles.analyzingRow}>
                <ActivityIndicator color={ACCENT} size="small" />
                <Text style={styles.analyzingTx}>{analyzingMsg || 'Боловсруулж байна...'}</Text>
              </View>
            </View>
          )}

          {addStep === 'confirm' && aiResult && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmImgRow}>
                  {(cartoonUri || aiGenUrl) && (
                    <View style={styles.confirmImgWrap}>
                      <Image
                        source={{ uri: (cartoonUri || aiGenUrl) as string }}
                        style={styles.confirmImg}
                        resizeMode="cover"
                        onError={() => setCartoonUri(null)}
                      />
                      <Text style={styles.confirmImgLabel}>
                        {cartoonUri && cartoonUri !== pickedUri ? '🎨 Cartoon' : '✨ AI зураг'}
                      </Text>
                    </View>
                  )}
                  {pickedUri && (
                    <View style={styles.confirmImgWrap}>
                      <Image source={{ uri: pickedUri }} style={styles.confirmImg} resizeMode="cover" />
                      <Text style={styles.confirmImgLabel}>📷 Таны зураг</Text>
                    </View>
                  )}
                </View>
                <View style={styles.confirmBadges}>
                  <View style={[styles.layerBadge, { borderColor: LAYER_ACCENT[aiResult.layer] ?? ACCENT }]}>
                    <Text style={[styles.layerBadgeTx, { color: LAYER_ACCENT[aiResult.layer] ?? ACCENT }]}>
                      {aiResult.layer}
                    </Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeTx}>{aiResult.category}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fields}>
                <Field label="Төрөл"  value={editType}  onChange={setEditType}  />
                <Field label="Өнгө"   value={editColor} onChange={setEditColor} />
                <Field label="Брэнд"  value={editBrand} onChange={setEditBrand} />
                <View style={styles.staticRow}>
                  <Text style={styles.staticLabel}>Загвар</Text>
                  <Text style={styles.staticValue}>{aiResult.style}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
                <Text style={styles.saveBtnTx}>✓  Хадгалах</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface FieldProps { label: string; value: string; onChange: (v: string) => void; }
function Field({ label, value, onChange }: FieldProps) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#44445a"
      />
    </View>
  );
}

interface ListRowProps { item: WardrobeItemType; onPress: (item: WardrobeItemType) => void; selected: boolean; }
function ListRow({ item, onPress, selected }: ListRowProps) {
  const ITEM_ART: Record<string, string> = {
    'T-Shirt': '👕', 'Hoodie': '🧥', 'Puffer Jacket': '🥼',
    'Cargo Pants': '👖', 'Snow Boots': '🥾', 'Beanie': '🧢',
    'Denim Jacket': '🧥', 'Jogger Pants': '👖', 'Sneakers': '👟', 'Turtleneck': '👕',
  };
  const MN: Record<string, string> = {
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
        {item.image_url && item.image_url.startsWith('file') ? (
          <Image source={{ uri: item.image_url }} style={styles.listThumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.listThumbEmoji}>{ITEM_ART[item.type] ?? '🧺'}</Text>
        )}
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

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerSub:       { ...typography.label, color: colors.textMuted },
  headerTitle:     { ...typography.h1,   color: colors.text },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewToggle:      { width: 36, height: 36, backgroundColor: colors.card, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  viewToggleText:  { color: colors.text, fontSize: 18 },

  countBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  countText:     { ...typography.body, color: colors.textMuted },
  countNum:      { color: colors.text, fontWeight: '700' },
  selectedCount: { ...typography.label, color: colors.accent },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  searchIcon:     { fontSize: 15 },
  searchInput:    { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm + 2 },
  searchClearBtn: { padding: spacing.xs },
  searchClear:    { color: colors.textMuted, fontSize: 14 },

  grid:    { paddingHorizontal: spacing.md, paddingBottom: 140 },
  gridRow: { justifyContent: 'space-between' },

  listRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden', gap: spacing.md, paddingRight: spacing.md },
  listRowSelected: { borderColor: colors.accent },
  listThumb:       { width: 72, height: 72, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  listThumbEmoji:  { fontSize: 36 },
  listThumbImg:    { width: 72, height: 72 },
  listMeta:        { flex: 1 },
  listMnName:      { ...typography.h4, color: colors.text },
  listBrand:       { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  listLayer:       { ...typography.label,   color: colors.textMuted, marginTop: 4 },
  listCheck:       { fontSize: 20, color: colors.border },
  listCheckActive: { color: colors.accent, fontWeight: '900' },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  emptyText:  { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  actionBar:      { position: 'absolute', bottom: 96, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, shadowColor: colors.accent, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 16 },
  actionBarLeft:  { flexDirection: 'row', alignItems: 'baseline' },
  actionCount:    { ...typography.h2, color: colors.accent },
  actionCountLabel:{ ...typography.body, color: colors.textMuted },
  actionBtns:     { flexDirection: 'row' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22, paddingBottom: 40,
    borderTopWidth: 1, borderColor: BORDER,
    maxHeight: '85%',
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#303055', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 17, fontWeight: '800', color: '#e8e8f0', marginBottom: 18 },

  pickBox:     { alignItems: 'center', gap: 16, paddingVertical: 20 },
  pickHint:    { fontSize: 13, color: '#6868a0', textAlign: 'center', lineHeight: 20 },
  pickBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  pickBtnIcon: { fontSize: 22 },
  pickBtnTx:   { fontSize: 15, fontWeight: '800', color: '#fff' },

  analyzingBox:  { alignItems: 'center', gap: 16 },
  previewImg:    { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#0f0f1a' },
  analyzingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyzingTx:   { fontSize: 14, color: '#9090c0', fontWeight: '600' },

  confirmHeader:   { marginBottom: 16 },
  confirmImgRow:   { flexDirection: 'row', gap: 10, marginBottom: 10 },
  confirmImgWrap:  { flex: 1, gap: 4 },
  confirmImg:      { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#0f0f1a' },
  confirmImgLabel: { fontSize: 10, color: '#6868a0', textAlign: 'center', fontWeight: '600' },
  confirmBadges: { flexDirection: 'row', gap: 8 },
  layerBadge:    { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  layerBadgeTx:  { fontSize: 11, fontWeight: '700' },
  categoryBadge: { borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 4 },
  categoryBadgeTx:{ fontSize: 11, color: '#9090c0', fontWeight: '600' },

  fields:      { gap: 10, marginBottom: 20 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f1a', borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  fieldLabel:  { width: 52, fontSize: 11, fontWeight: '700', color: '#6868a0', textTransform: 'uppercase' },
  fieldInput:  { flex: 1, fontSize: 14, color: '#dde0ff', fontWeight: '600' },
  staticRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f1a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 10, opacity: 0.7 },
  staticLabel: { width: 52, fontSize: 11, fontWeight: '700', color: '#6868a0', textTransform: 'uppercase' },
  staticValue: { flex: 1, fontSize: 14, color: '#9090c0' },

  saveBtn:   { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnTx: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
