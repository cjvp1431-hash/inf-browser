import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button, Surface, FAB, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasksStore';
import { COLORS, PRIORITY_LABELS, PRIORITY_COLORS, TASK_CATEGORIES } from '../utils/constants';
import { formatDate, getTodayString } from '../utils/formatters';
import { Task } from '../database/database';

interface Props {
  route?: { params?: { autoOpen?: boolean } };
}

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
] as const;

export default function TasksScreen({ route }: Props) {
  const { tasks, filter, addTask, updateTask, completeTask, deleteTask, setFilter } = useTasksStore();

  const [modalVisible, setModalVisible] = useState(route?.params?.autoOpen || false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [priority, setPriority] = useState(2);
  const [category, setCategory] = useState('Personal');

  const openAdd = () => {
    setEditTask(null);
    setTitle('');
    setDescription('');
    setDueDate(getTodayString());
    setPriority(2);
    setCategory('Personal');
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || getTodayString());
    setPriority(task.priority);
    setCategory(task.category || 'Personal');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editTask) {
      await updateTask(editTask.id, { title: title.trim(), description, dueDate, priority, category });
    } else {
      await addTask({ title: title.trim(), description, dueDate, priority, category, status: 'pending' });
    }
    setModalVisible(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const renderTask = ({ item }: { item: Task }) => (
    <Surface style={styles.taskCard} elevation={1}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => item.status === 'pending' && completeTask(item.id)}
      >
        <Ionicons
          name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={item.status === 'completed' ? COLORS.success : COLORS.border}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.taskBody} onPress={() => openEdit(item)}>
        <Text style={[styles.taskTitle, item.status === 'completed' && styles.strikethrough]}>
          {item.title}
        </Text>
        <View style={styles.taskMeta}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
          <Text style={styles.taskMetaText}>{item.category}</Text>
          {item.dueDate ? <Text style={styles.taskMetaText}> · {formatDate(item.dueDate)}</Text> : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </Surface>
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <Chip
            key={f.key}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
            style={styles.chip}
            selectedColor={COLORS.accent}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filteredTasks}
        keyExtractor={i => i.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>Sin tareas aquí</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</Text>

            <TextInput
              label="Título *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <TextInput
              label="Descripción"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
              multiline
              numberOfLines={2}
            />

            <TextInput
              label="Fecha límite (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <Text style={styles.fieldLabel}>Prioridad (Eisenhower)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {[1, 2, 3, 4].map(p => (
                <Chip
                  key={p}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                  style={[styles.chip, { marginRight: 6 }]}
                  selectedColor={PRIORITY_COLORS[p]}
                  compact
                >
                  {PRIORITY_LABELS[p]}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {TASK_CATEGORIES.map(c => (
                <Chip
                  key={c}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, { marginRight: 6 }]}
                  selectedColor={COLORS.accent}
                  compact
                >
                  {c}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleSave} buttonColor={COLORS.primary}>
                {editTask ? 'Guardar' : 'Crear'}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { marginRight: 4 },
  list: { padding: 12, gap: 8, paddingBottom: 100 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  checkbox: { padding: 2 },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskMetaText: { fontSize: 12, color: COLORS.textSecondary },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  chipRow: { maxHeight: 44, marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
