import { useCallback, useEffect, useState } from 'react';
import type { Task, TaskPriority, TaskStatus } from '../types/taskTypes';
import { TaskStorage } from '../services/TaskStorage';

export interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: TaskStatus | 'all';
  setStatusFilter: (filter: TaskStatus | 'all') => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTasks(): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let result: Task[];
      if (searchQuery) {
        result = await TaskStorage.search(searchQuery);
      } else if (statusFilter !== 'all') {
        result = await TaskStorage.getByStatus(statusFilter);
      } else {
        result = await TaskStorage.getAll();
      }
      setTasks(result);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const created = await TaskStorage.create(task);
        await refresh();
        return created;
      } catch {
        return null;
      }
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      try {
        await TaskStorage.update(id, updates);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await TaskStorage.remove(id);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  return {
    tasks,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createTask,
    updateTask,
    deleteTask,
    refresh,
  };
}
