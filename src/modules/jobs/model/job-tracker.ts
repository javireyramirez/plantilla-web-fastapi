import { notificationsService } from '@/modules/notifications/model/notifications.service';
import {
  JobProgressEvent,
} from '@/modules/notifications/model/notifications.types';

export interface TrackJobOptions {
  onProgress?: (event: JobProgressEvent) => void;
  onCompleted?: (result: any) => void;
  onFailed?: (error: string | null) => void;
  timeoutMs?: number;
}

/**
 * Triggers an immediate browser download for a given URL (e.g. S3/MinIO presigned download_url).
 */
export function triggerFileDownload(url: string, filename?: string) {
  const link = document.createElement('a');
  link.href = url;
  if (filename) {
    link.setAttribute('download', filename);
  }
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Connects to the SSE stream for a specific background job, notifying callbacks
 * on progress, completion, or failure. Closes cleanly on terminal states.
 */
export function trackJob(jobId: string, options: TrackJobOptions = {}): () => void {
  const { onProgress, onCompleted, onFailed, timeoutMs = 600000 } = options;

  const streamUrl = notificationsService.getJobStreamUrl(jobId);
  const es = new EventSource(streamUrl, {
    withCredentials: true,
  });

  let isClosed = false;

  const closeStream = () => {
    if (!isClosed) {
      isClosed = true;
      es.close();
    }
  };

  // Guard against hanging connections
  const timeoutTimer = setTimeout(() => {
    closeStream();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutTimer);
    closeStream();
  };

  const handleProgress = (event: MessageEvent) => {
    try {
      const raw = JSON.parse(event.data);
      const data: JobProgressEvent = {
        job_id: raw.job_id || jobId,
        progress:
          typeof raw.progress === 'number'
            ? raw.progress
            : typeof raw.progress_pct === 'number'
              ? raw.progress_pct
              : Number(raw.progress) || 0,
        progress_message: raw.progress_message ?? raw.current_step ?? raw.message ?? null,
        status: raw.status || 'RUNNING',
      };
      onProgress?.(data);
    } catch (err) {
      console.error('Error parsing SSE job progress payload:', err);
    }
  };

  const handleCompleted = (event: MessageEvent) => {
    try {
      const raw = JSON.parse(event.data);
      const result = raw.result ?? raw;
      onCompleted?.(result);
    } catch (err) {
      console.error('Error parsing SSE job completed payload:', err);
    } finally {
      cleanup();
    }
  };

  const handleFailed = (event: MessageEvent) => {
    try {
      const raw = JSON.parse(event.data);
      const errorMsg = raw.error ?? raw.message ?? null;
      onFailed?.(errorMsg);
    } catch (err) {
      console.error('Error parsing SSE job failed payload:', err);
    } finally {
      cleanup();
    }
  };

  es.addEventListener('job_progress', handleProgress);
  es.addEventListener('job.progress', handleProgress);

  es.addEventListener('job_completed', handleCompleted);
  es.addEventListener('job.completed', handleCompleted);

  es.addEventListener('job_failed', handleFailed);
  es.addEventListener('job.failed', handleFailed);

  es.onerror = () => {
    // EventSource handles automatic retries on network blips
  };

  return cleanup;
}
