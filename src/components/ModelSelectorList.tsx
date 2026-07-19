import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { GemmaModelSpec } from '../models/modelCatalog';
import type { ModelStatus } from '../hooks/useModelSelector';
import { ModelSelectorCard } from './ModelSelectorCard';

interface ModelSelectorListProps {
  compatibleModels: GemmaModelSpec[];
  selectedModel: GemmaModelSpec | null;
  modelStatuses: Record<string, ModelStatus>;
  downloadProgress: Record<string, number>;
  downloadSpeed: Record<string, number>;
  recommendedId: string | null;
  loading: boolean;
  error: string | null;
  deviceRamGB: number | null;
  onSelectModel: (id: string) => void;
  onDownloadModel: (id: string) => void;
  onImportModel: (id: string) => void;
  onCancelDownload: (id: string) => void;
}

export function ModelSelectorList({
  compatibleModels,
  selectedModel,
  modelStatuses,
  downloadProgress,
  downloadSpeed,
  recommendedId,
  loading,
  error,
  deviceRamGB,
  onSelectModel,
  onDownloadModel,
  onImportModel,
  onCancelDownload,
}: ModelSelectorListProps) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B5E" />
        <Text style={styles.loadingText}>Checking device compatibility...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Compatibility Check Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (compatibleModels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notSupportedTitle}>Your device is not supported</Text>
        <Text style={styles.notSupportedText}>
          Gemma 4 requires at least 8 GB RAM.{' '}
          {deviceRamGB !== null
            ? `Your device has ${deviceRamGB} GB.`
            : 'Unable to detect your device RAM.'}
        </Text>
        <Text style={styles.notSupportedHint}>
          Gemma 4 on-device AI is available on devices with 8GB+ RAM running Android 7.0 (API 24) or
          higher.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Compatible Models</Text>
      <Text style={styles.sectionSubtitle}>
        {compatibleModels.length} model{compatibleModels.length !== 1 ? 's' : ''} available. Select
        one or use the auto-selected best option.
      </Text>
      {compatibleModels.map((model) => (
<ModelSelectorCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.id === model.id}
          isRecommended={recommendedId === model.id}
          modelStatus={modelStatuses[model.id] ?? 'unknown'}
          downloadProgress={downloadProgress[model.id]}
          downloadSpeed={downloadSpeed[model.id]}
          onSelect={onSelectModel}
          onDownload={modelStatuses[model.id] === 'downloadable' ? onDownloadModel : undefined}
          onImport={modelStatuses[model.id] === 'downloadable' ? onImportModel : undefined}
          onCancelDownload={modelStatuses[model.id] === 'downloading' ? onCancelDownload : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0B8',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#A0A0B8',
    textAlign: 'center',
  },
  notSupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  notSupportedText: {
    fontSize: 15,
    color: '#A0A0B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  notSupportedHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
