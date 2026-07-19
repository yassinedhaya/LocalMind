import type { Task, TaskStatus } from '../types/taskTypes';
import { invalidateDashboard } from './cacheRepository';

let tasksCache: Task[] = [];

export const TaskStorage = {
  getAll(): Promise<Task[]> {
    return Promise.resolve([...tasksCache]);
  },

  getById(id: string): Promise<Task | undefined> {
    return Promise.resolve(tasksCache.find((t) => t.id === id));
  },

  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = Date.now();
    const newTask: Task = {
      ...task,
      id: `task-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    tasksCache.unshift(newTask);
    invalidateDashboard();
    return Promise.resolve(newTask);
  },

  update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
    const index = tasksCache.findIndex((t) => t.id === id);
    if (index === -1) return Promise.resolve(undefined);
    tasksCache[index] = { ...tasksCache[index], ...updates, updatedAt: Date.now() };
    invalidateDashboard();
    return Promise.resolve(tasksCache[index]);
  },

  remove(id: string): Promise<boolean> {
    const len = tasksCache.length;
    tasksCache = tasksCache.filter((t) => t.id !== id);
    invalidateDashboard();
    return Promise.resolve(tasksCache.length !== len);
  },

  search(query: string): Promise<Task[]> {
    const lower = query.toLowerCase();
    return Promise.resolve(
      tasksCache.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
    );
  },

  getByStatus(status: TaskStatus): Promise<Task[]> {
    return Promise.resolve(tasksCache.filter((t) => t.status === status));
  },
};
