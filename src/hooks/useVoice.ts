import { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceService, getVoiceAvailability, VoiceAvailability } from '../services/VoiceService';
import { useGemmaChat } from './useGemmaChat';
import { CHAT_AGENT_CONFIG } from '../agents/chatAgent';
import { EngineManager } from '../services/EngineManager';

export interface VoiceExchange {
  id: string;
  you: string;
  gemma: string;
}

export function useVoice() {
  const [availability, setAvailability] = useState<VoiceAvailability>({
    stt: false,
    tts: false,
  });
  const { messages, loading, send, streamingText } = useGemmaChat(CHAT_AGENT_CONFIG);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [rms, setRms] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<VoiceExchange[]>([]);
  const listeningRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    getVoiceAvailability().then((a) => {
      if (mounted) setAvailability(a);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const ensureEngine = useCallback(async () => {
    const modelId = EngineManager.getCurrentModelId();
    if (modelId && !EngineManager.isInitialized()) {
      await EngineManager.initEngine(modelId);
    }
  }, []);

  // Clean up any active recognition when the screen unmounts.
  useEffect(() => {
    return () => {
      listeningRef.current = false;
      VoiceService.stopListening().catch(() => {});
    };
  }, []);

  const startListening = useCallback(async () => {
    if (listeningRef.current) return;
    setError(null);
    setTranscript('');
    setRms(0);
    listeningRef.current = true;
    setListening(true);
    await VoiceService.startListening(
      (partial) => setTranscript(partial),
      async (finalText) => {
        listeningRef.current = false;
        setListening(false);
        setRms(0);
        await VoiceService.stopListening();
        setTranscript(finalText);
        if (finalText.trim()) {
          await ensureEngine();
          await send(finalText);
        }
      },
      async (e) => {
        listeningRef.current = false;
        setListening(false);
        setRms(0);
        await VoiceService.stopListening();
        setError(e);
      }
    );
  }, [ensureEngine, send]);

  const stopListening = useCallback(async () => {
    listeningRef.current = false;
    setListening(false);
    setRms(0);
    await VoiceService.stopListening();
  }, []);

  const speak = useCallback((text: string) => {
    VoiceService.speak(text);
  }, []);

  const speakLast = useCallback(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant') {
      VoiceService.speak(last.text || streamingText);
    }
  }, [messages, streamingText]);

  // Build exchange history from messages for display.
  const history: VoiceExchange[] = [];
  for (let i = 0; i + 1 < messages.length; i += 2) {
    const you = messages[i];
    const gemma = messages[i + 1];
    if (you && you.role === 'user' && gemma && gemma.role === 'assistant') {
      history.push({
        id: `ve-${you.id}`,
        you: you.text,
        gemma: gemma.text ?? (loading && gemma ? streamingText : ''),
      });
    }
  }

  return {
    availability,
    listening,
    transcript,
    rms,
    error,
    exchanges: history,
    loading,
    streamingText,
    startListening,
    stopListening,
    speakLast,
    speak,
    send,
    ensureEngine,
  };
}
