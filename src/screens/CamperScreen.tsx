import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Keyboard,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGemmaChat } from '../hooks/useGemmaChat';
import { ChatBubble } from '../components/core/ChatBubble';
import { CAMPER_AGENT_CONFIG } from '../agents/camperAgent';
import { TaskStorage } from '../services/TaskStorage';
import { CamperStorage } from '../services/CamperStorage';
import { PLAN_STEPS, prefsToContext, emptySelections } from '../types/camperTypes';
import type { PlanSelections } from '../types/camperTypes';
import type { ChatMessage } from '../components/core/ChatBubble';

interface CamperScreenProps {
  onBack: () => void;
}

type CamperTab = 'chat' | 'log' | 'plan';

const QUICK_ACTIONS = [
  { label: 'Packing List', icon: '📋', prompt: 'Give me a packing checklist for a weekend camping trip' },
  { label: 'Camp Spot', icon: '📍', prompt: 'What should I look for when choosing a campsite?' },
  { label: 'Gear Tip', icon: '🎒', prompt: 'What are the essential gear items for van-life?' },
  { label: 'Route', icon: '🛣️', prompt: 'Suggest a scenic camping route for 3 days' },
];

const STEP_ICONS: Record<string, string> = {
  company: '👥',
  accommodation: '🏕️',
  duration: '📅',
  terrain: '⛰️',
  experience: '🎯',
};

const { width: SCREEN_W } = Dimensions.get('window');

export function CamperScreen({ onBack }: CamperScreenProps) {
  const { messages, streamingText, loading, send, clear } = useGemmaChat(CAMPER_AGENT_CONFIG);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [tab, setTab] = useState<CamperTab>('plan');
  const [inputText, setInputText] = useState('');
  const [logText, setLogText] = useState('');
  const [plan, setPlan] = useState<PlanSelections>(emptySelections);
  const [planStep, setPlanStep] = useState(0);
  const [prefs, setPrefs] = useState<PlanSelections | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    CamperStorage.get().then((p) => {
      if (p) {
        setPrefs(p);
        setPlan(p);
        const filled = Object.values(p).filter(Boolean).length;
        if (filled >= PLAN_STEPS.length) {
          setPlanStep(PLAN_STEPS.length);
        } else {
          setPlanStep(filled);
        }
      }
      setLoaded(true);
    });
  }, []);

  const prefsContext = prefs ? prefsToContext(prefs) : '';

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');
    Keyboard.dismiss();
    send(text, prefsContext || undefined);
  }, [inputText, loading, send, prefsContext]);

  const handleQuickAction = useCallback((prompt: string) => {
    send(prompt, prefsContext || undefined);
  }, [send, prefsContext]);

  const handleLogSave = useCallback(() => {
    const text = logText.trim();
    if (!text) return;
    TaskStorage.create({
      title: `Trip Log - ${new Date().toLocaleDateString()}`,
      description: text,
      priority: 'medium',
      status: 'pending',
      tags: ['camper'],
    });
    setLogText('');
    Alert.alert('Logged', 'Trip entry saved. Check your Tasks.');
  }, [logText]);

  const handlePlanSelect = useCallback((key: keyof PlanSelections, value: string) => {
    setPlan((prev) => {
      const next = { ...prev, [key]: value };
      CamperStorage.save(next);
      return next;
    });
    setPrefs((prev) => prev ? { ...prev, [key]: value } : { ...plan, [key]: value });
    if (planStep < PLAN_STEPS.length - 1) {
      setPlanStep((s) => s + 1);
    }
  }, [planStep, plan]);

  const handlePlanBack = useCallback(() => {
    if (planStep > 0) {
      const prevKey = PLAN_STEPS[planStep].key;
      const next = { ...plan, [prevKey]: null };
      setPlan(next);
      CamperStorage.save(next);
      setPlanStep((s) => s - 1);
    }
  }, [planStep, plan]);

  const handleGeneratePlan = useCallback(() => {
    const prompt = [
      `Create a detailed camping plan with these preferences:`,
      `- Company: ${plan.company}`,
      `- Accommodation: ${plan.accommodation}`,
      `- Duration: ${plan.duration}`,
      `- Terrain: ${plan.terrain}`,
      `- Experience level: ${plan.experience}`,
      ``,
      `Include: gear checklist, activity suggestions, safety tips, and meal ideas.`,
      `Format with clear sections.`,
    ].join('\n');
    setTab('chat');
    send(prompt, prefsContext || undefined);
  }, [plan, send, prefsContext]);

  const handleResetPlan = useCallback(() => {
    const empty = emptySelections();
    setPlan(empty);
    setPrefs(null);
    setPlanStep(0);
    CamperStorage.clear();
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <ChatBubble
        message={item}
        loading={loading}
        streamingText={streamingText}
        isLast={index === messages.length - 1 && item.role === 'assistant'}
      />
    ),
    [loading, streamingText, messages]
  );

  const allSelected = Object.values(plan).every((v) => v !== null);
  const progressPct = allSelected ? 100 : Math.round((planStep / PLAN_STEPS.length) * 100);

  if (!loaded) return null;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F14" />
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camper Mode</Text>
          {tab === 'chat' && messages.length > 0 ? (
            <TouchableOpacity onPress={clear} accessibilityRole="button">
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRight} />
          )}
        </View>

        <View style={styles.tabRow}>
          {(['plan', 'chat', 'log'] as CamperTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              accessibilityRole="button"
            >
              <Text style={[styles.tabIcon]}>{t === 'plan' ? '🎯' : t === 'chat' ? '💬' : '📓'}</Text>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'plan' ? 'My Profile' : t === 'chat' ? 'Chat' : 'Journal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {prefs && tab !== 'plan' && (
          <View style={styles.prefsBar}>
            <Text style={styles.prefsDot}>●</Text>
            <Text style={styles.prefsText} numberOfLines={1}>
              {[prefs.company, prefs.accommodation, prefs.terrain].filter(Boolean).join(' · ')}
            </Text>
            <TouchableOpacity onPress={() => setTab('plan')} accessibilityRole="button">
              <Text style={styles.prefsEdit}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'plan' && (
          <ScrollView style={styles.planContainer} contentContainerStyle={styles.planContent}>
            <View style={styles.planHero}>
              <Text style={styles.planHeroIcon}>🏔️</Text>
              <Text style={styles.planHeroTitle}>Your Camper Profile</Text>
              <Text style={styles.planHeroDesc}>
                Set your preferences once — every answer will be tailored to you
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{progressPct}% complete</Text>

            {PLAN_STEPS.map((step, i) => {
              const isPast = i < planStep;
              const isCurrent = i === planStep;
              const value = plan[step.key];

              if (!isPast && !isCurrent && !value) return null;

              return (
                <View
                  key={step.key}
                  style={[
                    styles.planCard,
                    isCurrent && styles.planCardCurrent,
                    isPast && styles.planCardPast,
                  ]}
                >
                  <View style={styles.planCardTop}>
                    <Text style={styles.planCardIcon}>{STEP_ICONS[step.key]}</Text>
                    <View style={styles.planCardInfo}>
                      <Text style={styles.planStepLabel}>Step {i + 1}</Text>
                      <Text style={styles.planQuestion}>{step.question}</Text>
                    </View>
                    {value && !isCurrent && (
                      <View style={styles.planCheck}>
                        <Text style={styles.planCheckText}>✓</Text>
                      </View>
                    )}
                  </View>

                  {isCurrent && (
                    <View style={styles.planOptionsWrap}>
                      {step.options.map((opt) => {
                        const selected = plan[step.key] === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.planOption, selected && styles.planOptionSelected]}
                            onPress={() => handlePlanSelect(step.key, opt)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                          >
                            <Text style={[styles.planOptionText, selected && styles.planOptionTextSelected]}>
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {isPast && value && (
                    <View style={styles.planAnswerRow}>
                      <Text style={styles.planAnswerLabel}>Selected:</Text>
                      <Text style={styles.planAnswerValue}>{value}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {planStep > 0 && !allSelected && (
              <TouchableOpacity style={styles.planBackBtn} onPress={handlePlanBack} accessibilityRole="button">
                <Text style={styles.planBackText}>← Previous step</Text>
              </TouchableOpacity>
            )}

            {allSelected && (
              <View style={styles.planCta}>
                <Text style={styles.planCtaIcon}>✅</Text>
                <Text style={styles.planCtaTitle}>Profile Complete</Text>
                <Text style={styles.planCtaDesc}>
                  Your preferences will guide every answer. Tap below for a full plan or head to Chat.
                </Text>
                <View style={styles.planCtaActions}>
                  <TouchableOpacity style={styles.planResetBtn} onPress={handleResetPlan} accessibilityRole="button">
                    <Text style={styles.planResetText}>↻ Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.planGenerateBtn} onPress={handleGeneratePlan} accessibilityRole="button">
                    <Text style={styles.planGenerateText}>Generate Plan →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {tab === 'chat' && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickRow}
              contentContainerStyle={styles.quickContent}
            >
              {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={styles.quickBtn}
                  onPress={() => handleQuickAction(a.prompt)}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickLabel}>{a.icon}  {a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              ref={flatListRef}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              extraData={{ loading, streamingText, messagesLength: messages.length }}
              windowSize={7}
              maxToRenderPerBatch={10}
              removeClippedSubviews={true}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏕️</Text>
                  <Text style={styles.emptyTitle}>Camper Chat</Text>
                  <Text style={styles.emptySubtitle}>
                    {prefs
                      ? 'Your profile is ready. Ask about routes, gear, or safety!'
                      : 'Set your camper profile in the Plan tab first.'}
                  </Text>
                  {!prefs && (
                    <TouchableOpacity style={styles.emptyCta} onPress={() => setTab('plan')} accessibilityRole="button">
                      <Text style={styles.emptyCtaText}>Set Up Profile →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />

            <View style={[styles.inputRow, { paddingBottom: 8 + insets.bottom }]}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about camping..."
                placeholderTextColor="#4A8B6B"
                multiline
                editable={!loading}
                accessibilityLabel="Camper chat input"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (loading || !inputText.trim()) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={loading || !inputText.trim()}
                accessibilityRole="button"
              >
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 'log' && (
          <View style={styles.logContainer}>
            <View style={styles.logHero}>
              <Text style={styles.logHeroIcon}>📓</Text>
              <Text style={styles.logTitle}>Trip Journal</Text>
              <Text style={styles.logDesc}>
                Capture your adventures — entries save to your Tasks with a camper tag.
              </Text>
            </View>
            <TextInput
              style={styles.logInput}
              value={logText}
              onChangeText={setLogText}
              placeholder="Today we drove through the mountains and found an amazing spot by the lake..."
              placeholderTextColor="#4A8B6B"
              multiline
              accessibilityLabel="Trip log entry"
            />
            <TouchableOpacity
              style={[styles.logSaveBtn, !logText.trim() && styles.logSaveBtnDisabled]}
              onPress={handleLogSave}
              disabled={!logText.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.logSaveText}>Save to Journal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1F14',
  },
  statusBarBg: {
    backgroundColor: '#0A1F14',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0A1F14',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A3D2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#6EE7B7',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 36,
  },
  headerRight: {
    width: 36,
  },
  clearText: {
    fontSize: 14,
    color: '#F87171',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A3D2A',
    borderRadius: 14,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: '#34D399',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B9C80',
  },
  tabTextActive: {
    color: '#0A1F14',
  },
  prefsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#1A3D2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  prefsDot: {
    fontSize: 8,
    color: '#34D399',
  },
  prefsText: {
    flex: 1,
    fontSize: 12,
    color: '#6EE7B7',
    fontWeight: '500',
  },
  prefsEdit: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '700',
  },
  planContainer: {
    flex: 1,
  },
  planContent: {
    padding: 16,
    paddingBottom: 40,
  },
  planHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planHeroIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  planHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  planHeroDesc: {
    fontSize: 14,
    color: '#6B9C80',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1A3D2A',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B9C80',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
  },
  planCard: {
    backgroundColor: '#1A3D2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D5C4A',
  },
  planCardCurrent: {
    borderColor: '#34D399',
    borderWidth: 2,
    backgroundColor: '#1A3D2A',
  },
  planCardPast: {
    opacity: 0.7,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planCardIcon: {
    fontSize: 28,
  },
  planCardInfo: {
    flex: 1,
  },
  planStepLabel: {
    fontSize: 11,
    color: '#6B9C80',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  planQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCheckText: {
    fontSize: 12,
    color: '#0A1F14',
    fontWeight: '800',
  },
  planOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  planOption: {
    backgroundColor: '#0A1F14',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#2D5C4A',
  },
  planOptionSelected: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  planOptionText: {
    fontSize: 14,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  planOptionTextSelected: {
    color: '#0A1F14',
    fontWeight: '700',
  },
  planAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  planAnswerLabel: {
    fontSize: 12,
    color: '#6B9C80',
    fontWeight: '500',
  },
  planAnswerValue: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: '700',
  },
  planBackBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  planBackText: {
    fontSize: 14,
    color: '#6B9C80',
    fontWeight: '600',
  },
  planCta: {
    backgroundColor: '#1A3D2A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34D399',
    marginTop: 4,
  },
  planCtaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  planCtaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  planCtaDesc: {
    fontSize: 13,
    color: '#6B9C80',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  planCtaActions: {
    flexDirection: 'row',
    gap: 12,
  },
  planResetBtn: {
    backgroundColor: '#0A1F14',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2D5C4A',
  },
  planResetText: {
    fontSize: 14,
    color: '#6B9C80',
    fontWeight: '600',
  },
  planGenerateBtn: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  planGenerateText: {
    fontSize: 14,
    color: '#0A1F14',
    fontWeight: '800',
  },
  quickRow: {
    maxHeight: 44,
    marginVertical: 4,
  },
  quickContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  quickBtn: {
    backgroundColor: '#1A3D2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2D5C4A',
  },
  quickLabel: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B9C80',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyCta: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontSize: 14,
    color: '#0A1F14',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#0A1F14',
    borderTopWidth: 1,
    borderTopColor: '#1A3D2A',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A3D2A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#34D399',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontSize: 15,
    color: '#0A1F14',
    fontWeight: '800',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  logHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  logHeroIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  logDesc: {
    fontSize: 13,
    color: '#6B9C80',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  logInput: {
    backgroundColor: '#1A3D2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 180,
    textAlignVertical: 'top',
    lineHeight: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D5C4A',
  },
  logSaveBtn: {
    backgroundColor: '#34D399',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logSaveBtnDisabled: {
    backgroundColor: '#1A3D2A',
    opacity: 0.5,
  },
  logSaveText: {
    fontSize: 16,
    color: '#0A1F14',
    fontWeight: '800',
  },
});
