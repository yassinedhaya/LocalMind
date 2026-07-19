import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Task } from '../../types/taskTypes';

interface RecentTasksProps {
  tasks: Task[];
  max?: number;
  onOpen: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
  cancelled: '#6B7280',
};

export const RecentTasks = memo(function RecentTasks({ tasks, max = 3, onOpen }: RecentTasksProps) {
  const items = tasks.slice(0, max);
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Tasks</Text>
        {tasks.length > 0 && (
          <TouchableOpacity onPress={onOpen} accessibilityRole="button">
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>No tasks yet.</Text>
      ) : (
        items.map((t) => (
          <View key={t.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: STATUS_COLOR[t.status] ?? '#6B7280' }]} />
            <View style={styles.info}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {t.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 13,
    color: '#FF8A7E',
    fontWeight: '600',
  },
  empty: {
    fontSize: 13,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowSub: {
    fontSize: 12,
    color: '#A0A0B8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
