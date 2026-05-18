import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  Animated, ActivityIndicator, View,
} from 'react-native';
import { colors, spacing, borderRadius } from '../utils/theme';

export default function CustomButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
  }

  const isDisabled = disabled || loading;
  const loaderColor = variant === 'primary' ? colors.black : colors.accent;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <TouchableOpacity
        onPress={isDisabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.88}
        style={[
          styles.base,
          styles[`variant_${variant}`],
          styles[`size_${size}`],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSz_${size}`]]}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginRight: spacing.sm },

  // — Variants —
  variant_primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  variant_dark: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_danger: {
    backgroundColor: colors.error,
  },

  // — Sizes —
  size_sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, minHeight: 36 },
  size_md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg,  minHeight: 48 },
  size_lg: { paddingVertical: spacing.md,     paddingHorizontal: spacing.xl,  minHeight: 56 },

  disabled: { opacity: 0.35 },

  // — Labels —
  label: { fontWeight: '800', letterSpacing: 0.4 },
  label_primary: { color: colors.black },
  label_ghost:   { color: colors.accent },
  label_dark:    { color: colors.text },
  label_danger:  { color: colors.black },

  labelSz_sm: { fontSize: 12 },
  labelSz_md: { fontSize: 14 },
  labelSz_lg: { fontSize: 16, letterSpacing: 0.6 },
});
