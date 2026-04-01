'use client';

type EventProperties = Record<string, unknown>;

const SESSION_KEY = 'ai_jobs_funnel_session';

function getSessionId() {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(SESSION_KEY, nextId);
  return nextId;
}

export function trackEvent(eventName: string, properties: EventProperties = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = JSON.stringify({
    eventName,
    sessionId: getSessionId(),
    path: window.location.pathname,
    properties: {
      ...properties,
      referrer: document.referrer || null,
    },
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics', blob);
    return;
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
