import { useCallback, useRef, useState } from 'react';
import type { ChatMessage } from '../components/core/ChatBubble';
import type { DetectedOutput } from '../types/outputTypes';
import type { AgentConfig } from '../agents/agentTypes';
import { detectOutputType } from '../services/OutputDetector';
import { GemmaService } from '../services/GemmaService';
import { CHAT_AGENT_CONFIG } from '../agents/chatAgent';
import { buildPrompt } from '../agents/promptBuilder';
import { onGenerateToken, onGenerateComplete, removeGenerateListeners } from '../native/GemmaBridge';

export interface UseGemmaChatState {
  messages: ChatMessage[];
  streamingText: string;
  loading: boolean;
  detectedOutput: DetectedOutput | null;
  send: (text: string, context?: string) => Promise<void>;
  clear: () => void;
  dismissOutput: () => void;
  setDetectedOutput: (detected: DetectedOutput | null) => void;
}

let messageCounter = 0;

function nextId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}-${Date.now()}`;
}

export function useGemmaChat(agentConfig?: AgentConfig): UseGemmaChatState {
  const config = agentConfig ?? CHAT_AGENT_CONFIG;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedOutput, setDetectedOutput] = useState<DetectedOutput | null>(null);
  const abortRef = useRef(false);
  const firstMsgRef = useRef(false);

  const send = useCallback(async (text: string, context?: string) => {
    abortRef.current = false;

    const userMessage: ChatMessage = {
      id: nextId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreamingText('');
    setLoading(true);
    setDetectedOutput(null);

    let accumulated = '';
    const streamingDone = new Promise<string>((resolve) => {
      onGenerateToken((token: string) => {
        accumulated += token;
        setStreamingText(accumulated);
      });
      onGenerateComplete((fullText: string) => {
        resolve(fullText);
      });
    });

    let prompt: string;
    if (!firstMsgRef.current) {
      firstMsgRef.current = true;
      prompt = buildPrompt(config, text, context);
    } else {
      prompt = text;
    }

    const result = await GemmaService.generateRaw(prompt);

    if (abortRef.current) {
      setLoading(false);
      removeGenerateListeners();
      return;
    }

    const fullText = result.success ? await streamingDone : '';

    removeGenerateListeners();

    if (result.success) {
      setStreamingText(fullText);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, text: fullText };
        }
        return updated;
      });

      const detected = detectOutputType(fullText);
      setDetectedOutput(detected.confidence >= 0.4 ? detected : null);
    } else {
      const errorMsg = result.error;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            text: `Error: ${errorMsg}`,
          };
        }
        return updated;
      });
    }

    setStreamingText('');
    setLoading(false);
  }, [config]);

  const clear = useCallback(() => {
    abortRef.current = true;
    firstMsgRef.current = false;
    messageCounter = 0;
    removeGenerateListeners();
    setMessages([]);
    setStreamingText('');
    setDetectedOutput(null);
  }, []);

  const dismissOutput = useCallback(() => {
    setDetectedOutput(null);
  }, []);

  return {
    messages,
    streamingText,
    loading,
    detectedOutput,
    send,
    clear,
    dismissOutput,
    setDetectedOutput,
  };
}
