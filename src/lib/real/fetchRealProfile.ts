import { FloatProfilesPayload } from '../../types/argo';

interface FetchRealProfilesOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function fetchRealProfiles(floatId: string, options: FetchRealProfilesOptions = {}): Promise<FloatProfilesPayload> {
  const { signal, timeoutMs = 10000 } = options;
  const requestController = new AbortController();
  const timeoutId = setTimeout(() => requestController.abort(), timeoutMs);

  const abortFromParent = () => requestController.abort();
  if (signal) {
    if (signal.aborted) {
      requestController.abort();
    } else {
      signal.addEventListener('abort', abortFromParent, { once: true });
    }
  }

  try {
    const res = await fetch(`/api/real/profiles?floatId=${encodeURIComponent(floatId)}`, {
      signal: requestController.signal
    });

    if (!res.ok) {
      throw new Error(`Failed to load profiles (${res.status})`);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortFromParent);
    }
  }
}
