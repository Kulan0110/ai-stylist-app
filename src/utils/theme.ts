// GlowDark Design System — GlowStyle AI

import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#121212',
  card:        '#1E1E1E',
  surface:     '#242424',
  border:      '#2A2A2A',
  text:        '#FFFFFF',
  textOff:     '#E0E0E0',
  textMuted:   '#555555',
  accent:      '#A855F7',
  accentAlpha: 'rgba(168,85,247,0.12)',
  accentGlow:  'rgba(168,85,247,0.30)',
  black:       '#000000',
  overlay:     'rgba(0,0,0,0.80)',
  error:       '#F87171',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const typography: Record<string, TextStyle> = {
  h1:      { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2:      { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:      { fontSize: 18, fontWeight: '700' },
  h4:      { fontSize: 15, fontWeight: '600' },
  body:    { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 17 },
  label:   { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  mono:    { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
};

export const borderRadius = {
  sm:   6,
  md:   12,
  lg:   18,
  xl:   26,
  full: 9999,
} as const;

export const shadows = {
  accentGlow: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;
