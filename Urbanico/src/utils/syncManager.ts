/**
 * Real-Time Cross-Tab Synchronization & Offline Mutation Manager
 * Emulates high-frequency sync between devices/tabs, offline background queues,
 * and live stock reservation timeouts across Web, React Native, and Mobile.
 */
import { safeStorage } from './safeStorage';

type SyncEventType =
  | 'CART_UPDATED'
  | 'SAVED_FOR_LATER_UPDATED'
  | 'FAVORITES_UPDATED'
  | 'PROFILE_UPDATED'
  | 'ORDER_STATUS_CHANGED'
  | 'STOCK_EXPIRED';

interface SyncMessage {
  type: SyncEventType;
  payload: any;
  senderTabId: string;
  timestamp: number;
}

const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && typeof (window as any).BroadcastChannel !== 'undefined') {
    broadcastChannel = new (window as any).BroadcastChannel('urbanico_multidevice_sync');
  }
} catch {
  // BroadcastChannel not supported in this environment
}

type SyncCallback = (event: SyncMessage) => void;
const listeners: Set<SyncCallback> = new Set();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data && event.data.senderTabId !== TAB_ID) {
      listeners.forEach((cb) => {
        try {
          cb(event.data);
        } catch (err) {
          console.error('Sync listener error:', err);
        }
      });
    }
  };
}

// Fallback to localStorage storage event for older browser engines
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  try {
    window.addEventListener('storage', (e: any) => {
      if (e && e.key === 'urbanico_sync_event' && e.newValue) {
        try {
          const parsed: SyncMessage = JSON.parse(e.newValue);
          if (parsed && parsed.senderTabId !== TAB_ID) {
            listeners.forEach((cb) => cb(parsed));
          }
        } catch {
          // ignore parse error
        }
      }
    });
  } catch {
    // ignore
  }
}

export const syncManager = {
  getTabId: () => TAB_ID,

  broadcast: (type: SyncEventType, payload: any) => {
    const msg: SyncMessage = {
      type,
      payload,
      senderTabId: TAB_ID,
      timestamp: Date.now(),
    };

    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(msg);
      } catch {}
    }

    try {
      safeStorage.setItem('urbanico_sync_event', JSON.stringify(msg));
    } catch {
      // quota or private mode fallback
    }
  },

  subscribe: (callback: SyncCallback) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  // Offline Mutation Queue
  enqueueMutation: (action: string, data: any) => {
    try {
      const existingStr = safeStorage.getItem('urbanico_offline_queue');
      const queue = existingStr ? JSON.parse(existingStr) : [];
      queue.push({
        id: 'mut_' + Date.now(),
        action,
        data,
        timestamp: Date.now(),
      });
      safeStorage.setItem('urbanico_offline_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to enqueue offline mutation', e);
    }
  },

  getOfflineQueue: (): { id: string; action: string; data: any; timestamp: number }[] => {
    try {
      const existingStr = safeStorage.getItem('urbanico_offline_queue');
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  },

  clearOfflineQueue: () => {
    try {
      safeStorage.removeItem('urbanico_offline_queue');
    } catch {
      // ignore
    }
  },

  // Stock Reservation Expiry Timer (10 minutes)
  getStockReservationRemainingSeconds: (cartCreatedAt?: number): number => {
    const now = Date.now();
    const startTime = cartCreatedAt || now;
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const elapsed = now - startTime;
    const remainingMs = Math.max(0, TEN_MINUTES_MS - elapsed);
    return Math.floor(remainingMs / 1000);
  },

  // Audio Chime notification with safe audio context resume and unlock
  playNotificationSound: () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        // Clean up context after sound stops
        setTimeout(() => {
          try {
            if (ctx.state !== 'closed') {
              ctx.close().catch(() => {});
            }
          } catch {}
        }, 500);
      }
    } catch {
      // Audio context might be restricted before first user interaction
    }
  },
};
