import type { PlanSelections } from '../types/camperTypes';

let stored: PlanSelections | null = null;

export const CamperStorage = {
  get(): Promise<PlanSelections | null> {
    return Promise.resolve(stored ? { ...stored } : null);
  },

  save(prefs: PlanSelections): Promise<void> {
    stored = { ...prefs };
    return Promise.resolve();
  },

  clear(): Promise<void> {
    stored = null;
    return Promise.resolve();
  },
};
