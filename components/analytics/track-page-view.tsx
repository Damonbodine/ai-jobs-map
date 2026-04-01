'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics/client';

export function TrackPageView({
  eventName,
  properties,
}: {
  eventName: string;
  properties?: Record<string, unknown>;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }
    firedRef.current = true;
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}
