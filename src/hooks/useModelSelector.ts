import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { GemmaModelSpec } from '../models/modelCatalog';
import { getRecommendedModel } from '../models/modelCatalog';
import { GemmaService } from '../services/GemmaService';
import { EngineManager } from '../services/EngineManager';
import { pickImportFile } from '../native/GemmaBridge';

export type ModelStatus = 'unknown' | 'available' | 'downloadable' | 'downloading' | 'initializing' | 'unavailable';

export interface UseModelSelectorState {
  selectedModel: GemmaModelSpec | null;
  compatibleModels: GemmaModelSpec[];
  modelStatuses: Record<string, ModelStatus>;
  downloadProgress: Record<string, number>;
  downloadSpeed: Record<string, number>;
  recommendedId: string | null;
  selectModel: (id: string) => void;
  downloadModel: (id: string) => Promise<void>;
  cancelDownloadModel: (id: string) => Promise<void>;
  initEngine: (id: string) => Promise<boolean>;
  importModelFromFile: (id: string, fileUri?: string) => Promise<void>;
  autoSelectDone: boolean;
}

export function useModelSelector(
  compatibleModels: GemmaModelSpec[],
  deviceRamGB: number | null
): UseModelSelectorState {
  const [selectedModel, setSelectedModel] = useState<GemmaModelSpec | null>(null);
  const [autoSelectDone, setAutoSelectDone] = useState<boolean>(false);
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatus>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadSpeed, setDownloadSpeed] = useState<Record<string, number>>({});
  const downloadingIdRef = useRef<string | null>(null);

  const sortedModels = useMemo(() => {
    return [...compatibleModels].sort((a, b) => a.minRamGB - b.minRamGB);
  }, [compatibleModels]);

  const recommendedId = useMemo(() => {
    if (deviceRamGB == null) return null;
    return getRecommendedModel(deviceRamGB)?.id ?? null;
  }, [deviceRamGB]);

  useEffect(() => {
    if (compatibleModels.length > 0 && !autoSelectDone) {
      const best = GemmaService.selectBestModel(compatibleModels);
      if (best) {
        setSelectedModel(best);
      }
      setAutoSelectDone(true);
    }
  }, [compatibleModels, autoSelectDone]);

  useEffect(() => {
    if (compatibleModels.length === 0) return;
    for (const model of compatibleModels) {
      setModelStatuses((prev) => ({ ...prev, [model.id]: 'unknown' }));
      GemmaService.checkModelExists(model.mlKitName).then((res) => {
        if (res.success) {
          setModelStatuses((prev) => ({
            ...prev,
            [model.id]: res.data === 'DOWNLOADED' ? 'available' : 'downloadable',
          }));
        } else {
          setModelStatuses((prev) => ({ ...prev, [model.id]: 'downloadable' }));
        }
      });
    }
  }, [compatibleModels]);

  useEffect(() => {
    const module = NativeModules.GemmaModule;
    if (!module) return;
    const emitter = new NativeEventEmitter(module);
    const sub = emitter.addListener('DownloadProgress', (event: { percent: number; speedMBs?: number }) => {
      const id = downloadingIdRef.current;
      if (id) {
        setDownloadProgress((prev) => ({ ...prev, [id]: event.percent }));
        if (event.speedMBs != null) {
          setDownloadSpeed((prev) => ({ ...prev, [id]: event.speedMBs! }));
        }
      }
    });
    return () => sub.remove();
  }, []);

  const selectModel = useCallback(
    (id: string) => {
      const model = compatibleModels.find((m) => m.id === id);
      if (model) {
        setSelectedModel(model);
      }
    },
    [compatibleModels]
  );

  const downloadModel = useCallback(async (id: string) => {
    setModelStatuses((prev) => ({ ...prev, [id]: 'downloading' }));
    setDownloadProgress((prev) => ({ ...prev, [id]: 0 }));
    downloadingIdRef.current = id;
    const model = compatibleModels.find((m) => m.id === id);
    const res = await GemmaService.downloadModelFile(model?.mlKitName ?? id);
    downloadingIdRef.current = null;
    if (res.success) {
      setModelStatuses((prev) => ({ ...prev, [id]: 'available' }));
      setDownloadProgress((prev) => ({ ...prev, [id]: 100 }));
    } else {
      setModelStatuses((prev) => ({ ...prev, [id]: 'downloadable' }));
      setDownloadProgress((prev) => ({ ...prev, [id]: 0 }));
    }
  }, [compatibleModels]);

  const cancelDownloadModel = useCallback(async (id: string) => {
    await GemmaService.cancelDownload(id);
    setModelStatuses((prev) => ({ ...prev, [id]: 'downloadable' }));
    setDownloadProgress((prev) => ({ ...prev, [id]: 0 }));
    setDownloadSpeed((prev) => ({ ...prev, [id]: 0 }));
    downloadingIdRef.current = null;
  }, []);

  const initEngineCb = useCallback(async (id: string): Promise<boolean> => {
    if (EngineManager.isInitialized()) {
      return true;
    }
    setModelStatuses((prev) => ({ ...prev, [id]: 'initializing' }));
    const res = await EngineManager.initEngine(id);
    if (res) {
      setModelStatuses((prev) => ({ ...prev, [id]: 'available' }));
      return true;
    }
    setModelStatuses((prev) => ({ ...prev, [id]: 'available' }));
    return false;
  }, []);

  const importModelFromFile = useCallback(async (id: string, fileUri?: string) => {
    try {
      setModelStatuses((prev) => ({ ...prev, [id]: 'downloading' }));
      let uri = fileUri;
      if (!uri) {
        const picked = await pickImportFile('*/*');
        if (!picked) {
          setModelStatuses((prev) => ({ ...prev, [id]: 'downloadable' }));
          return;
        }
        uri = picked.path;
      }
      const res = await GemmaService.importModelFromFile(id, uri);
      if (res.success) {
        setModelStatuses((prev) => ({ ...prev, [id]: 'available' }));
      } else {
        setModelStatuses((prev) => ({ ...prev, [id]: 'downloadable' }));
      }
    } catch (e) {
      setModelStatuses((prev) => ({ ...prev, [id]: 'downloadable' }));
    }
  }, []);

  return {
    selectedModel,
    compatibleModels: sortedModels,
    modelStatuses,
    downloadProgress,
    downloadSpeed,
    recommendedId,
    selectModel,
    downloadModel,
    cancelDownloadModel,
    initEngine: initEngineCb,
    importModelFromFile,
    autoSelectDone,
  };
}
