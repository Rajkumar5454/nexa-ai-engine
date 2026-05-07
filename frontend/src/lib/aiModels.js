// Available AI models. Only models supported by Emergent LLM key are included.
// `id` is what the backend sends to the LLM provider.
// `cost` is how many credits each generate action consumes (must match backend MODEL_MULTIPLIERS).
export const AI_MODELS = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    provider: 'OpenAI',
    tagline: 'State-of-the-art intelligence — Nexa\'s flagship reasoning',
    badge: 'Best Quality',
    color: 'from-amber-400 to-yellow-600',
    cost: 30,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    tagline: 'Balanced performance for complex components',
    badge: 'Recommended',
    color: 'from-blue-600 to-indigo-500',
    cost: 25,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tagline: 'Fast generation with clean, conversion-ready code',
    badge: 'Smart & Fast',
    color: 'from-blue-500 to-cyan-400',
    cost: 20,
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    tagline: 'Ultra-fast experiments and quick iterations',
    badge: 'Fast',
    color: 'from-emerald-500 to-teal-400',
    cost: 20,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    tagline: 'High-speed open source builds',
    badge: 'Fast',
    color: 'from-green-500 to-emerald-400',
    cost: 15,
  }
];

export const DEFAULT_MODEL_ID = 'gpt-5.5';
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
