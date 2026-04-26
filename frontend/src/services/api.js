import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Emit a low-credits event the global LowCreditsModal listens for
const emitLowCredits = (detail) => {
  window.dispatchEvent(new CustomEvent('low-credits', { detail }));
};

// Global 403 interceptor on the default axios instance (used by AuthContext, Pricing, etc.)
axios.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    if ((status === 402 || status === 403) && detail && typeof detail === 'object' && detail.code === 'insufficient_credits') {
      emitLowCredits({ required: detail.required, available: detail.available });
    }
    return Promise.reject(error);
  },
);

const axiosInstance = axios.create({
  timeout: 120000
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    if ((status === 402 || status === 403) && detail && typeof detail === 'object' && detail.code === 'insufficient_credits') {
      emitLowCredits({ required: detail.required, available: detail.available });
    }
    return Promise.reject(error);
  },
);

export const chatAPI = {
  sendMessage: async (message, sessionId, projectId = null) => {
    const response = await axiosInstance.post(`${API}/ai/chat`, {
      message,
      session_id: sessionId,
      project_id: projectId
    });
    return response.data;
  },

  generateCode: async (prompt, sessionId, projectId = null) => {
    const response = await axiosInstance.post(`${API}/ai/generate`, {
      prompt,
      session_id: sessionId,
      project_id: projectId
    });
    return response.data;
  },

  generateCodeStream: (prompt, sessionId, projectId, { onToken, onDone, onError }, model = null) => {
    const token = localStorage.getItem('token');
    const body = JSON.stringify({
      prompt,
      session_id: sessionId,
      project_id: projectId,
      model: model || undefined,
    });

    const controller = new AbortController();

    fetch(`${API}/ai/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body,
      signal: controller.signal
    })
      .then(async (response) => {
        if (response.status === 402 || response.status === 403) {
          // Try to parse the detail; body may be empty if the ingress strips it.
          const txt = await response.text().catch(() => '');
          try {
            const data = JSON.parse(txt);
            const detail = data?.detail;
            if (detail && typeof detail === 'object' && detail.code === 'insufficient_credits') {
              emitLowCredits({ required: detail.required, available: detail.available });
            }
          } catch {
            /* body stripped or non-JSON — still show the low-credits modal with zeros */
            emitLowCredits({ required: 10, available: 0 });
          }
          onError('Not enough credits to continue. Please recharge.');
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token') {
                  onToken(data.content);
                } else if (data.type === 'done') {
                  onDone(data);
                } else if (data.type === 'error') {
                  onError(data.detail || 'Generation failed');
                }
              } catch (e) {
                // skip malformed JSON
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message || 'Stream connection failed');
        }
      });

    return () => controller.abort();
  },

  getProject: async (projectId) => {
    const response = await axiosInstance.get(`${API}/ai/project/${projectId}`);
    return response.data;
  },

  listProjects: async () => {
    const response = await axiosInstance.get(`${API}/ai/projects`);
    return response.data;
  },

  downloadProject: async (projectId) => {
    const token = localStorage.getItem('token');
    const url = `${API}/ai/project/${projectId}/download`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Download failed (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    // Try to pull a filename from the Content-Disposition header
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = (match && match[1]) || `nexa-project-${projectId.slice(0, 8)}.zip`;

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  },

  analyzeProject: async (projectId) => {
    const response = await axiosInstance.post(`${API}/ai/analyze/${projectId}`);
    return response.data;
  }
};
