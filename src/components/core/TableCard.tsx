import React, { memo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import type { TableData, TableRow, TableColumn } from '../../types/tableTypes';

interface TableCardProps {
  table: TableData;
  onSave: (id: string, data: Partial<Omit<TableData, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

const CELL_W = 120;

export const TableCard = memo(function TableCard({ table, onSave, onDelete }: TableCardProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [colModalVisible, setColModalVisible] = useState(false);
  const [newColName, setNewColName] = useState('');

  const handleCellPress = useCallback((rowId: string, colId: string, value: string) => {
    setEditingCell({ rowId, colId });
    setEditValue(value);
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;
    const newRows = table.rows.map((r) => {
      if (r.id !== editingCell.rowId) return r;
      return { ...r, cells: { ...r.cells, [editingCell.colId]: editValue } };
    });
    onSave(table.id, { rows: newRows });
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, table.id, table.rows, onSave]);

  const handleAddRow = useCallback(() => {
    const cells: Record<string, string> = {};
    table.columns.forEach((c) => { cells[c.id] = ''; });
    const newRow: TableRow = { id: `row-${Date.now()}`, cells };
    onSave(table.id, { rows: [...table.rows, newRow] });
  }, [table.id, table.columns, table.rows, onSave]);

  const handleDeleteRow = useCallback((rowId: string) => {
    onSave(table.id, { rows: table.rows.filter((r) => r.id !== rowId) });
  }, [table.id, table.rows, onSave]);

  const openAddCol = useCallback(() => {
    setNewColName('');
    setColModalVisible(true);
  }, []);

  const handleAddColumn = useCallback(() => {
    const name = newColName.trim();
    if (!name) { setColModalVisible(false); return; }
    const newCol: TableColumn = { id: `col-${Date.now()}`, name };
    const newRows = table.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [newCol.id]: '' },
    }));
    onSave(table.id, { columns: [...table.columns, newCol], rows: newRows });
    setColModalVisible(false);
    setNewColName('');
  }, [newColName, table.id, table.columns, table.rows, onSave]);

  const dateStr = new Date(table.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{table.title}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
          <View style={styles.table}>
            <View style={styles.theadRow}>
              {table.columns.map((col) => (
                <View key={col.id} style={styles.thCell}>
                  <Text style={styles.thText} numberOfLines={1}>{col.name}</Text>
                </View>
              ))}
            </View>

            {table.rows.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No rows yet — tap + Row to add one</Text>
              </View>
            )}

            {table.rows.map((row) => (
              <View key={row.id} style={styles.trow}>
                {table.columns.map((col) => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  return (
                    <TouchableOpacity
                      key={col.id}
                      style={styles.tdCell}
                      onPress={() => handleCellPress(row.id, col.id, row.cells[col.id] || '')}
                      activeOpacity={0.6}
                    >
                      {isEditing ? (
                        <TextInput
                          style={styles.cellInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          onBlur={handleCellSave}
                          onSubmitEditing={handleCellSave}
                          autoFocus
                          accessibilityLabel={`Edit ${col.name}`}
                        />
                      ) : (
                        <Text style={styles.cellText} numberOfLines={2}>
                          {row.cells[col.id] || ''}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.fixedAddBtn} onPress={openAddCol} activeOpacity={0.6}>
          <Text style={styles.fixedAddText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddRow} accessibilityRole="button">
            <Text style={styles.actionBtnText}>+ Row</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openAddCol} accessibilityRole="button">
            <Text style={styles.actionBtnText}>+ Column</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(table.id)} accessibilityRole="button">
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={colModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Column</Text>
            <TextInput
              style={styles.modalInput}
              value={newColName}
              onChangeText={setNewColName}
              placeholder="Column name"
              placeholderTextColor="#6B7280"
              autoFocus
              accessibilityLabel="Column name"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setColModalVisible(false)} accessibilityRole="button">
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, !newColName.trim() && styles.modalCreateBtnDisabled]}
                onPress={handleAddColumn}
                disabled={!newColName.trim()}
                accessibilityRole="button"
              >
                <Text style={styles.modalCreateText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  tableContainer: {
    flexDirection: 'row',
    marginHorizontal: -14,
  },
  tableScroll: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#2D2D44',
    borderRadius: 8,
    overflow: 'hidden',
  },
  theadRow: {
    flexDirection: 'row',
    backgroundColor: '#2D2D44',
  },
  thCell: {
    width: CELL_W,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#3B3B5C',
  },
  thText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF8A7E',
    textTransform: 'uppercase',
  },
  fixedAddBtn: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2D44',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#2D2D44',
  },
  fixedAddText: {
    fontSize: 22,
    color: '#FF8A7E',
    fontWeight: '700',
  },
  emptyRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  trow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
  },
  tdCell: {
    width: CELL_W,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#2D2D44',
    minHeight: 36,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#E0E0F0',
  },
  cellInput: {
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: '#3B3B5C',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    margin: -4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#3B3B5C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 13,
    color: '#FF8A7E',
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
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
    width: '80%',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
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
