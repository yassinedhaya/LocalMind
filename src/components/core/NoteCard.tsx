import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import type { Note } from '../../types/noteTypes';

interface NoteCardProps {
  note: Note;
  onSave: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = memo(function NoteCard({ note, onSave, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    onSave(note.id, editTitle.trim(), editContent.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditing(false);
  };

  const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (editing) {
    return (
      <View style={styles.card}>
        <TextInput
          style={styles.editTitle}
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Note title"
          placeholderTextColor="#6B7280"
          accessibilityLabel="Note title"
        />
        <TextInput
          style={styles.editContent}
          value={editContent}
          onChangeText={setEditContent}
          placeholder="Note content"
          placeholderTextColor="#6B7280"
          multiline
          accessibilityLabel="Note content"
        />
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
      style={styles.card}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title}
        </Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
      <Text style={styles.content} numberOfLines={3}>
        {note.content}
      </Text>
      {note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(note.id)}
        accessibilityLabel="Delete note"
        accessibilityRole="button"
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    fontSize: 14,
    color: '#A0A0B8',
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  tag: {
    backgroundColor: '#2D2D44',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: '#FF8A7E',
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  editContent: {
    fontSize: 14,
    color: '#E0E0F0',
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
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
