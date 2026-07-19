import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTables } from '../hooks/useTables';
import { TableCard } from '../components/core/TableCard';
import { createEmptyTable } from '../services/TableParser';
import type { TableData } from '../types/tableTypes';

interface TablesScreenProps {
  onBack: () => void;
}

export function TablesScreen({ onBack }: TablesScreenProps) {
  const { tables, searchQuery, setSearchQuery, createTable, updateTable, deleteTable } =
    useTables();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [newColsText, setNewColsText] = useState('');

  const handleSave = useCallback(
    (id: string, data: Partial<Omit<TableData, 'id' | 'createdAt'>>) => {
      updateTable(id, data);
    },
    [updateTable]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTable(id);
    },
    [deleteTable]
  );

  const handleCreate = useCallback(() => {
    setNewColsText('');
    setModalVisible(true);
  }, []);

  const handleCreateConfirm = useCallback(async () => {
    const colNames = newColsText.split(',').map((s) => s.trim()).filter(Boolean);
    if (colNames.length === 0) return;
    const { columns, rows } = createEmptyTable(colNames);
    await createTable({
      title: `Table ${tables.length + 1}`,
      columns,
      rows,
      tags: [],
    });
    setModalVisible(false);
  }, [newColsText, createTable, tables.length]);

  const renderItem = useCallback(
    ({ item }: { item: TableData }) => (
      <TableCard table={item} onSave={handleSave} onDelete={handleDelete} />
    ),
    [handleSave, handleDelete]
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={styles.backIcon}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tables</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate} accessibilityLabel="Create table" accessibilityRole="button">
            <Text style={styles.createIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tables..."
            placeholderTextColor="#6B7280"
            accessibilityLabel="Search tables"
          />
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={tables}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching tables' : 'No tables yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Ask the AI to create a table, or tap + to start one.'}
              </Text>
            </View>
          }
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Table</Text>
            <Text style={styles.modalLabel}>Column names (comma separated)</Text>
            <TextInput
              style={styles.modalInput}
              value={newColsText}
              onChangeText={setNewColsText}
              placeholder="Name, Age, City"
              placeholderTextColor="#6B7280"
              autoFocus
              accessibilityLabel="Column names"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} accessibilityRole="button">
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, !newColsText.trim() && styles.modalCreateBtnDisabled]}
                onPress={handleCreateConfirm}
                disabled={!newColsText.trim()}
                accessibilityRole="button"
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalCreateBtn: {
    backgroundColor: '#FF6B5E',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalCreateBtnDisabled: {
    backgroundColor: '#3B3B5C',
    opacity: 0.5,
  },
  modalCreateText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
