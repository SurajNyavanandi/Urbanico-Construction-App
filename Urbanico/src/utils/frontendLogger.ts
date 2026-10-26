/**
 * Global Frontend Error Logger
 * - Completely silent on normal successful operations (zero log clutter).
 * - Intercepts window.onerror, window.onunhandledrejection, and non-2xx API responses.
 * - Prints an exact structured console.error with root cause analysis.
 * - Dispatches a fire-and-forget report to /api/client-errors so Render backend console sees it.
 */

export interface ClientErrorPayload {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  endpoint?: string;
  statusCode?: number | string;
  url?: string;
  component?: string;
  rootCause?: string;
}

let isReporting = false;

function isIgnorableError(msg: string = '', stack: string = ''): boolean {
  const combined = `${msg} ${stack}`.toLowerCase();
  return (
    combined.includes('websocket') ||
    combined.includes('vite-hmr') ||
    combined.includes('ws://') ||
    combined.includes('wss://') ||
    combined.includes('@vite/client')
  );
}

export function reportClientError(error: ClientErrorPayload): void {
  if (isIgnorableError(error.message, error.stack) || isIgnorableError(error.rootCause)) {
    return;
  }

  // Output a high-visibility, structured console error
  console.error('🚨 [Urbanico Frontend Error]', {
    timestamp: new Date().toISOString(),
    message: error.message,
    rootCause: error.rootCause || error.message,
    endpoint: error.endpoint,
    statusCode: error.statusCode,
    url: error.url || (typeof window !== 'undefined' ? window.location.href : ''),
    component: error.component,
    location: error.source ? `${error.source}:${error.lineno}:${error.colno}` : undefined,
    stack: error.stack,
  });

  // Fire-and-forget beacon to backend Render console (avoid recursive logging)
  if (isReporting || typeof window === 'undefined' || !window.fetch) {
    return;
  }

  isReporting = true;
  try {
    const envBackendUrl =
      (import.meta as any)?.env?.VITE_API_URL ||
      (import.meta as any)?.env?.VITE_BACKEND_URI ||
      '';

    const targetUrl = envBackendUrl
      ? `${envBackendUrl.replace(/\/+$/, '')}/api/client-errors`
      : '/api/client-errors';

    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...error,
        timestamp: new Date().toISOString(),
        origin: window.location.origin,
      }),
    })
      .catch(() => {})
      .finally(() => {
        isReporting = false;
      });
  } catch {
    isReporting = false;
  }
}

export function initGlobalFrontendErrorListeners(): void {
  if (typeof window === 'undefined') return;

  // 1. Uncaught runtime JavaScript errors
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = typeof message === 'string' ? message : error?.message || 'Uncaught window error';
    if (isIgnorableError(msg, error?.stack)) {
      return true;
    }
    reportClientError({
      message: msg,
      source: typeof source === 'string' ? source : undefined,
      lineno,
      colno,
      stack: error?.stack,
      rootCause: error?.message || String(message),
      component: 'GlobalWindow',
    });
    return false;
  };

  // 2. Unhandled asynchronous promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || 'Unhandled promise rejection');
    if (isIgnorableError(msg, reason?.stack)) {
      event.preventDefault();
      return;
    }
    reportClientError({
      message: msg,
      stack: reason?.stack,
      rootCause: msg,
      component: 'UnhandledPromise',
    });
  };
}
