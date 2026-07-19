import { useCallback, useEffect, useState } from 'react';
import type { DeviceProfile } from '../agents/agentTypes';
import type { GemmaModelSpec } from '../models/modelCatalog';
import { GemmaService } from '../services/GemmaService';

export interface UseDeviceProfileState {
  profile: DeviceProfile | null;
  compatibleModels: GemmaModelSpec[];
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => void;
}

export function useDeviceProfile(): UseDeviceProfileState {
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [compatibleModels, setCompatibleModels] = useState<GemmaModelSpec[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    const result = await GemmaService.getDeviceProfile();

    if (result.success) {
      console.log('Setting profile:', JSON.stringify(result.data.profile));
      console.log('Setting models:', result.data.compatibleModels.length);
      setProfile(result.data.profile);
      setCompatibleModels(result.data.compatibleModels);
    } else {
      console.log('Error:', result.error, result.errorCode);
      setError(result.error);
      setErrorCode(result.errorCode);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return {
    profile,
    compatibleModels,
    loading,
    error,
    errorCode,
    refresh: check,
  };
}
