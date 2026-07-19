import { useEffect, useRef, useState } from 'react';
import { GemmaService } from '../services/GemmaService';
import { EngineManager } from '../services/EngineManager';
import { getRecommendedModel } from '../models/modelCatalog';

/**
 * On app launch, if a model is already downloaded to the device, begin
 * initializing the engine in the background so the first chat/camper
 * interaction feels instant. Non-blocking: the UI stays responsive.
 */
export function useEagerEngineInit() {
  const [status, setStatus] = useState(EngineManager.getStatus());
  const startedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = EngineManager.addStatusListener(setStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      const profileResult = await GemmaService.getDeviceProfile();
      if (cancelled || !profileResult.success) return;

      const { profile, compatibleModels } = profileResult.data;
      if (compatibleModels.length === 0) return;

      // Check which models are already downloaded.
      const statuses = await Promise.all(
        compatibleModels.map(async (m) => {
          const res = await GemmaService.checkModelExists(m.mlKitName);
          return { model: m, downloaded: res.success && res.data === 'DOWNLOADED' };
        })
      );

      const downloaded = statuses.filter((s) => s.downloaded).map((s) => s.model);
      if (downloaded.length === 0) return;

      // Prefer the recommended model for this device, else the smallest.
      const recommended = profile.ramGB != null ? getRecommendedModel(profile.ramGB) : undefined;
      const target =
        downloaded.find((m) => recommended && m.id === recommended.id) ?? downloaded[0];

      if (target) {
        await EngineManager.initEngine(target.id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, isReady: status === 'ready', isInitializing: status === 'initializing' };
}
