import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Divider, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURRENCIES } from '../utils/constants';
import { scheduleHabitReminder, cancelHabitReminder, requestPermissions } from '../services/notificationService';
import { getDB } from '../database/database';

export default function SettingsScreen() {
  const [habitReminder, setHabitReminder] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  const toggleHabitReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permisos', 'Necesitas permitir notificaciones en Ajustes de iOS');
        return;
      }
      await scheduleHabitReminder(20, 0);
      Alert.alert('✅', 'Recordatorio diario activado a las 20:00');
    } else {
      await cancelHabitReminder();
    }
    setHabitReminder(value);
  };

  const showStorageInfo = async () => {
    try {
      const db = getDB();
      const tables = ['tasks', 'habits', 'workouts', 'accounts', 'transactions', 'subjects', 'studySessions'];
      const counts: string[] = [];
      for (const table of tables) {
        const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
        counts.push(`${table}: ${row?.count || 0} registros`);
      }
      Alert.alert('Almacenamiento', counts.join('\n'));
    } catch (e) {
      Alert.alert('Error', 'No se pudo leer el almacenamiento');
    }
  };

  const resetData = () => {
    Alert.alert(
      '⚠️ Eliminar todos los datos',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const db = getDB();
            const tables = ['tasks', 'habits', 'workouts', 'accounts', 'transactions', 'subjects', 'studySessions'];
            for (const t of tables) {
              await db.runAsync(`DELETE FROM ${t}`);
            }
            Alert.alert('✅', 'Datos eliminados. Reinicia la app para ver los cambios.');
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notificaciones',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Recordatorio de hábitos',
          subtitle: 'Notificación diaria a las 20:00',
          right: <Switch value={habitReminder} onValueChange={toggleHabitReminder} color={COLORS.accent} />,
        },
      ],
    },
    {
      title: 'Datos',
      items: [
        {
          icon: 'server-outline',
          label: 'Ver almacenamiento',
          subtitle: 'Conteo de registros en la base de datos',
          onPress: showStorageInfo,
        },
        {
          icon: 'trash-outline',
          label: 'Eliminar todos los datos',
          subtitle: 'Acción irreversible',
          destructive: true,
          onPress: resetData,
        },
      ],
    },
    {
      title: 'Acerca de',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'RIMU App',
          subtitle: 'v1.0.0 · Productivity All-in-One · Offline',
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacidad',
          subtitle: 'Todos tus datos están guardados localmente en tu iPhone',
        },
        {
          icon: 'wifi-outline',
          label: 'Modo offline',
          subtitle: 'No requiere internet · Sin cuenta · Sin servidor',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <View>
          <Text style={styles.appName}>RIMU</Text>
          <Text style={styles.appVersion}>Productivity All-in-One · v1.0.0</Text>
        </View>
      </View>

      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Surface style={styles.sectionCard} elevation={1}>
            {section.items.map((item, idx) => (
              <React.Fragment key={item.label}>
                {idx > 0 && <Divider />}
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={(item as any).onPress}
                  disabled={!(item as any).onPress && !(item as any).right}
                  activeOpacity={(item as any).onPress ? 0.7 : 1}
                >
                  <View style={[
                    styles.settingIcon,
                    { backgroundColor: (item as any).destructive ? '#F4433615' : COLORS.surface }
                  ]}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={(item as any).destructive ? COLORS.error : COLORS.textPrimary}
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[
                      styles.settingLabel,
                      (item as any).destructive && { color: COLORS.error }
                    ]}>
                      {item.label}
                    </Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                  {(item as any).right
                    ? (item as any).right
                    : (item as any).onPress
                    ? <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                    : null
                  }
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Surface>
        </View>
      ))}

      <Text style={styles.footer}>
        Hecho con ❤️ para iPhone{'\n'}Todos los datos en SQLite local
      </Text>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 40,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: '#000', fontWeight: '900', fontSize: 28 },
  appName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 4 },
  appVersion: { fontSize: 12, color: '#888', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  sectionCard: { borderRadius: 14, backgroundColor: COLORS.surface, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  settingSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  footer: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 13, marginTop: 32, lineHeight: 22 },
});
