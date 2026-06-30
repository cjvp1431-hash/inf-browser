import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Text, TextInput, Button, Surface, FAB, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutsStore } from '../store/workoutsStore';
import { COLORS, WEIGHT_UNITS } from '../utils/constants';
import { formatDate, getTodayString } from '../utils/formatters';
import { Workout } from '../database/database';

export default function WorkoutsScreen() {
  const { workouts, addWorkout, deleteWorkout } = useWorkoutsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [weightUnit, setWeightUnit] = useState('kg');

  const openAdd = () => {
    setExerciseName('');
    setSets('3');
    setReps('10');
    setWeight('0');
    setWeightUnit('kg');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!exerciseName.trim()) return;
    await addWorkout({
      exerciseName: exerciseName.trim(),
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 10,
      weight: parseFloat(weight) || 0,
      weightUnit,
      date: getTodayString(),
    });
    setModalVisible(false);
  };

  const groupedByDate = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const date = w.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(w);
    return acc;
  }, {});

  const dateGroups = Object.entries(groupedByDate).sort(([a], [b]) => b.localeCompare(a));

  const renderItem = ({ item }: { item: [string, Workout[]] }) => {
    const [date, items] = item;
    const isToday = date === getTodayString();
    return (
      <View style={styles.group}>
        <Text style={styles.dateLabel}>
          {isToday ? 'Hoy' : formatDate(date)}
        </Text>
        {items.map(w => (
          <Surface key={w.id} style={styles.workoutCard} elevation={1}>
            <View style={styles.workoutIcon}>
              <Ionicons name="barbell" size={22} color={COLORS.accent} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={styles.exerciseName}>{w.exerciseName}</Text>
              <View style={styles.workoutMeta}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaLabel}>Series</Text>
                  <Text style={styles.metaValue}>{w.sets}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaLabel}>Reps</Text>
                  <Text style={styles.metaValue}>{w.reps}</Text>
                </View>
                {w.weight > 0 && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaLabel}>Peso</Text>
                    <Text style={styles.metaValue}>{w.weight}{w.weightUnit}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteWorkout(w.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </Surface>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {workouts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={70} color={COLORS.border} />
          <Text style={styles.emptyText}>Sin entrenamientos registrados</Text>
          <Text style={styles.emptySubtext}>Toca + para añadir tu primer ejercicio</Text>
        </View>
      ) : (
        <FlatList
          data={dateGroups}
          keyExtractor={([date]) => date}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Registrar Ejercicio</Text>

            <TextInput
              label="Ejercicio *"
              value={exerciseName}
              onChangeText={setExerciseName}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              placeholder="Ej: Press de banca, Sentadilla..."
            />

            <View style={styles.row}>
              <TextInput
                label="Series"
                value={sets}
                onChangeText={setSets}
                style={[styles.input, styles.flex1]}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.accent}
                keyboardType="numeric"
              />
              <TextInput
                label="Reps"
                value={reps}
                onChangeText={setReps}
                style={[styles.input, styles.flex1]}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.accent}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label="Peso"
                value={weight}
                onChangeText={setWeight}
                style={[styles.input, styles.flex1]}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.accent}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitRow}>
                {WEIGHT_UNITS.map(u => (
                  <Chip
                    key={u}
                    selected={weightUnit === u}
                    onPress={() => setWeightUnit(u)}
                    selectedColor={COLORS.accent}
                    compact
                  >
                    {u}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleSave} buttonColor={COLORS.primary}>Guardar</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, paddingBottom: 100 },
  group: { marginBottom: 16 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  workoutMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metaBadge: { backgroundColor: COLORS.surfaceDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center' },
  metaLabel: { fontSize: 10, color: COLORS.textSecondary },
  metaValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  deleteBtn: { padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
