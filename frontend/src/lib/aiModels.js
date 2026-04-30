// Available AI models. Only models supported by Emergent LLM key are included.
// `id` is what the backend sends to the LLM provider.
// `cost` is how many credits each generate action consumes (must match backend MODEL_MULTIPLIERS).
export const AI_MODELS = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    provider: 'OpenAI',
    tagline: 'Professional-class intelligence — Nexa\'s Flagship',
    badge: 'Elite',
    color: 'from-amber-400 to-yellow-600',
    cost: 50,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    tagline: 'Next-gen reasoning for complex apps',
    badge: 'Pro',
    color: 'from-blue-600 to-indigo-500',
    cost: 40,
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
    tagline: 'Clean, conversion-focused SaaS designs',
    badge: 'Smart',
    color: 'from-blue-500 to-cyan-400',
    cost: 30,
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tagline: 'Dark luxury editorial and brand identity',
    badge: 'Coming Soon',
    color: 'from-orange-500 to-rose-500',
    cost: 30,
    comingSoon: true,
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    tagline: 'Ultra-fast builds and light experiments',
    badge: 'Fast',
    color: 'from-emerald-500 to-teal-400',
    cost: 10,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    tagline: 'Cyberpunk neon and tech-heavy aesthetics',
    badge: 'Bold',
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
