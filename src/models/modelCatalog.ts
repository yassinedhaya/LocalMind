import type { OutputFormat } from '../agents/agentTypes';

export interface GemmaModelSpec {
  id: string;
  mlKitName: string;
  displayName: string;
  badge: string;
  description: string;
  minRamGB: number;
  minStorageGB: number;
  minAndroidApi: number;
  supportedOutputFormats: OutputFormat[];
  litertlmFileName: string;
  downloadUrl: string;
}

export const GEMMA_MODEL_CATALOG: GemmaModelSpec[] = [
  {
    id: 'gemma-4-e2b',
    mlKitName: 'gemma-4-e2b',
    displayName: 'Gemma 4 E2B',
    badge: '\u26A1 Fast',
    description: '2.6B parameter model optimized for speed and low latency. Best for text generation, summarization, and classification tasks with minimal resource usage.',
    minRamGB: 6,
    minStorageGB: 1.5,
    minAndroidApi: 24,
    supportedOutputFormats: ['text', 'json', 'steps', 'code'],
    litertlmFileName: 'gemma-4-E2B-it.litertlm',
    downloadUrl: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm',
  },
  {
    id: 'gemma-4-e4b',
    mlKitName: 'gemma-4-e4b',
    displayName: 'Gemma 4 E4B',
    badge: '\uD83E\uDDE0 Reasoning',
    description: '4.6B parameter model with enhanced reasoning capabilities. Ideal for complex Q&A, chain-of-thought reasoning, and nuanced understanding tasks.',
    minRamGB: 6,
    minStorageGB: 2.5,
    minAndroidApi: 24,
    supportedOutputFormats: ['text', 'json', 'steps', 'code'],
    litertlmFileName: 'gemma-4-E4B-it.litertlm',
    downloadUrl: 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm',
  },
];

export function getModelById(id: string): GemmaModelSpec | undefined {
  return GEMMA_MODEL_CATALOG.find((m) => m.id === id);
}

export function getModelByMlKitName(name: string): GemmaModelSpec | undefined {
  return GEMMA_MODEL_CATALOG.find((m) => m.mlKitName === name);
}

export function getRecommendedModel(ramGB: number): GemmaModelSpec | undefined {
  const sorted = [...GEMMA_MODEL_CATALOG].sort((a, b) => a.minRamGB - b.minRamGB);
  for (const m of sorted) {
    if (ramGB >= m.minRamGB) return m;
  }
  return sorted[0];
}
