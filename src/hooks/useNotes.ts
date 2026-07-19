import { useCallback, useEffect, useState } from 'react';
import type { Note } from '../types/noteTypes';
import { NoteStorage } from '../services/NoteStorage';

export interface UseNotesState {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotes(): UseNotesState {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = searchQuery
        ? await NoteStorage.search(searchQuery)
        : await NoteStorage.getAll();
      setNotes(result);
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const created = await NoteStorage.create(note);
        await refresh();
        return created;
      } catch {
        return null;
      }
    },
    [refresh]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => {
      try {
        await NoteStorage.update(id, updates);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        await NoteStorage.remove(id);
        await refresh();
      } catch {
        // silently fail
      }
    },
    [refresh]
  );

  return {
    notes,
    loading,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    refresh,
  };
}
