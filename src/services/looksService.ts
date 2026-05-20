import type { OutfitData } from '../types';

export interface SavedLook {
  id: string;
  title: string;
  occasion: string;
  savedAt: string;
  outfitData: OutfitData;
}

const KEY = 'glowstyle_saved_looks_v1';
let _mem: SavedLook[] = [];

function _load(): SavedLook[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return _mem;
}

function _persist(looks: SavedLook[]): void {
  _mem = looks;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(looks));
    }
  } catch {}
}

export function getSavedLooks(): SavedLook[] {
  return _load();
}

export function saveLook({ outfitData, occasion }: { outfitData: OutfitData; occasion?: string }): SavedLook {
  const looks = _load();
  const entry: SavedLook = {
    id:         `look_${Date.now()}`,
    title:      outfitData.outfit_title,
    occasion:   occasion ?? '',
    savedAt:    new Date().toISOString(),
    outfitData,
  };
  const updated = [entry, ...looks];
  _persist(updated);
  return entry;
}

export function deleteLook(id: string): void {
  const updated = _load().filter(l => l.id !== id);
  _persist(updated);
}
