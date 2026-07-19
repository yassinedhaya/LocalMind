import type { TableData } from '../types/tableTypes';
import { invalidateDashboard } from './cacheRepository';

let tableCache: TableData[] = [];

export const TableStorage = {
  getAll(): Promise<TableData[]> {
    return Promise.resolve([...tableCache]);
  },

  getById(id: string): Promise<TableData | undefined> {
    return Promise.resolve(tableCache.find((t) => t.id === id));
  },

  create(table: Omit<TableData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TableData> {
    const now = Date.now();
    const newTable: TableData = {
      ...table,
      id: `table-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    tableCache.unshift(newTable);
    invalidateDashboard();
    return Promise.resolve(newTable);
  },

  update(id: string, updates: Partial<Omit<TableData, 'id' | 'createdAt'>>): Promise<TableData | undefined> {
    const index = tableCache.findIndex((t) => t.id === id);
    if (index === -1) return Promise.resolve(undefined);
    tableCache[index] = { ...tableCache[index], ...updates, updatedAt: Date.now() };
    invalidateDashboard();
    return Promise.resolve(tableCache[index]);
  },

  remove(id: string): Promise<boolean> {
    const len = tableCache.length;
    tableCache = tableCache.filter((t) => t.id !== id);
    invalidateDashboard();
    return Promise.resolve(tableCache.length !== len);
  },

  search(query: string): Promise<TableData[]> {
    const lower = query.toLowerCase();
    return Promise.resolve(
      tableCache.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.columns.some((c) => c.name.toLowerCase().includes(lower)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
    );
  },
};
