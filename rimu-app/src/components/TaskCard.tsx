import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../utils/constants';
import { formatDate } from '../utils/formatters';

interface Props {
  task: Task;
  onPress: () => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const STATUS_ICONS: Record<string, string> = {
  pending: 'ellipse-outline',
  in_progress: 'time-outline',
  completed: 'checkmark-circle',
  archived: 'archive-outline',
};

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.border,
  in_progress: '#FF9800',
  completed: COLORS.success,
  archived: COLORS.textSecondary,
};

export default function TaskCard({ task, onPress, onStatusChange, onDelete, compact }: Props) {
  const nextStatus: Task['status'] =
    task.status === 'pending' ? 'in_progress'
    : task.status === 'in_progress' ? 'completed'
    : 'pending';

  return (
    <View style={[styles.card, task.status === 'completed' && styles.completedCard]}>
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />

      <TouchableOpacity style={styles.checkbox} onPress={() => onStatusChange(task.id, nextStatus)}>
        <Ionicons
          name={STATUS_ICONS[task.status] as any}
          size={24}
          color={STATUS_COLORS[task.status]}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.body} onPress={onPress}>
        <Text style={[styles.title, task.status === 'completed' && styles.strikethrough]} numberOfLines={compact ? 1 : 2}>
          {task.title}
        </Text>
        {!compact && (
          <View style={styles.meta}>
            <View style={[styles.categoryBadge, { backgroundColor: PRIORITY_COLORS[task.priority] + '20' }]}>
              <Text style={[styles.categoryText, { color: PRIORITY_COLORS[task.priority] }]}>
                {PRIORITY_LABELS[task.priority]}
              </Text>
            </View>
            <Text style={styles.metaText}>{task.category}</Text>
            {task.dueDate ? <Text style={styles.metaText}>· {formatDate(task.dueDate)}</Text> : null}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
    marginBottom: 8,
    overflow: 'hidden',
  },
  completedCard: { opacity: 0.65 },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  checkbox: { padding: 12 },
  body: { flex: 1, paddingVertical: 12, paddingRight: 4 },
  title: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 20 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryText: { fontSize: 10, fontWeight: '700' },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
  deleteBtn: { padding: 12 },
});
