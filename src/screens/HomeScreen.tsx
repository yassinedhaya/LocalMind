import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import { useModelSelector } from '../hooks/useModelSelector';
import { DeviceProfileBadge } from '../components/DeviceProfileBadge';
import { ModelSelectorList } from '../components/ModelSelectorList';
import { NonRecommendedWarning } from '../components/NonRecommendedWarning';
import { EngineManager } from '../services/EngineManager';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { DashboardStatCard } from '../components/dashboard/DashboardStatCard';
import { RecentNotes } from '../components/dashboard/RecentNotes';
import { RecentTasks } from '../components/dashboard/RecentTasks';
import { QuickActions, QuickAction } from '../components/dashboard/QuickActions';
import { formatDuration } from '../types/timerTypes';

interface HomeScreenProps {
  onNavigateToChat: () => void;
  onNavigateToNotes: () => void;
  onNavigateToTasks: () => void;
  onNavigateToTables: () => void;
  onNavigateToCamper: () => void;
  onNavigateToTimer: () => void;
  onNavigateToPdf: () => void;
  onNavigateToVoice: () => void;
}

type WarningStage = 1 | 2;

export function HomeScreen({
  onNavigateToChat,
  onNavigateToNotes,
  onNavigateToTasks,
  onNavigateToTables,
  onNavigateToCamper,
  onNavigateToTimer,
  onNavigateToPdf,
  onNavigateToVoice,
}: HomeScreenProps) {
  const [initLoading, setInitLoading] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningStage, setWarningStage] = useState<WarningStage>(1);
  const [setupOpen, setSetupOpen] = useState(false);

  const { data } = useHomeDashboard();

  const {
    profile,
    compatibleModels,
    loading: profileLoading,
    error: profileError,
    errorCode: profileErrorCode,
  } = useDeviceProfile();

  const {
    selectedModel,
    compatibleModels: sortedModels,
    modelStatuses,
    downloadProgress,
    downloadSpeed,
    recommendedId,
    selectModel,
    downloadModel,
    cancelDownloadModel,
    importModelFromFile,
    initEngine,
  } = useModelSelector(compatibleModels, profile?.ramGB ?? null);

  const insets = useSafeAreaInsets();
  const selectedModelStatus = selectedModel ? modelStatuses[selectedModel.id] ?? 'unknown' : null;
  const [engineReady, setEngineReady] = useState(EngineManager.isInitialized());
  const [engineInitializing, setEngineInitializing] = useState(EngineManager.isInitializing());

  useEffect(() => {
    return EngineManager.addStatusListener((status) => {
      setEngineReady(status === 'ready');
      setEngineInitializing(status === 'initializing');
    });
  }, []);

  // Open setup automatically if no model is ready and nothing selected.
  useEffect(() => {
    if (!engineReady && !selectedModel && compatibleModels.length > 0 && !profileLoading) {
      setSetupOpen(true);
    }
  }, [engineReady, selectedModel, compatibleModels, profileLoading]);

  const canChat = engineReady || selectedModelStatus === 'available' || selectedModelStatus === 'initializing';
  const isRecommended = selectedModel ? selectedModel.id === recommendedId : true;

  const doContinue = useCallback(async () => {
    if (!selectedModel) return;
    setInitLoading(true);
    const ok = await initEngine(selectedModel.id);
    setInitLoading(false);
    if (ok) {
      setSetupOpen(false);
      onNavigateToChat();
    }
  }, [selectedModel, initEngine, onNavigateToChat]);

  const handleContinuePress = useCallback(() => {
    if (isRecommended) {
      doContinue();
    } else {
      setWarningStage(1);
      setWarningVisible(true);
    }
  }, [isRecommended, doContinue]);

  const handleWarningContinue = useCallback(() => {
    if (warningStage === 1) {
      setWarningStage(2);
    } else {
      setWarningVisible(false);
      doContinue();
    }
  }, [warningStage, doContinue]);

  const handleWarningCancel = useCallback(() => {
    setWarningVisible(false);
    if (warningStage === 1 && recommendedId) {
      selectModel(recommendedId);
    }
  }, [warningStage, recommendedId, selectModel]);

  const selectedRecommendedName = recommendedId
    ? compatibleModels.find((m) => m.id === recommendedId)?.displayName ?? null
    : null;

  const quickActions: QuickAction[] = [
    { key: 'chat', label: 'Chat', icon: '💬', color: '#FF6B5E' },
    { key: 'notes', label: 'Notes', icon: '📝', color: '#3B82F6' },
    { key: 'tasks', label: 'Tasks', icon: '✅', color: '#10B981' },
    { key: 'tables', label: 'Tables', icon: '📊', color: '#F59E0B' },
    { key: 'focus', label: 'Focus Timer', icon: '⏱️', color: '#0891B2' },
    { key: 'pdf', label: 'PDF Q&A', icon: '📄', color: '#EC4899' },
    { key: 'voice', label: 'Voice', icon: '🎤', color: '#8B5CF6' },
    { key: 'camper', label: 'Camper', icon: '🏕️', color: '#34D399' },
  ];

  const onAction = (key: string) => {
    switch (key) {
      case 'chat': onNavigateToChat(); break;
      case 'notes': onNavigateToNotes(); break;
      case 'tasks': onNavigateToTasks(); break;
      case 'tables': onNavigateToTables(); break;
      case 'focus': onNavigateToTimer(); break;
      case 'pdf': onNavigateToPdf(); break;
      case 'voice': onNavigateToVoice(); break;
      case 'camper': onNavigateToCamper(); break;
    }
  };

  const timerStats = data?.timerStats;
  const focusMins = timerStats ? formatDuration(timerStats.todayFocusTime) : '0s';

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.title}>Gemma 4 AI</Text>
            <Text style={styles.subtitle}>On-Device Dashboard</Text>
          </View>
          <View style={[styles.engineBadge, { backgroundColor: engineReady ? '#10331F' : '#2A2A3A' }]}>
            <View style={[styles.engineDot, { backgroundColor: engineReady ? '#10B981' : '#6B7280' }]} />
            <Text style={[styles.engineText, { color: engineReady ? '#34D399' : '#A0A0B8' }]}>
              {engineReady ? 'Engine Ready' : 'Setup Needed'}
            </Text>
          </View>
        </View>

        <DeviceProfileBadge profile={profile} loading={profileLoading} />

        <View style={styles.statsGrid}>
          <DashboardStatCard label="Notes" value={data?.notes.length ?? 0} icon="📝" color="#3B82F6" />
          <DashboardStatCard label="Tasks" value={data?.tasks.length ?? 0} icon="✅" color="#10B981" />
          <DashboardStatCard label="Tables" value={data?.tables.length ?? 0} icon="📊" color="#F59E0B" />
          <DashboardStatCard label="Focus Today" value={focusMins} icon="⏱️" color="#0891B2" />
        </View>

        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <QuickActions actions={quickActions} onAction={onAction} />

        <RecentNotes notes={data?.notes ?? []} onOpen={onNavigateToNotes} />
        <RecentTasks tasks={data?.tasks ?? []} onOpen={onNavigateToTasks} />

        {!engineReady && (
          <View style={styles.setupCard}>
            <TouchableOpacity
              style={styles.setupHeader}
              onPress={() => setSetupOpen((v) => !v)}
              accessibilityRole="button"
            >
              <Text style={styles.setupTitle}>
                {setupOpen ? 'Hide Model Setup' : 'Model Setup & Engine'}
              </Text>
              <Text style={styles.setupChevron}>{setupOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {setupOpen && (
              <View style={styles.setupBody}>
                {profileLoading ? (
                  <View style={styles.messageContainer}>
                    <ActivityIndicator size="large" color="#FF6B5E" />
                    <Text style={styles.loadingText}>Scanning device capabilities...</Text>
                  </View>
                ) : profileError ? (
                  <View style={styles.messageContainer}>
                    <Text style={styles.errorTitle}>Setup Error</Text>
                    <Text style={styles.errorText}>{profileError}</Text>
                  </View>
                ) : (
                  <ModelSelectorList
                    compatibleModels={sortedModels}
                    selectedModel={selectedModel}
                    modelStatuses={modelStatuses}
                    downloadProgress={downloadProgress}
                    downloadSpeed={downloadSpeed}
                    recommendedId={recommendedId}
                    loading={false}
                    error={null}
                    deviceRamGB={profile?.ramGB ?? null}
                    onSelectModel={selectModel}
                    onDownloadModel={downloadModel}
                    onImportModel={(id: string) => {
                      void importModelFromFile(id);
                    }}
                    onCancelDownload={cancelDownloadModel}
                  />
                )}

                {!profileLoading && !profileError && compatibleModels.length > 0 && selectedModel && (
                  <View style={styles.footer}>
                    {(initLoading || selectedModelStatus === 'initializing' || engineInitializing) && (
                      <View style={styles.downloadingInfo}>
                        <ActivityIndicator size="small" color="#FF6B5E" />
                        <Text style={styles.downloadingText}>Loading model into memory...</Text>
                      </View>
                    )}
                    {selectedModelStatus === 'downloadable' && (
                      <Text style={styles.statusText}>Download the model first, then tap Continue</Text>
                    )}
                    {selectedModelStatus === 'downloading' && (
                      <Text style={styles.statusText}>Downloading model file...</Text>
                    )}
                    <TouchableOpacity
                      style={[styles.continueButton, (!canChat || initLoading) && styles.continueButtonDisabled]}
                      onPress={handleContinuePress}
                      activeOpacity={canChat && !initLoading ? 0.8 : 1}
                      disabled={!canChat || initLoading}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.continueText, (!canChat || initLoading) && styles.continueTextDisabled]}>
                        {selectedModelStatus === 'downloadable'
                          ? 'Download Required'
                          : initLoading
                          ? 'Initializing...'
                          : engineReady
                          ? `Continue with ${selectedModel.displayName}`
                          : `Start with ${selectedModel.displayName}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {selectedModel && (
        <NonRecommendedWarning
          visible={warningVisible}
          stage={warningStage}
          modelName={selectedModel.displayName}
          recommendedName={selectedRecommendedName}
          ramGB={profile?.ramGB ?? null}
          onContinue={handleWarningContinue}
          onCancel={handleWarningCancel}
        />
      )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  header: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FF6B5E',
    marginTop: 4,
    fontWeight: '500',
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  engineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
  },
  messageContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0B8',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#A0A0B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingTop: 8,
    gap: 8,
  },
  continueButton: {
    backgroundColor: '#FF6B5E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#2D2D44',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: '#6B7280',
  },
  downloadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  downloadingText: {
    fontSize: 13,
    color: '#FF8A7E',
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  setupCard: {
    marginTop: 24,
    backgroundColor: '#14141F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
    overflow: 'hidden',
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  setupChevron: {
    fontSize: 14,
    color: '#FF8A7E',
  },
  setupBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
