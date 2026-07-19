import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePDF } from '../hooks/usePDF';

interface PdfScreenProps {
  onBack: () => void;
}

export function PdfScreen({ onBack }: PdfScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    doc,
    loadingDoc,
    docError,
    question,
    setQuestion,
    asking,
    answer,
    history,
    pickPdf,
    ask,
    clearDoc,
  } = usePDF();

  const handleAsk = useCallback(() => {
    const q = question.trim();
    if (!q) return;
    ask(q);
    setQuestion('');
  }, [question, ask, setQuestion]);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>PDF Q&amp;A</Text>
        </View>
        {doc ? (
          <TouchableOpacity onPress={clearDoc} accessibilityLabel="Close document" accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {!doc && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Local PDF Q&amp;A</Text>
          <Text style={styles.emptySubtitle}>
            Pick a PDF stored on your device. Text is extracted on-device and sent to the
            local model — nothing leaves your phone.
          </Text>
          <TouchableOpacity
            style={[styles.pickButton, loadingDoc && styles.pickButtonDisabled]}
            onPress={pickPdf}
            disabled={loadingDoc}
            accessibilityLabel="Pick a PDF"
            accessibilityRole="button"
          >
            {loadingDoc ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.pickText}>Choose PDF</Text>
            )}
          </TouchableOpacity>
          {docError && <Text style={styles.errorText}>{docError}</Text>}
        </View>
      )}

      {doc && (
        <>
          <View style={styles.docBar}>
            <Text style={styles.docName} numberOfLines={1}>
              📄 {doc.name}
            </Text>
            <Text style={styles.docMeta}>
              {doc.extracted.pages} page(s) · {doc.extracted.text.length} chars
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
          >
            {history.map((h) => (
              <View key={h.id} style={styles.qaRow}>
                <Text style={styles.qText}>Q: {h.question}</Text>
                <Text style={styles.aText}>{h.answer}</Text>
              </View>
            ))}
            {asking && !answer && (
              <View style={styles.qaRow}>
                <Text style={styles.qText}>…</Text>
                <ActivityIndicator size="small" color="#FF8A7E" />
              </View>
            )}
            {answer && history.length === 0 && (
              <View style={styles.qaRow}>
                <Text style={styles.aText}>{answer}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { paddingBottom: 8 + insets.bottom }]}>
            <TextInput
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about this document..."
              placeholderTextColor="#6B7280"
              editable={!asking}
              accessibilityLabel="PDF question input"
            />
            <TouchableOpacity
              style={[styles.askBtn, (!question.trim() || asking) && styles.askBtnDisabled]}
              onPress={handleAsk}
              disabled={!question.trim() || asking}
              accessibilityLabel="Ask"
              accessibilityRole="button"
            >
              <Text style={styles.askText}>Ask</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FF8A7E',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  pickButton: {
    backgroundColor: '#FF6B5E',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 160,
  },
  pickButtonDisabled: {
    opacity: 0.6,
  },
  pickText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  docBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  qaRow: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  qText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8A7E',
    marginBottom: 6,
  },
  aText: {
    fontSize: 15,
    color: '#E0E0F0',
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#0F0F1A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  askBtn: {
    backgroundColor: '#FF6B5E',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  askBtnDisabled: {
    opacity: 0.4,
  },
  askText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
