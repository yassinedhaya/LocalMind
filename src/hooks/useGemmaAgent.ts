import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentConfig, AgentResponse } from '../agents/agentTypes';
import { GemmaService } from '../services/GemmaService';

export interface UseGemmaAgentState {
  response: AgentResponse | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  engineReady: boolean;
  send: (
    agentConfig: AgentConfig,
    userInput: string,
    context?: string
  ) => Promise<void>;
  reset: () => void;
}

export function useGemmaAgent(): UseGemmaAgentState {
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState<boolean>(true);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      GemmaService.closeEngine();
    };
  }, []);

  const send = useCallback(
    async (
      agentConfig: AgentConfig,
      userInput: string,
      context?: string
    ) => {
      abortRef.current = false;
      setLoading(true);
      setError(null);
      setErrorCode(null);
      setResponse(null);

      const result = await GemmaService.runAgent(
        agentConfig,
        userInput,
        context
      );

      if (abortRef.current) {
        setLoading(false);
        return;
      }

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error);
        setErrorCode(result.errorCode);
      }

      setLoading(false);
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setResponse(null);
    setLoading(false);
    setError(null);
    setErrorCode(null);
  }, []);

  return {
    response,
    loading,
    error,
    errorCode,
    engineReady,
    send,
    reset,
  };
}
