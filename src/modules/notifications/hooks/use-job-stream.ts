import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/config/auth-client';
import { notificationsService } from '../model/notifications.service';
import {
  JobCompletedEvent,
  JobFailedEvent,
  JobProgressEvent,
} from '../model/notifications.types';

interface UseJobStreamOptions {
  jobId?: string;
  enabled?: boolean;
  onProgress?: (event: JobProgressEvent) => void;
  onCompleted?: (event: JobCompletedEvent) => void;
  onFailed?: (event: JobFailedEvent) => void;
}

export function useJobStream(options: UseJobStreamOptions = {}) {
  const { jobId, enabled = true, onProgress, onCompleted, onFailed } = options;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const activeSourceRef = useRef<EventSource | null>(null);

  const token = (session as any)?.session?.token || (session as any)?.token;

  // Keep references to latest callbacks
  const callbacksRef = useRef({ onProgress, onCompleted, onFailed });
  useEffect(() => {
    callbacksRef.current = { onProgress, onCompleted, onFailed };
  }, [onProgress, onCompleted, onFailed]);

  useEffect(() => {
    if (!enabled || !session?.user) {
      if (activeSourceRef.current) {
        activeSourceRef.current.close();
        activeSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    if (activeSourceRef.current) {
      activeSourceRef.current.close();
      activeSourceRef.current = null;
    }

    const streamUrl = notificationsService.getJobStreamUrl(jobId, token);
    const es = new EventSource(streamUrl, {
      withCredentials: true,
    });
    activeSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener('job_progress', (event: MessageEvent) => {
      try {
        const data: JobProgressEvent = JSON.parse(event.data);
        callbacksRef.current.onProgress?.(data);

        // Invalidate or update jobs cache
        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] });
        }
      } catch (err) {
        console.error('Error parsing job_progress SSE payload:', err);
      }
    });

    es.addEventListener('job_completed', (event: MessageEvent) => {
      try {
        const data: JobCompletedEvent = JSON.parse(event.data);
        callbacksRef.current.onCompleted?.(data);

        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] });
        }
      } catch (err) {
        console.error('Error parsing job_completed SSE payload:', err);
      }
    });

    es.addEventListener('job_failed', (event: MessageEvent) => {
      try {
        const data: JobFailedEvent = JSON.parse(event.data);
        callbacksRef.current.onFailed?.(data);

        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] });
        }
      } catch (err) {
        console.error('Error parsing job_failed SSE payload:', err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      if (activeSourceRef.current) {
        activeSourceRef.current.close();
        activeSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, session?.user?.id, token, jobId, queryClient]);

  return { isConnected };
}
