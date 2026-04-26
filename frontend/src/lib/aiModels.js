// Available AI models. Only models supported by Emergent LLM key are included.
// `id` is what the backend sends to the LLM provider.
// `cost` is how many credits each generate action consumes (must match backend MODEL_MULTIPLIERS).
export const AI_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    tagline: 'Fast & cheap — perfect for iteration',
    badge: 'Default',
    color: 'from-emerald-400 to-teal-500',
    cost: 10,
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    tagline: 'Ultra-fast preview model — Google\'s newest',
    badge: 'New',
    color: 'from-violet-400 to-fuchsia-500',
    cost: 14,
  },
  {
    id: 'gemini-3-1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    tagline: 'Advanced reasoning and complex logic',
    badge: 'Pro',
    color: 'from-fuchsia-500 to-purple-600',
    cost: 30,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tagline: 'Highest quality, multi-modal',
    badge: 'Best',
    color: 'from-blue-400 to-indigo-500',
    cost: 20,
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    tagline: 'Long-context reasoning, premium UI',
    badge: 'Coming Soon',
    color: 'from-orange-400 to-pink-500',
    cost: 25,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'NVIDIA',
    tagline: 'Insanely smart open-source reasoning',
    badge: 'Free',
    color: 'from-green-400 to-emerald-600',
    cost: 5,
  },
];

export const DEFAULT_MODEL_ID = 'gpt-4o-mini';
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
