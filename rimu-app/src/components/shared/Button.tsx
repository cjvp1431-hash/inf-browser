import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS } from '../../utils/constants';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg =
    variant === 'primary' ? COLORS.primary
    : variant === 'danger' ? COLORS.error
    : variant === 'ghost' ? 'transparent'
    : COLORS.surface;

  const textColor =
    variant === 'primary' ? '#fff'
    : variant === 'danger' ? '#fff'
    : variant === 'ghost' ? COLORS.textSecondary
    : COLORS.textPrimary;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.5 },
});
