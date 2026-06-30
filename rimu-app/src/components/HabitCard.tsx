import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types';
import { COLORS } from '../utils/constants';
import { getTodayString } from '../utils/formatters';

interface Props {
  habit: Habit;
  onCheckIn: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: () => void;
}

const FREQ_LABELS: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' };

export default function HabitCard({ habit, onCheckIn, onDelete, onPress }: Props) {
  const today = getTodayString();
  const checkedToday = habit.completedDates.includes(today);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.top}>
        <View style={[styles.streakBadge, checkedToday && styles.streakBadgeActive]}>
          <Ionicons name="flame" size={14} color={checkedToday ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.streakNum, checkedToday && { color: COLORS.accent }]}>{habit.currentStreak}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{habit.title}</Text>
          <Text style={styles.freq}>{FREQ_LABELS[habit.frequency]} · Récord: {habit.longestStreak}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.checkBtn, checkedToday && styles.checkBtnDone]}
            onPress={() => !checkedToday && onCheckIn(habit.id)}
          >
            <Ionicons
              name={checkedToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={30}
              color={checkedToday ? COLORS.success : COLORS.border}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(habit.id)} style={styles.delBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini 7-day grid */}
      <View style={styles.miniGrid}>
        {last7.map(day => (
          <View
            key={day}
            style={[styles.miniDot, habit.completedDates.includes(day) && styles.miniDotDone, day === today && styles.miniDotToday]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 46,
    justifyContent: 'center',
  },
  streakBadgeActive: { backgroundColor: COLORS.accent + '25' },
  streakNum: { fontWeight: '800', fontSize: 14, color: COLORS.textSecondary },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  freq: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkBtn: { padding: 2 },
  checkBtnDone: { opacity: 0.8 },
  delBtn: { padding: 4 },
  miniGrid: { flexDirection: 'row', gap: 5 },
  miniDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceDark },
  miniDotDone: { backgroundColor: COLORS.accent },
  miniDotToday: { borderWidth: 1.5, borderColor: COLORS.primary },
});
