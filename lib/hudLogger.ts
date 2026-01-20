type LogPayload = Record<string, unknown>;
export const HUD_PAN_EVENT = 'hud:pan';

export interface HudLogEntry {
  id: string;
  label: string;
  tag: 'PAN' | 'PAN*';
  timestamp: string;
  payload: LogPayload;
}

const readDebugFlag = (key: string) => {
  if (typeof window === 'undefined') return false;
  const globalFlag = (window as Record<string, unknown>)[key];
  if (typeof globalFlag === 'boolean') return globalFlag;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const shouldLogPan = (verbose: boolean) => {
  if (verbose) return readDebugFlag('HUD_DEBUG_PAN_VERBOSE');
  return readDebugFlag('HUD_DEBUG_PAN') || readDebugFlag('HUD_DEBUG_PAN_VERBOSE');
};

export const logPanEvent = (label: string, payload: LogPayload, verbose = false) => {
  if (!shouldLogPan(verbose)) return;
  const includeStack = readDebugFlag('HUD_DEBUG_PAN_STACK');
  const tag = verbose ? 'PAN*' : 'PAN';
  const timestamp = new Date().toISOString();
  if (typeof window !== 'undefined') {
    const detail: HudLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      tag,
      timestamp,
      payload: includeStack ? { ...payload, stack: new Error().stack } : payload
    };
    window.dispatchEvent(new CustomEvent(HUD_PAN_EVENT, { detail }));
  }
  console.groupCollapsed(`[HUD][${tag}] ${label}`);
  if (includeStack) {
    console.log({ timestamp, ...payload, stack: new Error().stack });
  } else {
    console.log({ timestamp, ...payload });
  }
  console.groupEnd();
};
