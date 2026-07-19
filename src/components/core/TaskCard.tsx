import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import type { Task, TaskPriority } from '../../types/taskTypes';

interface TaskCardProps {
  task: Task;
  onSave: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Done',
  cancelled: 'Cancelled',
};

export const TaskCard = memo(function TaskCard({ task, onSave, onDelete, onToggleStatus }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);

  const handleSave = () => {
    onSave(task.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditing(false);
  };

  const dateStr = new Date(task.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  if (editing) {
    return (
      <View style={[styles.card, task.status === 'completed' && styles.completedCard]}>
        <TextInput
          style={styles.editTitle}
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Task title"
          placeholderTextColor="#6B7280"
          accessibilityLabel="Task title"
        />
        <TextInput
          style={styles.editDesc}
          value={editDesc}
          onChangeText={setEditDesc}
          placeholder="Description"
          placeholderTextColor="#6B7280"
          multiline
          accessibilityLabel="Task description"
        />
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityBtn,
                { borderColor: PRIORITY_COLORS[p] },
                editPriority === p && { backgroundColor: PRIORITY_COLORS[p] },
              ]}
              onPress={() => setEditPriority(p)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.priorityBtnText,
                  { color: PRIORITY_COLORS[p] },
                  editPriority === p && { color: '#FFFFFF' },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button">
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} accessibilityRole="button">
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, task.status === 'completed' && styles.completedCard]}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.status === 'completed' && styles.checkboxDone,
          ]}
          onPress={() => onToggleStatus(task.id)}
          accessibilityLabel={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
          accessibilityRole="button"
        >
          {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text
            style={[
              styles.title,
              task.status === 'completed' && styles.completedTitle,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] + '33' }]}>
          <Text style={[styles.priorityText, { color: PRIORITY_COLORS[task.priority] }]}>
            {task.priority}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{dateStr}</Text>
        <Text style={[styles.statusText, { color: task.status === 'completed' ? '#10B981' : '#6B7280' }]}>
          {STATUS_LABELS[task.status]}
        </Text>
        <TouchableOpacity
          onPress={() => onDelete(task.id)}
          accessibilityLabel="Delete task"
          accessibilityRole="button"
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  completedCard: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  desc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 18,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  editTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  editDesc: {
    fontSize: 13,
    color: '#E0E0F0',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  priorityBtn: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#FF6B5E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
