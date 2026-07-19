import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoice } from '../hooks/useVoice';
import { StitchColors, StitchRadius, StitchShadow, StitchType } from '../theme/stitchTheme';

interface VoiceScreenProps {
  onBack: () => void;
}

export function VoiceScreen({ onBack }: VoiceScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    availability,
    listening,
    transcript,
    rms,
    error,
    exchanges,
    loading,
    streamingText,
    startListening,
    stopListening,
    speakLast,
    speak,
    send,
    ensureEngine,
  } = useVoice();

  const [typed, setTyped] = useState('');

  // Mic pulse animation driven by listening + rms.
  const pulse = useRef(new Animated.Value(1)).current;
  const lastSpokenId = useRef<string | null>(null);

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.12,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
    return () => pulse.setValue(1);
  }, [listening, pulse]);

  const handleTypedSend = useCallback(async () => {
    const q = typed.trim();
    if (!q) return;
    setTyped('');
    await ensureEngine();
    await send(q);
  }, [typed, ensureEngine, send]);

  const handleMic = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  const statusText = listening
    ? transcript
      ? 'Listening…'
      : 'Listening — speak now'
    : availability.stt
    ? 'Tap the mic and speak'
    : 'Voice input unavailable — type below';

  const micScale = listening
    ? Animated.multiply(pulse, new Animated.Value(1 + Math.min(rms / 12, 0.25)))
    : pulse;

  const handleSpeakLast = useCallback(
    (text: string, id: string) => {
      speak(text);
      lastSpokenId.current = id;
      // force a small re-render to show the "speaking" hint
      setTyped((t) => t);
    },
    [speak]
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={StitchColors.bg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Voice</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.micWrap,
            listening && styles.micWrapActive,
            { transform: [{ scale: micScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMic}
            accessibilityLabel={listening ? 'Stop listening' : 'Start voice input'}
            accessibilityRole="button"
          >
            <Text style={styles.micIcon}>{listening ? '■' : '🎤'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.statusText, listening && styles.statusTextLive]}>
          {statusText}
        </Text>

        {(transcript || listening) && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>You said</Text>
            <Text style={styles.transcriptText}>{transcript || '…'}</Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listInner}
          data={exchanges}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <View style={styles.exchange}>
              <View style={styles.bubbleYou}>
                <Text style={styles.youText}>{item.you}</Text>
              </View>
              <View style={styles.bubbleGemma}>
                <Text style={styles.gemmaText}>{item.gemma || '…'}</Text>
                {availability.tts && item.gemma ? (
                  <TouchableOpacity
                    onPress={() => handleSpeakLast(item.gemma, item.id)}
                    style={styles.speakBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.speakText}>
                      {lastSpokenId.current === item.id ? '🔊 Speaking…' : '🔊 Read aloud'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Talk to Gemma</Text>
              <Text style={styles.emptySubtitle}>
                Ask anything. Your words stay on this device.
              </Text>
            </View>
          }
        />
      </View>

      <View style={[styles.inputRow, { paddingBottom: 10 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={typed}
          onChangeText={setTyped}
          placeholder="Type instead…"
          placeholderTextColor={StitchColors.textMuted}
          editable={!loading}
          accessibilityLabel="Voice typed input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!typed.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleTypedSend}
          disabled={!typed.trim() || loading}
          accessibilityLabel="Send typed message"
          accessibilityRole="button"
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: StitchColors.border,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    color: StitchColors.accentSoft,
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: StitchColors.text,
    fontSize: StitchType.title,
    fontWeight: '700',
  },
  headerRight: {
    width: 56,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  micWrap: {
    marginTop: 28,
    width: 132,
    height: 132,
    borderRadius: StitchRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: StitchColors.accentTint,
  },
  micWrapActive: {
    backgroundColor: 'rgba(255, 107, 94, 0.22)',
  },
  micButton: {
    width: 104,
    height: 104,
    borderRadius: StitchRadius.pill,
    backgroundColor: StitchColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...StitchShadow.lift,
  },
  micIcon: {
    fontSize: 42,
    color: StitchColors.onAccent,
  },
  statusText: {
    marginTop: 18,
    fontSize: StitchType.body,
    color: StitchColors.textSecondary,
    textAlign: 'center',
  },
  statusTextLive: {
    color: StitchColors.accentSoft,
    fontWeight: '600',
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: StitchColors.surface,
    borderRadius: StitchRadius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: StitchColors.border,
  },
  transcriptLabel: {
    fontSize: StitchType.caption,
    color: StitchColors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptText: {
    fontSize: StitchType.body,
    color: StitchColors.text,
    lineHeight: 22,
  },
  errorText: {
    color: StitchColors.danger,
    fontSize: StitchType.caption,
    textAlign: 'center',
    marginTop: 10,
  },
  list: {
    flex: 1,
    width: '100%',
    marginTop: 16,
  },
  listInner: {
    paddingVertical: 8,
  },
  exchange: {
    marginBottom: 16,
    width: '100%',
  },
  bubbleYou: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    backgroundColor: StitchColors.accent,
    borderRadius: StitchRadius.md,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  youText: {
    fontSize: StitchType.body,
    color: StitchColors.onAccent,
    fontWeight: '600',
    lineHeight: 20,
  },
  bubbleGemma: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: StitchColors.surface,
    borderRadius: StitchRadius.md,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: StitchColors.border,
  },
  gemmaText: {
    fontSize: StitchType.body,
    color: StitchColors.text,
    lineHeight: 22,
  },
  speakBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: StitchColors.accentTint,
    borderRadius: StitchRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  speakText: {
    fontSize: StitchType.caption,
    color: StitchColors.accentSoft,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: StitchType.heading,
    fontWeight: '700',
    color: StitchColors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: StitchType.body,
    color: StitchColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 21,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: StitchColors.bg,
    borderTopWidth: 1,
    borderTopColor: StitchColors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: StitchColors.surfaceAlt,
    borderRadius: StitchRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: StitchType.body,
    color: StitchColors.text,
    maxHeight: 110,
  },
  sendBtn: {
    backgroundColor: StitchColors.accent,
    borderRadius: StitchRadius.md,
    paddingHorizontal: 22,
    paddingVertical: 12,
    ...StitchShadow.soft,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: StitchColors.onAccent,
    fontSize: StitchType.body,
    fontWeight: '700',
  },
});
