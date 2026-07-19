import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/core/TaskCard';
import type { Task, TaskStatus } from '../types/taskTypes';

interface TasksScreenProps {
  onBack: () => void;
}

const FILTER_TABS: Array<{ key: TaskStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export function TasksScreen({ onBack }: TasksScreenProps) {
  const {
    tasks,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const insets = useSafeAreaInsets();

  const handleSave = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      updateTask(id, updates);
    },
    [updateTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id);
    },
    [deleteTask]
  );

  const handleToggleStatus = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        updateTask(id, {
          status: task.status === 'completed' ? 'pending' : 'completed',
        });
      }
    },
    [tasks, updateTask]
  );

  const handleCreate = useCallback(() => {
    createTask({
      title: 'New Task',
      description: '',
      priority: 'medium',
      status: 'pending',
      tags: [],
    });
  }, [createTask]);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard
        task={item}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
    ),
    [handleSave, handleDelete, handleToggleStatus]
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tasks</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            accessibilityLabel="Create task"
            accessibilityRole="button"
          >
            <Text style={styles.createIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor="#6B7280"
            accessibilityLabel="Search tasks"
          />
        </View>

        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                statusFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setStatusFilter(tab.key)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterTabText,
                  statusFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching tasks' : 'No tasks yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Tap + to create your first task.'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  statusBarBg: {
    backgroundColor: '#0F0F1A',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  backIcon: {
    fontSize: 16,
    color: '#FF6B5E',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0F0F1A',
  },
  searchInput: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  filterTab: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  filterTabActive: {
    backgroundColor: '#FF6B5E',
    borderColor: '#FF6B5E',
  },
  filterTabText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
