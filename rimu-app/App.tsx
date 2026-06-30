import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from './src/database/database';
import { useTasksStore } from './src/store/tasksStore';
import { useHabitsStore } from './src/store/habitsStore';
import { useWorkoutsStore } from './src/store/workoutsStore';
import { useFinanceStore } from './src/store/financeStore';
import { useStudiesStore } from './src/store/studiesStore';

import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import WorkoutsScreen from './src/screens/WorkoutsScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import StudiesScreen from './src/screens/StudiesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { COLORS } from './src/utils/constants';

const Tab = createBottomTabNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    onPrimary: '#ffffff',
  },
};

const TAB_SCREENS = [
  { name: 'Home', component: HomeScreen, label: 'Inicio', icon: 'home' },
  { name: 'Tasks', component: TasksScreen, label: 'Tareas', icon: 'checkmark-circle' },
  { name: 'Habits', component: HabitsScreen, label: 'Hábitos', icon: 'flame' },
  { name: 'Workouts', component: WorkoutsScreen, label: 'Gym', icon: 'barbell' },
  { name: 'Finance', component: FinanceScreen, label: 'Finanzas', icon: 'cash' },
  { name: 'Studies', component: StudiesScreen, label: 'Estudio', icon: 'book' },
  { name: 'Settings', component: SettingsScreen, label: 'Config', icon: 'settings' },
] as const;

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopColor: '#222',
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const screen = TAB_SCREENS.find(s => s.name === route.name);
          const iconName = focused ? (screen?.icon as any) : (`${screen?.icon}-outline` as any);
          return <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />;
        },
      })}
    >
      {TAB_SCREENS.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component as any}
          options={{ title: screen.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useTasksStore(s => s.loadTasks);
  const loadHabits = useHabitsStore(s => s.loadHabits);
  const loadWorkouts = useWorkoutsStore(s => s.loadWorkouts);
  const loadFinance = useFinanceStore(s => s.loadAll);
  const loadStudies = useStudiesStore(s => s.loadAll);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await Promise.all([
          loadTasks(),
          loadHabits(),
          loadWorkouts(),
          loadFinance(),
          loadStudies(),
        ]);
        setIsReady(true);
      } catch (e) {
        console.error('Init error:', e);
        setError(String(e));
      }
    };
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Error al inicializar: {error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <View style={styles.splashLogo}>
          <Text style={styles.splashLogoText}>R</Text>
        </View>
        <Text style={styles.splashTitle}>RIMU</Text>
        <Text style={styles.splashSub}>Tu productividad, toda en uno</Text>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  splashLogoText: { color: '#000', fontWeight: '900', fontSize: 40 },
  splashTitle: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 8 },
  splashSub: { color: '#666', fontSize: 14 },
  errorText: { color: COLORS.error, textAlign: 'center', padding: 20 },
});
