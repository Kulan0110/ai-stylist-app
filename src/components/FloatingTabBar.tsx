import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const BRONZE      = '#9A7850';   // inactive icon + label
const LAVENDER    = '#C084FC';   // active label
const BAR_BG      = '#1A1A1A';   // floating bar background
const ICON_ACTIVE = '#18181B';   // icon color on white circle

interface TabConfig {
  label: string;
  icon: (c: string) => React.ReactElement;
  iconActive: (c: string) => React.ReactElement;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Home: {
    label: 'Home',
    icon:       (c) => <Ionicons name="home-outline"    size={22} color={c} />,
    iconActive: (c) => <Ionicons name="home"            size={22} color={c} />,
  },
  Wardrobe: {
    label: 'Clothes',
    icon:       (c) => <MaterialCommunityIcons name="hanger" size={24} color={c} />,
    iconActive: (c) => <MaterialCommunityIcons name="hanger" size={24} color={c} />,
  },
  Stylist: {
    label: 'Look',
    icon:       (c) => <Ionicons name="layers-outline"  size={22} color={c} />,
    iconActive: (c) => <Ionicons name="layers"          size={22} color={c} />,
  },
  Avatar: {
    label: 'Avatar',
    icon:       (c) => <Ionicons name="person-outline"  size={22} color={c} />,
    iconActive: (c) => <Ionicons name="person"          size={22} color={c} />,
  },
  Profile: {
    label: 'Profile',
    icon:       (c) => <Ionicons name="person-circle-outline" size={24} color={c} />,
    iconActive: (c) => <Ionicons name="person-circle"         size={24} color={c} />,
  },
};

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const cfg     = TAB_CONFIG[route.name];
          if (!cfg) return null;

          function handlePress() {
            const event = navigation.emit({
              type:             'tabPress',
              target:           route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={handlePress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={cfg.label}
            >
              {/* Icon — active: white circle, inactive: bronze bare */}
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                {focused
                  ? cfg.iconActive(ICON_ACTIVE)
                  : cfg.icon(BRONZE)
                }
              </View>

              {/* Label */}
              <Text style={[styles.label, focused && styles.labelActive]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:         'absolute',
    bottom:           0,
    left:             0,
    right:            0,
    alignItems:       'center',
    paddingHorizontal: 20,
    pointerEvents:    'box-none',
  } as any,

  bar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  BAR_BG,
    borderRadius:     40,
    paddingVertical:  10,
    paddingHorizontal: 6,
    width:            '100%',

    // Drop shadow
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.50,
    shadowRadius:  28,
    elevation:     28,

    // Subtle top border for glass feel
    borderWidth:   Platform.OS === 'ios' ? 0.5 : 0,
    borderColor:   'rgba(255,255,255,0.08)',
  },

  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap:            5,
  } as any,

  // Icon container
  iconCircle: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#FFFFFF',
    // Soft white glow
    shadowColor:     '#FFFFFF',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.30,
    shadowRadius:    10,
    elevation:       8,
  },

  // Labels
  label: {
    fontSize:      10,
    fontWeight:    '600',
    color:         BRONZE,
    letterSpacing: 0.2,
  },
  labelActive: {
    color:      LAVENDER,
    fontWeight: '700',
  },
});
