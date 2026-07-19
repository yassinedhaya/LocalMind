import { useCallback, useEffect, useState } from 'react';
import type { TableData } from '../types/tableTypes';
import { TableStorage } from '../services/TableStorage';

export interface UseTablesState {
  tables: TableData[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createTable: (table: Omit<TableData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TableData | null>;
  updateTable: (id: string, updates: Partial<Omit<TableData, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTables(): UseTablesState {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = searchQuery
        ? await TableStorage.search(searchQuery)
        : await TableStorage.getAll();
      setTables(result);
    } catch {
      setTables([]);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTable = useCallback(
    async (table: Omit<TableData, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const created = await TableStorage.create(table);
        await refresh();
        return created;
      } catch {
        return null;
      }
    },
    [refresh]
  );

  const updateTable = useCallback(
    async (id: string, updates: Partial<Omit<TableData, 'id' | 'createdAt'>>) => {
      try {
        await TableStorage.update(id, updates);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  const deleteTable = useCallback(
    async (id: string) => {
      try {
        await TableStorage.remove(id);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  return {
    tables,
    loading,
    searchQuery,
    setSearchQuery,
    createTable,
    updateTable,
    deleteTable,
    refresh,
  };
}
