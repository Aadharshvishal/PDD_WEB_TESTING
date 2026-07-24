import { Injectable } from '@angular/core';

export interface ScanRecord {
  patientId: string;
  date: string;
  category: 'Optical Scan' | 'Symptom Quiz';
  riskLevel: 'High Risk' | 'Suspicious' | 'Normal';
  confidence: number;
  rawScore: number;
  clinician: string;
  recommendation: string;
  imageDataUrl?: string;
  signatureDataUrl?: string;
  isQuestionnaire?: boolean;
}

const KEYS = {
  workerId: '@oscc_worker_id',
  pinPrefix: '@oscc_pin_',
  history: '@oscc_scan_history',
  theme: '@oscc_theme',
  apiUrl: '@oscc_api_url',
  useLiveApi: '@oscc_use_live_api'
};

@Injectable({ providedIn: 'root' })
export class StorageService {

  private safeGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — fail silently, app continues in-memory only */
    }
  }

  private safeRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  // ---- Session / Auth ----
  getWorkerId(): string | null {
    return this.safeGet(KEYS.workerId);
  }

  setWorkerId(id: string): void {
    this.safeSet(KEYS.workerId, id);
  }

  clearWorkerId(): void {
    this.safeRemove(KEYS.workerId);
  }

  getPin(workerId: string): string | null {
    return this.safeGet(KEYS.pinPrefix + workerId.toLowerCase());
  }

  setPin(workerId: string, pin: string): void {
    this.safeSet(KEYS.pinPrefix + workerId.toLowerCase(), pin);
  }

  pinExists(workerId: string): boolean {
    return this.getPin(workerId) !== null;
  }

  // ---- Scan history ----
  getHistory(): ScanRecord[] {
    const raw = this.safeGet(KEYS.history);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveHistory(records: ScanRecord[]): void {
    try {
      this.safeSet(KEYS.history, JSON.stringify(records));
    } catch {
      /* quota exceeded or serialization failure — ignore */
    }
  }

  addRecord(record: ScanRecord): void {
    const current = this.getHistory();
    current.unshift(record);
    this.saveHistory(current);
  }

  clearHistory(): void {
    this.safeRemove(KEYS.history);
  }

  // ---- Theme ----
  getTheme(): 'light' | 'dark' {
    return this.safeGet(KEYS.theme) === 'dark' ? 'dark' : 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.safeSet(KEYS.theme, theme);
  }

  // ---- API config ----
  getApiUrl(): string {
    return this.safeGet(KEYS.apiUrl) || 'http://localhost:5000';
  }

  setApiUrl(url: string): void {
    this.safeSet(KEYS.apiUrl, url);
  }

  getUseLiveApi(): boolean {
    return this.safeGet(KEYS.useLiveApi) === 'true';
  }

  setUseLiveApi(value: boolean): void {
    this.safeSet(KEYS.useLiveApi, value ? 'true' : 'false');
  }
}
