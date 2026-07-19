import { GemmaService } from './GemmaService';

type EngineStatus = 'idle' | 'initializing' | 'ready' | 'error';

type StatusListener = (status: EngineStatus, modelId: string | null) => void;

let engine: { modelId: string; initialized: boolean } | null = null;
let status: EngineStatus = 'idle';
let currentModelId: string | null = null;
let initInFlight = false;
const listeners = new Set<StatusListener>();

function emit() {
  for (const l of listeners) {
    l(status, currentModelId);
  }
}

function setStatus(next: EngineStatus) {
  status = next;
  emit();
}

export const EngineManager = {
  isInitialized(): boolean {
    return engine?.initialized === true;
  },

  isInitializing(): boolean {
    return initInFlight || status === 'initializing';
  },

  getStatus(): EngineStatus {
    return status;
  },

  getCurrentModelId(): string | null {
    return engine?.modelId ?? currentModelId;
  },

  addStatusListener(listener: StatusListener): () => void {
    listeners.add(listener);
    listener(status, currentModelId);
    return () => {
      listeners.delete(listener);
    };
  },

  async initEngine(modelId: string): Promise<boolean> {
    if (engine?.initialized && engine.modelId === modelId) {
      return true;
    }
    if (initInFlight) {
      // Another init is already running; wait briefly then re-check.
      for (let i = 0; i < 50; i++) {
        if (engine?.initialized && engine.modelId === modelId) return true;
        if (!initInFlight) break;
        await new Promise<void>((r) => setTimeout(() => r(), 100));
      }
      if (engine?.initialized && engine.modelId === modelId) return true;
    }

    initInFlight = true;
    currentModelId = modelId;
    setStatus('initializing');

    const result = await GemmaService.initEngine(modelId);
    if (result.success) {
      engine = { modelId, initialized: true };
      setStatus('ready');
      initInFlight = false;
      return true;
    }

    engine = null;
    setStatus('error');
    initInFlight = false;
    return false;
  },

  closeEngine(): void {
    engine = null;
    currentModelId = null;
    setStatus('idle');
    GemmaService.closeEngine();
  },
};
