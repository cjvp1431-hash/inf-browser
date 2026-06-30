import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform, Text,
} from 'react-native';
import { TextInput, Button, Chip, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useHabitsStore } from '../store/habitsStore';
import { COLORS } from '../utils/constants';
import { getTodayString } from '../utils/formatters';
import { Habit } from '../types';
import HabitCard from '../components/HabitCard';

const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const FREQ_LABELS: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' };

const LAST_30_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().split('T')[0];
});

export default function HabitsScreen() {
  const { habits, addHabit, checkIn, deleteHabit, checkedTodayCount, monthlyCompletionRate } = useHabitsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarModal, setCalendarModal] = useState(false);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<string>('daily');
  const today = getTodayString();

  const openAdd = () => {
    setTitle('');
    setFrequency('daily');
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addHabit({ title: title.trim(), frequency });
    setModalVisible(false);
  };

  const openCalendar = (habit: Habit) => {
    setSelectedHabit(habit);
    setCalendarModal(true);
  };

  const checkedToday = checkedTodayCount();
  const rate = monthlyCompletionRate();

  return (
    <View style={styles.container}>
      {/* Stats header */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{checkedToday}/{habits.length}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: rate >= 80 ? COLORS.success : rate >= 50 ? COLORS.warning : COLORS.error }]}>
            {rate}%
          </Text>
          <Text style={styles.statLabel}>Mes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{habits.filter(h => h.currentStreak > 0).length}</Text>
          <Text style={styles.statLabel}>Con racha 🔥</Text>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onCheckIn={checkIn}
            onDelete={deleteHabit}
            onPress={() => openCalendar(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Agrega tu primer hábito</Text>
            <Text style={styles.emptySub}>Construye rutinas poderosas día a día</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nuevo Hábito</Text>

            <TextInput
              label="Nombre del hábito *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <Text style={styles.fieldLabel}>Frecuencia</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map(f => (
                <Chip
                  key={f}
                  selected={frequency === f}
                  onPress={() => setFrequency(f)}
                  selectedColor={COLORS.accent}
                  compact
                  style={{ marginRight: 6 }}
                >
                  {FREQ_LABELS[f]}
                </Chip>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAdd} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Calendar / Detail Modal */}
      <Modal visible={calendarModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
            <Text style={styles.calSub}>{FREQ_LABELS[selectedHabit?.frequency ?? 'daily']} · Últimos 30 días</Text>

            <View style={styles.calGrid}>
              {LAST_30_DAYS.map(day => {
                const done = selectedHabit?.completedDates.includes(day);
                const label = day.split('-')[2];
                return (
                  <View
                    key={day}
                    style={[styles.calDay, done && styles.calDayDone, day === today && styles.calDayToday]}
                  >
                    <Text style={[styles.calDayText, done && styles.calDayTextDone]}>{label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.calStats}>
              <View style={styles.calStat}>
                <Ionicons name="flame" size={22} color={COLORS.accent} />
                <Text style={styles.calStatNum}>{selectedHabit?.currentStreak}</Text>
                <Text style={styles.calStatLabel}>Racha actual</Text>
              </View>
              <View style={styles.calStat}>
                <Ionicons name="trophy" size={22} color="#FF9800" />
                <Text style={styles.calStatNum}>{selectedHabit?.longestStreak}</Text>
                <Text style={styles.calStatLabel}>Récord</Text>
              </View>
              <View style={styles.calStat}>
                <Ionicons name="checkmark-done" size={22} color={COLORS.success} />
                <Text style={styles.calStatNum}>{selectedHabit?.completedDates.length}</Text>
                <Text style={styles.calStatLabel}>Total días</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={() => setCalendarModal(false)}
              buttonColor={COLORS.primary}
              style={{ marginTop: 8 }}
            >
              Cerrar
            </Button>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 3 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#333' },
  list: { padding: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600' },
  emptySub: { color: COLORS.textSecondary, fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 50, gap: 10 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  calSub: { fontSize: 13, color: COLORS.textSecondary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  calDay: { width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  calDayDone: { backgroundColor: COLORS.accent },
  calDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  calDayText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  calDayTextDone: { color: '#000', fontWeight: '700' },
  calStats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  calStat: { alignItems: 'center', gap: 4 },
  calStatNum: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  calStatLabel: { fontSize: 11, color: COLORS.textSecondary },
});
