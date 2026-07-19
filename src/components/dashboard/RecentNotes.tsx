import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Note } from '../../types/noteTypes';

interface RecentNotesProps {
  notes: Note[];
  max?: number;
  onOpen: () => void;
}

export const RecentNotes = memo(function RecentNotes({ notes, max = 3, onOpen }: RecentNotesProps) {
  const items = notes.slice(0, max);
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Notes</Text>
        {notes.length > 0 && (
          <TouchableOpacity onPress={onOpen} accessibilityRole="button">
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>No notes yet.</Text>
      ) : (
        items.map((n) => (
          <View key={n.id} style={styles.row}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {n.title || 'Untitled'}
            </Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {n.content}
            </Text>
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
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D2D44',
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
  },
});
