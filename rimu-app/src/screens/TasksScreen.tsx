import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Text, TextInput as RNTextInput, Dimensions,
} from 'react-native';
import { TextInput, Button, Chip, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasksStore';
import { COLORS, PRIORITY_LABELS, PRIORITY_COLORS, TASK_CATEGORIES } from '../utils/constants';
import { getTodayString } from '../utils/formatters';
import { Task, TaskView } from '../types';
import TaskCard from '../components/TaskCard';

const { width: SCREEN_W } = Dimensions.get('window');
const KANBAN_COL = SCREEN_W * 0.72;

const VIEWS: { key: TaskView; icon: string; label: string }[] = [
  { key: 'list', icon: 'list', label: 'Lista' },
  { key: 'kanban', icon: 'grid', label: 'Kanban' },
  { key: 'timeline', icon: 'time', label: 'Timeline' },
];

const KANBAN_COLS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'pending', label: 'Por hacer', color: '#2196F3' },
  { status: 'in_progress', label: 'En proceso', color: '#FF9800' },
  { status: 'completed', label: 'Completado', color: '#4CAF50' },
];

export default function TasksScreen({ route }: { route?: { params?: { autoOpen?: boolean } } }) {
  const { tasks, filter, searchQuery, addTask, updateTask, setStatus, deleteTask, setFilter, setSearch, filteredTasks } = useTasksStore();

  const [view, setView] = useState<TaskView>('list');
  const [modalVisible, setModalVisible] = useState(route?.params?.autoOpen ?? false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [priority, setPriority] = useState(2);
  const [category, setCategory] = useState('Personal');

  const openAdd = () => {
    setEditTask(null);
    setTitle(''); setDescription(''); setDueDate(getTodayString()); setPriority(2); setCategory('Personal');
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title); setDescription(task.description || '');
    setDueDate(task.dueDate || getTodayString()); setPriority(task.priority); setCategory(task.category);
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

  const displayed = filteredTasks();

  // ── Renders ──────────────────────────────────────────────────────────────

  const renderListView = () => (
    <FlatList
      data={displayed}
      keyExtractor={i => i.id}
      renderItem={({ item }) => (
        <TaskCard task={item} onPress={() => openEdit(item)} onStatusChange={setStatus} onDelete={deleteTask} />
      )}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>Sin tareas aquí</Text>
        </View>
      }
    />
  );

  const renderKanban = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kanbanScroll}>
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <View key={col.status} style={[styles.kanbanCol, { width: KANBAN_COL }]}>
            <View style={[styles.kanbanHeader, { borderBottomColor: col.color }]}>
              <View style={[styles.kanbanDot, { backgroundColor: col.color }]} />
              <Text style={styles.kanbanTitle}>{col.label}</Text>
              <View style={[styles.kanbanCount, { backgroundColor: col.color }]}>
                <Text style={styles.kanbanCountText}>{colTasks.length}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.kanbanList}>
              {colTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => openEdit(task)}
                  onStatusChange={setStatus}
                  onDelete={deleteTask}
                />
              ))}
              {colTasks.length === 0 && (
                <View style={styles.kanbanEmpty}>
                  <Text style={styles.kanbanEmptyText}>Vacío</Text>
                </View>
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderTimeline = () => {
    const withDate = displayed.filter(t => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const withoutDate = displayed.filter(t => !t.dueDate);
    const groups: Record<string, Task[]> = {};
    for (const t of withDate) {
      const d = t.dueDate.split('T')[0];
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    }
    const today = getTodayString();
    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {Object.entries(groups).map(([date, items]) => (
          <View key={date}>
            <View style={styles.timelineDate}>
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDateBubble, date === today && { backgroundColor: COLORS.accent }]}>
                <Text style={[styles.timelineDateText, date === today && { color: '#000' }]}>
                  {date === today ? 'HOY' : new Date(date + 'T00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
            {items.map(task => (
              <TaskCard key={task.id} task={task} onPress={() => openEdit(task)} onStatusChange={setStatus} onDelete={deleteTask} />
            ))}
          </View>
        ))}
        {withoutDate.length > 0 && (
          <View>
            <View style={styles.timelineDate}>
              <View style={styles.timelineLine} />
              <View style={styles.timelineDateBubble}>
                <Text style={styles.timelineDateText}>Sin fecha</Text>
              </View>
            </View>
            {withoutDate.map(task => (
              <TaskCard key={task.id} task={task} onPress={() => openEdit(task)} onStatusChange={setStatus} onDelete={deleteTask} />
            ))}
          </View>
        )}
        {displayed.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Sin tareas</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <RNTextInput
          style={styles.searchInput}
          placeholder="Buscar tarea..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* View toggle + filters */}
      <View style={styles.toolbar}>
        <View style={styles.viewToggle}>
          {VIEWS.map(v => (
            <TouchableOpacity
              key={v.key}
              style={[styles.viewBtn, view === v.key && styles.viewBtnActive]}
              onPress={() => setView(v.key)}
            >
              <Ionicons name={v.icon as any} size={16} color={view === v.key ? COLORS.accent : COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              compact
              selectedColor={COLORS.accent}
              style={styles.filterChip}
            >
              {{ all: 'Todas', pending: 'Pendientes', in_progress: 'En proceso', completed: 'Hechas' }[f]}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {view === 'list' && renderListView()}
      {view === 'kanban' && renderKanban()}
      {view === 'timeline' && renderTimeline()}

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</Text>

            <TextInput label="Título *" value={title} onChangeText={setTitle} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} />
            <TextInput label="Descripción" value={description} onChangeText={setDescription} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} multiline numberOfLines={2} />
            <TextInput label="Fecha límite (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} />

            <Text style={styles.fieldLabel}>Prioridad (Eisenhower)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {[1, 2, 3, 4].map(p => (
                  <Chip key={p} selected={priority === p} onPress={() => setPriority(p)} selectedColor={PRIORITY_COLORS[p]} compact style={{ marginRight: 6 }}>
                    {PRIORITY_LABELS[p]}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {TASK_CATEGORIES.map(c => (
                  <Chip key={c} selected={category === c} onPress={() => setCategory(c)} selectedColor={COLORS.accent} compact style={{ marginRight: 6 }}>{c}</Chip>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleSave} buttonColor={COLORS.primary}>
                {editTask ? 'Guardar' : 'Crear'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  viewToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 10, padding: 2 },
  viewBtn: { padding: 6, borderRadius: 8 },
  viewBtnActive: { backgroundColor: COLORS.primary },
  filterScroll: { flex: 1 },
  filterChip: { marginRight: 6 },
  listContent: { padding: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  kanbanScroll: { flex: 1, paddingTop: 4 },
  kanbanCol: { padding: 12, borderRightWidth: 1, borderRightColor: COLORS.border },
  kanbanHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2 },
  kanbanDot: { width: 10, height: 10, borderRadius: 5 },
  kanbanTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  kanbanCount: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  kanbanCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  kanbanList: { flex: 1 },
  kanbanEmpty: { alignItems: 'center', paddingVertical: 20 },
  kanbanEmptyText: { color: COLORS.textSecondary, fontSize: 13 },
  timelineDate: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  timelineLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  timelineDateBubble: { backgroundColor: COLORS.surfaceDark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginHorizontal: 8 },
  timelineDateText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 50, gap: 10 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginTop: 4 },
  chipRow: { flexDirection: 'row', paddingBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
