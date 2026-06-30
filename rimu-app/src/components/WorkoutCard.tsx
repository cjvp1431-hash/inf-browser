import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types';
import { COLORS } from '../utils/constants';

interface Props {
  workout: Workout;
  onDelete: (id: string) => void;
  isPR?: boolean;
}

export default function WorkoutCard({ workout, onDelete, isPR }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="barbell" size={20} color={COLORS.accent} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{workout.exerciseName}</Text>
          {isPR && (
            <View style={styles.prBadge}>
              <Text style={styles.prText}>🏆 PR</Text>
            </View>
          )}
        </View>
        <View style={styles.stats}>
          {[
            { label: 'Series', value: String(workout.sets) },
            { label: 'Reps', value: String(workout.reps) },
            workout.weight > 0 ? { label: 'Peso', value: `${workout.weight}${workout.weightUnit}` } : null,
          ].filter(Boolean).map((s) => (
            <View key={s!.label} style={styles.statBadge}>
              <Text style={styles.statLabel}>{s!.label}</Text>
              <Text style={styles.statValue}>{s!.value}</Text>
            </View>
          ))}
        </View>
        {workout.notes ? <Text style={styles.notes} numberOfLines={1}>{workout.notes}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(workout.id)} style={styles.delBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={17} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  prBadge: { backgroundColor: '#FF980020', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  prText: { fontSize: 10, fontWeight: '700', color: '#FF9800' },
  stats: { flexDirection: 'row', gap: 6, marginTop: 4 },
  statBadge: { backgroundColor: COLORS.surfaceDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center' },
  statLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  notes: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  delBtn: { padding: 6 },
});
