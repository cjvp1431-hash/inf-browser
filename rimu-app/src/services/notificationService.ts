import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleHabitReminder = async (hour: number = 20, minute: number = 0): Promise<string> => {
  await cancelHabitReminder();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'RIMU – Hábitos',
      body: '¿Ya hiciste check-in de tus hábitos hoy?',
      data: { screen: 'Habits' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as Notifications.DailyTriggerInput,
  });
  return id;
};

export const cancelHabitReminder = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.screen === 'Habits') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
};

export const scheduleTaskReminder = async (taskId: string, title: string, dueDate: string): Promise<void> => {
  const date = new Date(dueDate);
  if (date <= new Date()) return;
  date.setHours(9, 0, 0, 0);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'RIMU – Tarea',
      body: `Recordatorio: ${title}`,
      data: { screen: 'Tasks', taskId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    } as Notifications.DateTriggerInput,
  });
};
