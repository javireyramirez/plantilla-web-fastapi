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
  const [hasError, setHasError] = useState(false);
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

    setHasError(false);
    const streamUrl = notificationsService.getJobStreamUrl(jobId, token);
    const es = new EventSource(streamUrl, {
      withCredentials: true,
    });
    activeSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setHasError(false);
    };

    const handleProgress = (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data);
        const data: JobProgressEvent = {
          job_id: raw.job_id || jobId || '',
          progress:
            typeof raw.progress === 'number'
              ? raw.progress
              : typeof raw.progress_pct === 'number'
                ? raw.progress_pct
                : Number(raw.progress) || 0,
          progress_message: raw.progress_message ?? raw.current_step ?? raw.message ?? null,
          status: raw.status || 'RUNNING',
        };
        callbacksRef.current.onProgress?.(data);

        // Invalidate or update jobs cache
        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }
      } catch (err) {
        console.error('Error parsing job progress SSE payload:', err);
      }
    };

    const handleCompleted = (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data);
        const data: JobCompletedEvent = {
          job_id: raw.job_id || jobId || '',
          status: raw.status || 'COMPLETED',
          result: raw.result ?? raw,
        };
        callbacksRef.current.onCompleted?.(data);

        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }

        // Cierre explícito del stream en estado terminal
        es.close();
        if (activeSourceRef.current === es) {
          activeSourceRef.current = null;
        }
        setIsConnected(false);
      } catch (err) {
        console.error('Error parsing job completed SSE payload:', err);
      }
    };

    const handleFailed = (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data);
        const data: JobFailedEvent = {
          job_id: raw.job_id || jobId || '',
          status: raw.status || 'FAILED',
          error: raw.error ?? raw.message ?? null,
        };
        callbacksRef.current.onFailed?.(data);

        if (data.job_id) {
          queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', data.job_id] });
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }

        // Cierre explícito del stream en estado terminal
        es.close();
        if (activeSourceRef.current === es) {
          activeSourceRef.current = null;
        }
        setIsConnected(false);
      } catch (err) {
        console.error('Error parsing job failed SSE payload:', err);
      }
    };

    // Listeners duales: notación snake_case y dot notation
    es.addEventListener('job_progress', handleProgress);
    es.addEventListener('job.progress', handleProgress);

    es.addEventListener('job_completed', handleCompleted);
    es.addEventListener('job.completed', handleCompleted);

    es.addEventListener('job_failed', handleFailed);
    es.addEventListener('job.failed', handleFailed);

    es.onerror = () => {
      setIsConnected(false);
      setHasError(true);
    };

    return () => {
      if (activeSourceRef.current) {
        activeSourceRef.current.close();
        activeSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, session?.user?.id, token, jobId, queryClient]);

  return { isConnected, hasError };
}
