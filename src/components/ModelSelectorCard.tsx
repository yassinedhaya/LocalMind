import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { GemmaModelSpec } from '../models/modelCatalog';

interface ModelSelectorCardProps {
  model: GemmaModelSpec;
  isSelected: boolean;
  isRecommended: boolean;
  modelStatus: 'unknown' | 'available' | 'downloadable' | 'downloading' | 'initializing' | 'unavailable';
  downloadProgress?: number;
  downloadSpeed?: number;
  onSelect: (id: string) => void;
  onDownload?: (id: string) => void;
  onCancelDownload?: (id: string) => void;
  onImport?: (id: string) => void;
}

export function ModelSelectorCard({
  model,
  isSelected,
  isRecommended,
  modelStatus,
  downloadProgress,
  downloadSpeed,
  onSelect,
  onDownload,
  onCancelDownload,
  onImport,
}: ModelSelectorCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => onSelect(model.id)}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${model.displayName}: ${model.description}`}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.displayName}>{model.displayName}</Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{model.badge}</Text>
          </View>
        </View>
        <Text style={styles.description}>{model.description}</Text>
        <View style={styles.specs}>
          <Text style={styles.spec}>RAM: {model.minRamGB}GB+</Text>
          <Text style={styles.spec}>Storage: {model.minStorageGB}GB+</Text>
        </View>

      {modelStatus === 'downloading' && (
        <View style={styles.downloadSection}>
          <View style={styles.downloadBar}>
            <ActivityIndicator size="small" color="#FF6B5E" />
            <Text style={styles.downloadText}>
              {downloadProgress != null ? `Downloading ${downloadProgress}%` : 'Downloading...'}
            </Text>
            <Text style={styles.speedText}>
              {downloadSpeed != null && downloadSpeed > 0 ? `${downloadSpeed.toFixed(1)} MB/s` : ''}
            </Text>
            {onCancelDownload && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => onCancelDownload(model.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
          {downloadProgress != null && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
            </View>
          )}
        </View>
      )}
      {modelStatus === 'initializing' && (
        <View style={styles.downloadBar}>
          <ActivityIndicator size="small" color="#FF6B5E" />
          <Text style={styles.downloadText}>Initializing model...</Text>
        </View>
      )}

      {modelStatus === 'downloadable' && onDownload && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => onDownload(model.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadButtonText}>Download Model</Text>
        </TouchableOpacity>
      )}

      {modelStatus === 'downloadable' && onImport && (
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => onImport(model.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.importButtonText}>Import Model File</Text>
        </TouchableOpacity>
      )}

      {modelStatus === 'unavailable' && (
        <Text style={styles.unavailableText}>Not available on this device</Text>
      )}

      {modelStatus === 'available' && isSelected && (
        <Text style={styles.readyText}>Ready to use</Text>
      )}
      </View>
    </TouchableOpacity>
  );
}

const PROGRESS_TRACK_HEIGHT = 6;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2D2D44',
  },
  cardSelected: {
    borderColor: '#FF6B5E',
    backgroundColor: '#1A1A2E',
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendedBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  recommendedText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '700',
  },
  badgeContainer: {
    backgroundColor: '#FF6B5E20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badge: {
    fontSize: 13,
    color: '#FF8A7E',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#A0A0B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  specs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  spec: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#2D2D44',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  downloadSection: {
    marginTop: 8,
  },
  downloadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D2D44',
    padding: 10,
    borderRadius: 8,
  },
  cancelButton: {
    marginLeft: 'auto',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadText: {
    fontSize: 13,
    color: '#FF8A7E',
  },
  speedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  progressTrack: {
    height: PROGRESS_TRACK_HEIGHT,
    backgroundColor: '#2D2D44',
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B5E',
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
  },
  downloadButton: {
    backgroundColor: '#FF6B5E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  importButton: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  unavailableText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
  readyText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 8,
  },
});
