export type AnalyzeStreamEvent = {
  type: string;
  message?: string;
  progress?: number;
  section?: string;
  text?: string;
  title?: string;
  [key: string]: unknown;
};

export type AnalyzeStream = (
  params: Record<string, unknown>,
  init?: { signal?: AbortSignal }
) => AsyncGenerator<AnalyzeStreamEvent>;

interface HandleStreamingOptions {
  stream: AnalyzeStream;
  payload: Record<string, unknown>;
  onContent: (text: string) => void;
  onStatus?: (message: string) => void;
  onProgress?: (progress: number) => void;
  onComplete?: (message: string) => void;
  abortController: AbortController;
  completeMessage?: string;
}

/**
 * Handles streaming data from an API endpoint
 * @param options - Configuration options for streaming
 * @throws Will throw an error if the streaming fails (unless it's an abort error)
 */
export async function handleStreaming({
  stream,
  payload,
  onContent,
  onStatus,
  onProgress,
  onComplete,
  abortController,
  completeMessage = 'Complete',
}: HandleStreamingOptions): Promise<void> {
  try {
    for await (const evt of stream(payload, { signal: abortController.signal })) {
      if (evt.type === 'status') {
        const rawMessage = evt.message ?? '';
        if (onStatus) {
          onStatus(rawMessage);
        }
        if (typeof evt.progress === 'number' && onProgress) {
          onProgress(evt.progress);
        }
        continue;
      }

      if (evt.type === 'content') {
        const text = typeof evt.text === 'string' ? evt.text : '';
        onContent(text);
        continue;
      }

      if (evt.type === 'complete') {
        if (onProgress) {
          onProgress(evt.progress ?? 100);
        }
        if (onComplete) {
          onComplete(evt.message ?? completeMessage);
        }
      }
    }
  } catch (error) {
    const isAbortError =
      error instanceof DOMException
        ? error.name === 'AbortError'
        : (error as { name?: string } | null)?.name === 'AbortError';

    if (!isAbortError) {
      throw error;
    }
  }
}
