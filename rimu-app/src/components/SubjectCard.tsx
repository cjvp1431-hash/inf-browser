import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../types';
import { COLORS } from '../utils/constants';

interface Props {
  subject: Subject;
  hours: string;
  todayMins: number;
  onStartSession: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

export default function SubjectCard({ subject, hours, todayMins, onStartSession, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: subject.color }]} />
      <View style={styles.info}>
        <Text style={styles.name}>{subject.name}</Text>
        <View style={styles.stats}>
          <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{hours} total</Text>
          {todayMins > 0 && (
            <Text style={styles.todayText}> · {todayMins}min hoy</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.startBtn, { borderColor: subject.color }]}
        onPress={() => onStartSession(subject)}
      >
        <Ionicons name="play" size={16} color={subject.color} />
        <Text style={[styles.startText, { color: subject.color }]}>Iniciar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(subject.id)} style={styles.delBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  dot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  statText: { fontSize: 12, color: COLORS.textSecondary },
  todayText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  startText: { fontSize: 12, fontWeight: '700' },
  delBtn: { padding: 4 },
});
