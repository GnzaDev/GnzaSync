const API_URL = 'http://127.0.0.1:8000';

export interface StatusResponse {
  running: boolean;
  latency: number;
  gpu_available?: boolean;
  device_name?: string;
}

export interface SubtitlesResponse {
  original: string;
  translated: string;
}

export const api = {
  getStatus: async (): Promise<StatusResponse> => {
    try {
      const res = await fetch(`${API_URL}/status`);
      return await res.json();
    } catch {
      return { running: false, latency: 0 };
    }
  },

  start: async (source_lang: string, target_lang: string, model_size: string = 'small') => {
    await fetch(`${API_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_lang, target_lang, model_size }),
    });
  },

  stop: async () => {
    await fetch(`${API_URL}/stop`, { method: 'POST' });
  },

  getSubtitles: async (): Promise<SubtitlesResponse> => {
    try {
      const res = await fetch(`${API_URL}/subtitles`);
      return await res.json();
    } catch {
      return { original: '', translated: '' };
    }
  }
};
