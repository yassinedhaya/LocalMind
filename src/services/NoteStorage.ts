import type { Note } from '../types/noteTypes';

let notesCache: Note[] = [];

export const NoteStorage = {
  getAll(): Promise<Note[]> {
    return Promise.resolve([...notesCache]);
  },

  getById(id: string): Promise<Note | undefined> {
    return Promise.resolve(notesCache.find((n) => n.id === id));
  },

  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = Date.now();
    const newNote: Note = {
      ...note,
      id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    notesCache.unshift(newNote);
    return Promise.resolve(newNote);
  },

  update(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>): Promise<Note | undefined> {
    const index = notesCache.findIndex((n) => n.id === id);
    if (index === -1) return Promise.resolve(undefined);
    notesCache[index] = { ...notesCache[index], ...updates, updatedAt: Date.now() };
    return Promise.resolve(notesCache[index]);
  },

  remove(id: string): Promise<boolean> {
    const len = notesCache.length;
    notesCache = notesCache.filter((n) => n.id !== id);
    return Promise.resolve(notesCache.length !== len);
  },

  search(query: string): Promise<Note[]> {
    const lower = query.toLowerCase();
    return Promise.resolve(
      notesCache.filter(
        (n) =>
          n.title.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower) ||
          n.tags.some((t) => t.toLowerCase().includes(lower))
      )
    );
  },

  invalidateCache(): void {
    // no-op for in-memory
  },
};
