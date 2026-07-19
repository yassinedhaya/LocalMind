import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface FocusCheckinProps {
  message: string;
  loading: boolean;
  onCheckIn: () => void;
  onDistraction: (label: string) => void;
  distractionOptions?: string[];
}

const DEFAULT_DISTRACTIONS = ['Phone', 'Tired', 'Email', 'Social'];

export const FocusCheckin = memo(function FocusCheckin({
  message,
  loading,
  onCheckIn,
  onDistraction,
  distractionOptions = DEFAULT_DISTRACTIONS,
}: FocusCheckinProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>AI Focus Coach</Text>
        <TouchableOpacity
          onPress={onCheckIn}
          disabled={loading}
          style={[styles.checkInBtn, loading && styles.checkInBtnDisabled]}
          accessibilityLabel="Ask coach for a check-in"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.checkInText}>Check-in</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.messageBox}>
        {message ? (
          <Text style={styles.messageText}>{message}</Text>
        ) : (
          <Text style={styles.placeholderText}>
            Tap “Check-in” or tell the coach what’s distracting you.
          </Text>
        )}
      </View>

      <View style={styles.chipsRow}>
        {distractionOptions.map((d) => (
          <TouchableOpacity
            key={d}
            style={styles.chip}
            onPress={() => onDistraction(d)}
            disabled={loading}
            accessibilityLabel={`I am distracted by ${d}`}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkInBtn: {
    backgroundColor: '#FF6B5E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  checkInBtnDisabled: {
    opacity: 0.5,
  },
  checkInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    backgroundColor: '#14141F',
    borderRadius: 12,
    padding: 14,
    minHeight: 64,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 15,
    color: '#E0E0F0',
    lineHeight: 22,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#2D2D44',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A55',
  },
  chipText: {
    fontSize: 13,
    color: '#FF8A7E',
    fontWeight: '600',
  },
});
