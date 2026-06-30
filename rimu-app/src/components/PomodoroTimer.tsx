import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, POMODORO_DURATION, SHORT_BREAK } from '../utils/constants';
import { formatTimerSeconds } from '../utils/formatters';

type TimerMode = 'focus' | 'break';

interface Props {
  isRunning: boolean;
  mode: TimerMode;
  secondsLeft: number;
  pomodoroCount: number;
  elapsedFocusSecs: number;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export default function PomodoroTimer({
  isRunning,
  mode,
  secondsLeft,
  pomodoroCount,
  elapsedFocusSecs,
  onToggle,
  onSkip,
  onReset,
}: Props) {
  const total = mode === 'focus' ? POMODORO_DURATION : SHORT_BREAK;
  const progress = 1 - secondsLeft / total;
  const accentColor = mode === 'focus' ? COLORS.accent : COLORS.success;

  return (
    <View style={styles.container}>
      <Text style={styles.modeLabel}>{mode === 'focus' ? '🎯 Enfoque' : '☕ Descanso'}</Text>

      <View style={[styles.circle, { borderColor: accentColor }]}>
        <Text style={styles.timeText}>{formatTimerSeconds(secondsLeft)}</Text>
        <Text style={styles.modeSubText}>{mode === 'focus' ? '25 min' : '5 min'}</Text>
      </View>

      <ProgressBar
        progress={progress}
        color={accentColor}
        style={styles.bar}
      />

      <View style={styles.infoRow}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoLabel}>🍅</Text>
          <Text style={styles.infoValue}>{pomodoroCount}</Text>
        </View>
        <View style={styles.infoBadge}>
          <Text style={styles.infoLabel}>⏱</Text>
          <Text style={styles.infoValue}>{Math.round(elapsedFocusSecs / 60)}min</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.sideBtn} onPress={onReset}>
          <Ionicons name="refresh" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.playBtn, { backgroundColor: accentColor }]} onPress={onToggle}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={30} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={onSkip}>
          <Ionicons name="play-skip-forward" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  modeLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  timeText: { fontSize: 48, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  modeSubText: { fontSize: 12, color: COLORS.textSecondary },
  bar: { height: 6, borderRadius: 3, width: 220 },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  sideBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
});
