import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Text, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, ParseResult } from '../types';
import { parseWhatsAppMessage } from '../services/whatsappParser';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useWorkoutsStore } from '../store/workoutsStore';
import { useFinanceStore } from '../store/financeStore';
import { useStudiesStore } from '../store/studiesStore';
import { COLORS } from '../utils/constants';
import { generateId, getTodayString } from '../utils/formatters';

const QUICK_COMMANDS = [
  { label: '💰 Ingreso', text: 'Gané 5000 pesos hoy' },
  { label: '💸 Gasto', text: 'Gasté 1500 en comida' },
  { label: '💪 Gym', text: 'Hice bench press 100kg 4x8' },
  { label: '📋 Tarea', text: 'Audiencia mañana a las 10am' },
  { label: '📚 Estudio', text: 'Estudié 2 horas de derecho' },
  { label: '🔥 Hábito', text: 'Medité hoy' },
  { label: '❓ Ayuda', text: 'ayuda' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'bot-welcome',
    text: '👋 ¡Hola! Soy el bot de *RIMU*. Puedo crear registros en cualquier módulo con solo escribirme en lenguaje natural.\n\nEscribe *ayuda* para ver todos los comandos.',
    isBot: true,
    timestamp: new Date().toISOString(),
  },
];

export default function WhatsAppScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { addTask } = useTasksStore();
  const { checkIn: habitCheckIn, habits } = useHabitsStore();
  const { addWorkout } = useWorkoutsStore();
  const { addTransaction, selectedAccountId } = useFinanceStore();
  const { addSession, subjects } = useStudiesStore();

  const scrollToBottom = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const addMessage = (text: string, isBot: boolean, actionType?: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      text,
      isBot,
      timestamp: new Date().toISOString(),
      actionType,
    };
    setMessages(prev => [...prev, msg]);
  };

  const executeAction = async (result: ParseResult): Promise<void> => {
    const today = getTodayString();

    switch (result.type) {
      case 'income': {
        const { amount, category, description } = result.data!;
        if (selectedAccountId) {
          await addTransaction({
            accountId: selectedAccountId,
            type: 'income',
            amount,
            category,
            description,
            date: today,
            installments: 0,
          });
        }
        break;
      }
      case 'expense': {
        const { amount, category, description } = result.data!;
        if (selectedAccountId) {
          await addTransaction({
            accountId: selectedAccountId,
            type: 'expense',
            amount,
            category,
            description,
            date: today,
            installments: 0,
          });
        }
        break;
      }
      case 'workout': {
        const { exerciseName, sets, reps, weight, weightUnit, notes } = result.data!;
        await addWorkout({ exerciseName, sets, reps, weight, weightUnit, date: today, notes });
        break;
      }
      case 'task': {
        const { title, dueDate, priority, category, description } = result.data!;
        await addTask({ title, description, dueDate, priority, category, status: 'pending' });
        break;
      }
      case 'study': {
        const { duration, subjectHint, notes, focusType } = result.data!;
        let subjectId = subjects[0]?.id;
        if (subjectHint && subjects.length) {
          const match = subjects.find(s => s.name.toLowerCase().includes(subjectHint.toLowerCase()));
          if (match) subjectId = match.id;
        }
        if (subjectId) {
          await addSession({ subjectId, date: today, duration, focusType: focusType ?? 'focused', notes: notes ?? '' });
        }
        break;
      }
      case 'habit': {
        if (habits.length) {
          const { hint } = result.data!;
          const match = habits.find(h => h.title.toLowerCase().includes(hint)) ?? habits[0];
          await habitCheckIn(match.id);
          addMessage(`✅ Check-in registrado para: *${match.title}*\nRacha actual: 🔥${match.currentStreak + 1} días`, true, 'habit');
          return;
        }
        break;
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || processing) return;

    addMessage(text, false);
    setInput('');
    setProcessing(true);

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 600));

    const result = parseWhatsAppMessage(text);

    try {
      if (result.type !== 'unknown' && result.type !== 'help') {
        await executeAction(result);
      }
      addMessage(result.botResponse, true, result.type);
    } catch (e) {
      addMessage(`❌ Error al procesar: ${String(e)}`, true, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgRow, item.isBot ? styles.msgRowBot : styles.msgRowUser]}>
      {item.isBot && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>R</Text>
        </View>
      )}
      <View style={[styles.bubble, item.isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, item.isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, item.isBot ? styles.botTime : styles.userTime]}>
          {formatTime(item.timestamp)}
          {!item.isBot && ' ✓✓'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>R</Text>
        </View>
        <View>
          <Text style={styles.headerName}>RIMU Bot</Text>
          <Text style={styles.headerStatus}>● Online – responde al instante</Text>
        </View>
      </View>

      {/* Quick commands */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
        {QUICK_COMMANDS.map(cmd => (
          <TouchableOpacity key={cmd.label} style={styles.quickChip} onPress={() => setInput(cmd.text)}>
            <Text style={styles.quickChipText}>{cmd.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un comando..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || processing) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || processing}
          >
            <Ionicons name={processing ? 'hourglass-outline' : 'send'} size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: { fontWeight: '900', fontSize: 18, color: '#000' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerStatus: { fontSize: 11, color: '#4CAF50' },
  quickRow: { backgroundColor: COLORS.primary, maxHeight: 48 },
  quickContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickChip: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  quickChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  messageList: { padding: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end', gap: 8 },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontWeight: '900', fontSize: 14, color: '#000' },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleBot: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  bubbleUser: { backgroundColor: '#DCF8C6', borderTopRightRadius: 2 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  botText: { color: '#111' },
  userText: { color: '#111' },
  timeText: { fontSize: 10, marginTop: 4 },
  botTime: { color: '#888', textAlign: 'right' },
  userTime: { color: '#555', textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    backgroundColor: '#F0F0F0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#111',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
