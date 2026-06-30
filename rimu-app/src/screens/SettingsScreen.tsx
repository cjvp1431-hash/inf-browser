import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';
import { Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { getDB } from '../database/database';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useWorkoutsStore } from '../store/workoutsStore';
import { useFinanceStore } from '../store/financeStore';
import { useStudiesStore } from '../store/studiesStore';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, iconColor, label, sublabel, onPress, right, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress && !right} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? COLORS.accent) + '20' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor ?? COLORS.accent} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: COLORS.error }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} /> : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [habitReminder, setHabitReminder] = useState(false);

  const loadTasks = useTasksStore(s => s.loadTasks);
  const loadHabits = useHabitsStore(s => s.loadHabits);
  const loadWorkouts = useWorkoutsStore(s => s.loadWorkouts);
  const loadFinance = useFinanceStore(s => s.loadAll);
  const loadStudies = useStudiesStore(s => s.loadAll);

  const showStorageInfo = async () => {
    try {
      const db = getDB();
      const tables = ['tasks', 'habits', 'workouts', 'accounts', 'transactions', 'budgets', 'subjects', 'studySessions'];
      const counts: string[] = [];
      for (const table of tables) {
        const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
        counts.push(`${table}: ${row?.count ?? 0} registros`);
      }
      Alert.alert('📦 Almacenamiento', counts.join('\n'));
    } catch {
      Alert.alert('Error', 'No se pudo leer el almacenamiento');
    }
  };

  const reloadAll = async () => {
    await Promise.all([loadTasks(), loadHabits(), loadWorkouts(), loadFinance(), loadStudies()]);
    Alert.alert('✅', 'Datos recargados desde la base de datos');
  };

  const resetData = () => {
    Alert.alert(
      '⚠️ Eliminar todos los datos',
      'Esta acción borrará TODAS tus tareas, hábitos, finanzas, entrenamientos y sesiones de estudio. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDB();
              const tables = ['tasks', 'habits', 'workouts', 'accounts', 'transactions', 'budgets', 'subjects', 'studySessions'];
              for (const t of tables) {
                await db.runAsync(`DELETE FROM ${t}`);
              }
              await Promise.all([loadTasks(), loadHabits(), loadWorkouts(), loadFinance(), loadStudies()]);
              Alert.alert('✅', 'Todos los datos han sido eliminados');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          },
        },
      ],
    );
  };

  const showAbout = () => {
    Alert.alert(
      'RIMU v2.0',
      'Tu asistente de productividad personal.\n\n' +
      '• Tareas con Kanban y Timeline\n' +
      '• Hábitos con rachas y calendario\n' +
      '• Entrenamiento con seguimiento de PR\n' +
      '• Finanzas con gráficos y presupuestos\n' +
      '• Estudio con Pomodoro y estadísticas\n' +
      '• Bot RIMU con comandos en español\n\n' +
      '100% offline · SQLite local',
      [{ text: 'Cerrar' }],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* App info card */}
      <View style={styles.appCard}>
        <View style={styles.appLogo}>
          <Text style={styles.appLogoText}>R</Text>
        </View>
        <View>
          <Text style={styles.appName}>RIMU</Text>
          <Text style={styles.appVersion}>v2.0 · Productividad personal</Text>
        </View>
      </View>

      {/* Data section */}
      <Text style={styles.sectionLabel}>Datos</Text>
      <View style={styles.section}>
        <SettingRow
          icon="server-outline"
          label="Ver almacenamiento"
          sublabel="Registros guardados en SQLite"
          onPress={showStorageInfo}
        />
        <View style={styles.separator} />
        <SettingRow
          icon="refresh-outline"
          iconColor="#2196F3"
          label="Recargar datos"
          sublabel="Sincroniza la vista con la BD"
          onPress={reloadAll}
        />
      </View>

      {/* Notifications section */}
      <Text style={styles.sectionLabel}>Notificaciones</Text>
      <View style={styles.section}>
        <SettingRow
          icon="alarm-outline"
          iconColor="#FF9800"
          label="Recordatorio de hábitos"
          sublabel="Diario a las 20:00"
          right={
            <Switch
              value={habitReminder}
              onValueChange={v => {
                setHabitReminder(v);
                if (v) {
                  Alert.alert('🔔', 'Recordatorio activado a las 20:00. Requiere notificaciones habilitadas en iOS.');
                }
              }}
              color={COLORS.accent}
            />
          }
        />
      </View>

      {/* Modules info */}
      <Text style={styles.sectionLabel}>Módulos activos</Text>
      <View style={styles.section}>
        {[
          { icon: 'checkmark-circle', color: '#4CAF50', label: 'Tareas', sub: 'Lista · Kanban · Timeline' },
          { icon: 'flame', color: '#FF9800', label: 'Hábitos', sub: 'Rachas · Calendario 30 días' },
          { icon: 'barbell', color: COLORS.accent, label: 'Gym', sub: 'PR · Gráfico de progresión' },
          { icon: 'cash', color: '#4CAF50', label: 'Finanzas', sub: 'Gráficos · Presupuestos · Cuotas' },
          { icon: 'book', color: '#9C27B0', label: 'Estudio', sub: 'Pomodoro · Materias · Sesiones' },
          { icon: 'chatbubble-ellipses', color: '#25D366', label: 'RIMU Bot', sub: 'NLP en español' },
        ].map((m, i, arr) => (
          <React.Fragment key={m.label}>
            <SettingRow icon={m.icon} iconColor={m.color} label={m.label} sublabel={m.sub} />
            {i < arr.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>Acerca de</Text>
      <View style={styles.section}>
        <SettingRow icon="information-circle-outline" label="Sobre RIMU" onPress={showAbout} />
        <View style={styles.separator} />
        <SettingRow
          icon="shield-checkmark-outline"
          iconColor={COLORS.success}
          label="Privacidad"
          sublabel="Todos los datos son locales, sin internet"
        />
      </View>

      {/* Danger zone */}
      <Text style={styles.sectionLabel}>Zona de peligro</Text>
      <View style={styles.section}>
        <SettingRow
          icon="trash-outline"
          iconColor={COLORS.error}
          label="Eliminar todos los datos"
          sublabel="Borra permanentemente toda la información"
          onPress={resetData}
          danger
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  appLogo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogoText: { color: '#000', fontWeight: '900', fontSize: 28 },
  appName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  appVersion: { color: '#888', fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rowSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 62 },
});
