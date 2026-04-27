// Available AI models. Only models supported by Emergent LLM key are included.
// `id` is what the backend sends to the LLM provider.
// `cost` is how many credits each generate action consumes (must match backend MODEL_MULTIPLIERS).
export const AI_MODELS = [
  {
    id: 'gemini-3-1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    tagline: 'Advanced reasoning and complex logic — Nexa\'s Default',
    badge: 'Pro',
    color: 'from-fuchsia-500 to-purple-600',
    cost: 30,
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3-1-pro';
export const MODEL_STORAGE_KEY = 'nexa.selected_model';

export const getStoredModel = () => {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && AI_MODELS.some((m) => m.id === stored)) return stored;
  } catch {/* ignore */}
  return DEFAULT_MODEL_ID;
};

export const setStoredModel = (id) => {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  } catch {/* ignore */}
};

export const getModelById = (id) =>
  AI_MODELS.find((m) => m.id === id) || AI_MODELS[0];
