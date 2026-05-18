import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, borderRadius, typography } from './src/utils/theme';

import HomeScreen     from './src/screens/HomeScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import AvatarScreen   from './src/screens/AvatarScreen';
import StylistScreen  from './src/screens/StylistScreen';

const Tab       = createBottomTabNavigator();
const RootStack = createStackNavigator();

const TABS = [
  { name: 'Home',     label: 'Нүүр',   icon: '◈', activeIcon: '◈' },
  { name: 'Wardrobe', label: 'Хувцас', icon: '▣', activeIcon: '▣' },
  { name: 'Avatar',   label: 'Аватар', icon: '○', activeIcon: '●' },
  { name: 'Stylist',  label: 'Стайл',  icon: '✦', activeIcon: '✦' },
];

const SCREEN_MAP = {
  Home:     HomeScreen,
  Wardrobe: WardrobeScreen,
  Avatar:   AvatarScreen,
  Stylist:  StylistScreen,
};

function TabIcon({ name, focused }) {
  const tab = TABS.find((t) => t.name === name) ?? TABS[0];
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={[styles.tabGlyph, focused && styles.tabGlyphActive]}>
        {focused ? tab.activeIcon : tab.icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {tab.label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown:    false,
        tabBarShowLabel: false,
        tabBarStyle:    styles.tabBar,
        tabBarIcon:     ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={SCREEN_MAP[tab.name]} />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={MainTabs} />
        </RootStack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  tabBar: {
    backgroundColor: colors.card,
    borderTopColor:  colors.border,
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 82 : 66,
    paddingBottom:   Platform.OS === 'ios' ? 22 : 8,
    paddingTop:      8,
    shadowColor:     colors.accent,
    shadowOffset:    { width: 0, height: -6 },
    shadowOpacity:   0.12,
    shadowRadius:    18,
    elevation:       20,
  },
  tabIconWrap: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius:    borderRadius.full,
    gap:             3,
  },
  tabIconWrapActive: { backgroundColor: colors.accentAlpha },
  tabGlyph:          { fontSize: 18, color: colors.textMuted, fontWeight: '400' },
  tabGlyphActive:    { color: colors.accent, fontWeight: '800' },
  tabLabel: {
    ...typography.caption,
    color:        colors.textMuted,
    fontWeight:   '600',
    fontSize:     9,
    letterSpacing: 0.3,
  },
  tabLabelActive: { color: colors.accent, fontWeight: '800' },
});
