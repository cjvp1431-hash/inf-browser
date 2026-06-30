import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useWorkoutsStore } from '../store/workoutsStore';
import { useFinanceStore } from '../store/financeStore';
import { useStudiesStore } from '../store/studiesStore';
import { getSimulatedEvents } from '../services/googleCalendarService';
import { COLORS } from '../utils/constants';
import { getGreeting, formatDuration, getTodayString, formatCurrency } from '../utils/formatters';
import TaskCard from '../components/TaskCard';

interface Props { navigation: any }

export default function HomeScreen({ navigation }: Props) {
  const { tasks, setStatus, deleteTask, todayPendingCount, completedTodayCount } = useTasksStore();
  const { habits, checkedTodayCount, monthlyCompletionRate } = useHabitsStore();
  const { workouts, todayCount: workoutsTodayCount } = useWorkoutsStore();
  const { accounts, selectedAccountId, monthlySpend } = useFinanceStore();
  const { todayMinutes } = useStudiesStore();

  const today = getTodayString();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const pendingToday = tasks.filter(t => t.status !== 'completed' && t.dueDate?.startsWith(today));
  const calEvents = getSimulatedEvents().slice(0, 3);
  const totalMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const summaryItems = [
    { icon: 'checkmark-circle', label: 'Tareas', value: `${completedTodayCount()}/${pendingToday.length + completedTodayCount()}`, sub: 'hoy', color: '#4CAF50', screen: 'Tasks' },
    { icon: 'flame', label: 'Hábitos', value: `${checkedTodayCount()}/${habits.length}`, sub: `${monthlyCompletionRate()}% mes`, color: '#FF9800', screen: 'Habits' },
    { icon: 'barbell', label: 'Gym', value: String(workoutsTodayCount()), sub: 'ejercicios hoy', color: COLORS.accent, screen: 'Workouts' },
    { icon: 'book', label: 'Estudio', value: formatDuration(todayMinutes()), sub: 'hoy', color: '#9C27B0', screen: 'Studies' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}><Text style={styles.logoLetter}>R</Text></View>
          <Text style={styles.appName}>RIMU</Text>
        </View>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.date}>{dateStr}</Text>

        {/* Financial summary */}
        {selectedAccount && (
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>{selectedAccount.name}</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
              </Text>
            </View>
            <View style={styles.spendSummary}>
              <Text style={styles.spendLabel}>Gastos del mes</Text>
              <Text style={styles.spendAmount}>
                {formatCurrency(totalMonthlySpend, selectedAccount.currency)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <Text style={styles.sectionTitle}>Resumen del día</Text>
      <View style={styles.grid}>
        {summaryItems.map(item => (
          <TouchableOpacity key={item.label} style={styles.statCardWrap} onPress={() => navigation.navigate(item.screen)}>
            <Surface style={styles.statCard} elevation={1}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statSub}>{item.sub}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.quickRow}>
        {[
          { icon: 'add-circle', label: 'Tarea', color: COLORS.accent, screen: 'Tasks' },
          { icon: 'cash', label: 'Gasto', color: '#4CAF50', screen: 'Finance' },
          { icon: 'barbell', label: 'Ejercicio', color: '#2196F3', screen: 'Workouts' },
          { icon: 'chatbubble-ellipses', label: 'RIMU Bot', color: '#25D366', screen: 'WhatsApp' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.quickAction} onPress={() => navigation.navigate(a.screen, { autoOpen: true })}>
            <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon as any} size={26} color={a.color} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pending tasks */}
      {pendingToday.length > 0 && (
        <>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>Tareas de hoy</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAll}>Ver todas →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.taskList}>
            {pendingToday.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                compact
                onPress={() => navigation.navigate('Tasks')}
                onStatusChange={setStatus}
                onDelete={deleteTask}
              />
            ))}
          </View>
        </>
      )}

      {/* Calendar events */}
      <View style={styles.rowHeader}>
        <Text style={styles.sectionTitle}>Próximos eventos</Text>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
      </View>
      {calEvents.map(ev => (
        <View key={ev.id} style={styles.calEvent}>
          <View style={[styles.calDot, { backgroundColor: ev.color }]} />
          <View style={styles.calInfo}>
            <Text style={styles.calTitle}>{ev.title}</Text>
            <Text style={styles.calMeta}>{ev.date} · {ev.time}{ev.location ? ` · ${ev.location}` : ''}</Text>
          </View>
        </View>
      ))}

      {/* Habit streaks */}
      {habits.filter(h => h.currentStreak > 0).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Rachas activas 🔥</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.streakScroll}>
            {habits.filter(h => h.currentStreak > 0).map(h => (
              <TouchableOpacity key={h.id} style={styles.streakCard} onPress={() => navigation.navigate('Habits')}>
                <Text style={styles.streakNum}>{h.currentStreak}</Text>
                <Ionicons name="flame" size={16} color={COLORS.accent} />
                <Text style={styles.streakName} numberOfLines={2}>{h.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { fontWeight: '900', fontSize: 20, color: '#000' },
  appName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 5 },
  greeting: { color: COLORS.accent, fontSize: 26, fontWeight: '700' },
  date: { color: '#888', fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff15',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  balanceLabel: { color: '#aaa', fontSize: 12 },
  balanceAmount: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  spendSummary: { alignItems: 'flex-end' },
  spendLabel: { color: '#aaa', fontSize: 12 },
  spendAmount: { color: COLORS.error, fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCardWrap: { width: '47%' },
  statCard: { padding: 14, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  statSub: { fontSize: 11, color: COLORS.textSecondary },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16 },
  quickAction: { alignItems: 'center', gap: 6 },
  quickIcon: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  seeAll: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  taskList: { paddingHorizontal: 16 },
  calEvent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.surface, padding: 12, borderRadius: 12 },
  calDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  calInfo: { flex: 1 },
  calTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  calMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  streakScroll: { paddingLeft: 16 },
  streakCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginRight: 10, alignItems: 'center', width: 90, gap: 4 },
  streakNum: { fontSize: 26, fontWeight: '900', color: COLORS.accent },
  streakName: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
});
