import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, Text,
} from 'react-native';
import { TextInput, Button, Chip, FAB } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutsStore } from '../store/workoutsStore';
import { COLORS, WEIGHT_UNITS } from '../utils/constants';
import { formatDate, getTodayString } from '../utils/formatters';
import { Workout } from '../types';
import WorkoutCard from '../components/WorkoutCard';

const { width: SCREEN_W } = Dimensions.get('window');

const CHART_CFG = {
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  color: () => COLORS.accent,
  labelColor: () => COLORS.textSecondary,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.accent },
  decimalPlaces: 1,
};

export default function WorkoutsScreen() {
  const { workouts, personalRecords, addWorkout, deleteWorkout } = useWorkoutsStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [chartExercise, setChartExercise] = useState<string | null>(null);

  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [notes, setNotes] = useState('');

  const today = getTodayString();

  const openAdd = () => {
    setExerciseName('');
    setSets('3');
    setReps('10');
    setWeight('0');
    setWeightUnit('kg');
    setNotes('');
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
      date: today,
      notes: notes.trim(),
    });
    setModalVisible(false);
  };

  const groupedByDate = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const d = w.date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(w);
    return acc;
  }, {});

  const dateGroups = Object.entries(groupedByDate).sort(([a], [b]) => b.localeCompare(a));

  // Weight progression chart for selected exercise
  const exerciseHistory = chartExercise
    ? workouts
        .filter(w => w.exerciseName.toLowerCase() === chartExercise.toLowerCase() && w.weight > 0)
        .slice(0, 8)
        .reverse()
    : [];

  const uniqueExercises = [...new Set(workouts.map(w => w.exerciseName))].slice(0, 8);

  const chartData = exerciseHistory.length >= 2
    ? {
        labels: exerciseHistory.map(w => w.date.slice(5)), // MM-DD
        datasets: [{ data: exerciseHistory.map(w => w.weight) }],
      }
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* PR Banner */}
        {Object.keys(personalRecords).length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>🏆 Records personales</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(personalRecords).map(([name, maxWeight]) => (
                <View key={name} style={styles.prCard}>
                  <Text style={styles.prName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.prWeight}>{maxWeight} kg</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Progress chart */}
        {uniqueExercises.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Progresión de peso</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
              {uniqueExercises.map(ex => (
                <Chip
                  key={ex}
                  selected={chartExercise === ex}
                  onPress={() => setChartExercise(chartExercise === ex ? null : ex)}
                  selectedColor={COLORS.accent}
                  compact
                  style={{ marginRight: 6 }}
                >
                  {ex}
                </Chip>
              ))}
            </ScrollView>
            {chartData ? (
              <LineChart
                data={chartData}
                width={SCREEN_W - 32}
                height={160}
                chartConfig={CHART_CFG}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
              />
            ) : chartExercise ? (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>Necesitas al menos 2 registros con peso para ver el gráfico</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Workout log */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Historial</Text>
        {dateGroups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Sin entrenamientos registrados</Text>
            <Text style={styles.emptySub}>Toca + para añadir tu primer ejercicio</Text>
          </View>
        ) : (
          dateGroups.map(([date, items]) => (
            <View key={date} style={styles.group}>
              <Text style={styles.dateLabel}>
                {date === today ? '🏋️ Hoy' : formatDate(date)}
              </Text>
              {items.map(w => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  onDelete={deleteWorkout}
                  isPR={w.weight > 0 && w.weight >= (personalRecords[w.exerciseName] || 0) && w.weight > 0}
                />
              ))}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
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
                    onPress={() => setWeightUnit(u as 'kg' | 'lbs')}
                    selectedColor={COLORS.accent}
                    compact
                  >
                    {u}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label="Notas"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              placeholder="Ej: Buen día, aumenté 5kg..."
            />

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleSave} buttonColor={COLORS.primary}>Guardar</Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  prSection: { marginBottom: 16 },
  prCard: {
    backgroundColor: '#FF980015',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF980030',
  },
  prName: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  prWeight: { fontSize: 18, fontWeight: '800', color: '#FF9800', marginTop: 4 },
  chartSection: { marginBottom: 16 },
  exerciseScroll: { marginBottom: 10 },
  chart: { borderRadius: 12, marginTop: 4 },
  chartEmpty: { padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, alignItems: 'center' },
  chartEmptyText: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
  group: { marginBottom: 16 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 50, gap: 10 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
