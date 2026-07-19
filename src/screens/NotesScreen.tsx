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
import { useNotes } from '../hooks/useNotes';
import { NoteCard } from '../components/core/NoteCard';
import type { Note } from '../types/noteTypes';

interface NotesScreenProps {
  onBack: () => void;
}

export function NotesScreen({ onBack }: NotesScreenProps) {
  const { notes, searchQuery, setSearchQuery, createNote, updateNote, deleteNote } =
    useNotes();
  const insets = useSafeAreaInsets();

  const handleSave = useCallback(
    (id: string, title: string, content: string) => {
      updateNote(id, { title, content });
    },
    [updateNote]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNote(id);
    },
    [deleteNote]
  );

  const handleCreate = useCallback(() => {
    createNote({ title: 'New Note', content: '', tags: [] });
  }, [createNote]);

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard note={item} onSave={handleSave} onDelete={handleDelete} />
    ),
    [handleSave, handleDelete]
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
          <Text style={styles.title}>Notes</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            accessibilityLabel="Create note"
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
            placeholder="Search notes..."
            placeholderTextColor="#6B7280"
            accessibilityLabel="Search notes"
          />
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching notes' : 'No notes yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Tap + to create your first note, or ask the AI to save one.'}
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
