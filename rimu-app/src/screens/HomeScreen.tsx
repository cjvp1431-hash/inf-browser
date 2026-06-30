import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useWorkoutsStore } from '../store/workoutsStore';
import { useStudiesStore } from '../store/studiesStore';
import { COLORS } from '../utils/constants';
import { getGreeting, formatDuration, getTodayString } from '../utils/formatters';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { tasks, todayCount, completedTodayCount } = useTasksStore();
  const { habits, checkedTodayCount } = useHabitsStore();
  const { workouts, todayCount: workoutsTodayCount } = useWorkoutsStore();
  const { sessions, todayMinutes } = useStudiesStore();

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const summaryCards = [
    {
      icon: 'checkmark-circle-outline',
      label: 'Tareas',
      value: `${completedTodayCount()}/${tasks.filter(t => t.dueDate?.startsWith(getTodayString())).length + completedTodayCount()}`,
      subtitle: 'completadas hoy',
      color: '#4CAF50',
      screen: 'Tasks',
    },
    {
      icon: 'flame-outline',
      label: 'Hábitos',
      value: `${checkedTodayCount()}/${habits.length}`,
      subtitle: 'check-ins hoy',
      color: '#FF9800',
      screen: 'Habits',
    },
    {
      icon: 'barbell-outline',
      label: 'Entrenamientos',
      value: String(workoutsTodayCount()),
      subtitle: 'ejercicios hoy',
      color: '#2196F3',
      screen: 'Workouts',
    },
    {
      icon: 'book-outline',
      label: 'Estudio',
      value: formatDuration(todayMinutes()),
      subtitle: 'estudiados hoy',
      color: '#9C27B0',
      screen: 'Studies',
    },
  ];

  const quickActions = [
    { icon: 'add-circle', label: 'Tarea', color: COLORS.accent, screen: 'Tasks', action: 'add' },
    { icon: 'flame', label: 'Hábito', color: '#FF9800', screen: 'Habits', action: 'add' },
    { icon: 'cash', label: 'Gasto', color: '#4CAF50', screen: 'Finance', action: 'add' },
    { icon: 'barbell', label: 'Ejercicio', color: '#2196F3', screen: 'Workouts', action: 'add' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.appName}>RIMU</Text>
        </View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {/* Summary Grid */}
      <Text style={styles.sectionTitle}>Resumen del día</Text>
      <View style={styles.grid}>
        {summaryCards.map((card) => (
          <TouchableOpacity
            key={card.label}
            style={styles.cardWrapper}
            onPress={() => navigation.navigate(card.screen)}
          >
            <Surface style={styles.summaryCard} elevation={1}>
              <Ionicons name={card.icon as any} size={24} color={card.color} />
              <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionBtn}
            onPress={() => navigation.navigate(action.screen, { autoOpen: true })}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={26} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pending Tasks Preview */}
      {tasks.filter(t => t.status === 'pending').length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tareas pendientes</Text>
          {tasks.filter(t => t.status === 'pending').slice(0, 3).map(task => (
            <Surface key={task.id} style={styles.taskItem} elevation={1}>
              <Ionicons name="ellipse-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskCategory}>{task.category}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </Surface>
          ))}
        </>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: { color: '#000', fontWeight: '900', fontSize: 18 },
  appName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 4 },
  greeting: { color: COLORS.accent, fontSize: 28, fontWeight: '700', marginTop: 8 },
  date: { color: '#aaa', fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  cardWrapper: { width: '47%' },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 4,
  },
  cardValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  taskCategory: { fontSize: 12, color: COLORS.textSecondary },
  bottomPad: { height: 100 },
});
