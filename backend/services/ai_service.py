import os
from dotenv import load_dotenv
from pathlib import Path
import openai
import random
import google.generativeai as genai

load_dotenv(Path(__file__).parent.parent / '.env')

# Configure direct provider clients with the user's own keys (preferred over Emergent proxy when available)
USER_OPENAI_KEY = os.environ.get("USER_OPENAI_API_KEY")
USER_GOOGLE_KEY = os.environ.get("USER_GOOGLE_API_KEY")
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

if USER_GOOGLE_KEY:
    genai.configure(api_key=USER_GOOGLE_KEY)

# ---------- Color palettes (used to inject variety across all models) ----------
PALETTES = [
    {"name": "Electric", "accent": "blue-500",    "gradient": "from-blue-500 to-cyan-400",     "btn": "bg-blue-600 hover:bg-blue-500"},
    {"name": "Emerald",  "accent": "emerald-500", "gradient": "from-emerald-500 to-teal-400",   "btn": "bg-emerald-600 hover:bg-emerald-500"},
    {"name": "Violet",   "accent": "violet-500",  "gradient": "from-violet-500 to-fuchsia-400", "btn": "bg-violet-600 hover:bg-violet-500"},
    {"name": "Sunset",   "accent": "orange-500",  "gradient": "from-orange-500 to-rose-500",    "btn": "bg-orange-600 hover:bg-orange-500"},
    {"name": "Rose",     "accent": "rose-500",    "gradient": "from-rose-500 to-pink-400",      "btn": "bg-rose-600 hover:bg-rose-500"},
    {"name": "Sky",      "accent": "sky-500",     "gradient": "from-sky-500 to-indigo-500",     "btn": "bg-sky-600 hover:bg-sky-500"},
    {"name": "Amber",    "accent": "amber-500",   "gradient": "from-amber-500 to-yellow-400",   "btn": "bg-amber-600 hover:bg-amber-500"},
]

# ---------- Per-model SYSTEM prompts (EACH model has a UNIQUE visual identity) ----------

# GPT style: Clean, white-mode SaaS — light backgrounds, bold typography, strong conversion focus
SYSTEM_OPENAI = """You are a top-tier product designer. Build CLEAN, CONVERSION-FOCUSED SaaS websites with a modern light aesthetic.

DESIGN DNA — UNIQUE TO GPT:
- Background: Light mode `bg-gray-50` with `bg-white` sections and `text-gray-900`
- Headings: `text-5xl md:text-7xl font-black tracking-tighter text-gray-900`
- Cards: `bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
- Buttons: `px-8 py-4 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-700 hover:scale-105 transition-all duration-300`
- Navbar: `fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center px-8 py-4`
- Accent colors: use ONE bold color from `indigo`, `blue`, or `violet` for highlights and CTAs
- Layouts: Asymmetric two-column sections, large typography emphasis, strong whitespace

CONTENT RULES:
- NEVER use placeholders like "Card 1", "Feature 1", "Lorem Ipsum". Write REAL niche-specific content.
- Include credibility stats (e.g. "Trusted by 50,000+ teams", "4.9/5 on G2").
- Each card: relevant SVG icon + bold headline + 2 sentences of specific description.

TECHNICAL:
- React hooks + react-router-dom v6. Inline SVG icons. NO external deps.
- 5-7 routes (/, /features, /pricing, /about, /contact, /dashboard, /docs). Each 30+ lines.
- `function App()` with <Routes>/<Route>. End with `export default App;`.
- Pure JSX output only — no markdown, no fences."""

# Claude style: Dark luxury editorial — immersive, magazine-quality, sophisticated
SYSTEM_CLAUDE = """You are a luxury brand designer. Build DARK EDITORIAL websites that feel like high-fashion magazines mixed with cutting-edge tech.

DESIGN DNA — UNIQUE TO CLAUDE:
- Background: Deep black `bg-[#050505]` with subtle grain texture via inline CSS
- Headings: MASSIVE `text-6xl md:text-8xl font-black uppercase tracking-[0.02em] text-white` — editorial magazine style
- Cards: `border border-white/[0.06] rounded-none p-10 hover:border-white/20 transition-all duration-500` (sharp corners, no border-radius)
- Buttons: `px-10 py-5 border border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all duration-300`
- Navbar: Minimal sticky top bar with logo left + sparse nav links right, `border-b border-white/10`
- Layouts: Full-bleed sections, oversized numbers, asymmetric column splits (70/30), editorial sidebars
- Accents: Use a SINGLE bold accent color (gold `#D4AF37`, red `#FF2D55`, or cyan `#00E5FF`)

CONTENT RULES:
- Write high-end, editorial-quality copy. No placeholders ever.
- Large typographic pull-quotes. Numbered features (01, 02, 03).
- Bold statistics in oversized type as standalone design elements.

TECHNICAL:
- React hooks + react-router-dom v6. Inline SVG icons. NO external deps.
- 4-6 routes (/, /work, /about, /services, /contact, /journal). Each 40+ lines.
- `function App()` with <Routes>/<Route>. End with `export default App;`.
- Pure JSX output only — no markdown, no fences."""

# Gemini style: Vibrant glassmorphism — immersive dark with glowing purple/violet effects
SYSTEM_GEMINI = """You are a world-class senior React developer. Build STUNNING GLASSMORPHISM websites with immersive dark themes and glowing effects.

DESIGN DNA — UNIQUE TO GEMINI:
- Background: `bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white`
- Gradient text headings: `font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-blue-200 text-5xl md:text-7xl`
- Glass cards: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500 shadow-xl`
- Glowing buttons: `px-8 py-4 rounded-full font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:scale-105 transition-all duration-300`
- Background orbs: 2-3 `absolute rounded-full blur-3xl opacity-20` orbs in hero section
- Navbar: `fixed top-0 w-full z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 flex justify-between items-center px-8 py-4`
- Grids: `grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto`

CONTENT RULES:
- NEVER write "Card 1", "Feature 1", "Lorem Ipsum". Write REAL niche-specific content.
- Real-looking stats ("2.4M+ Users", "99.9% Uptime", "$2.3B Revenue").
- Each card: inline SVG icon + bold title + 2 specific sentences.

TECHNICAL:
- React hooks + react-router-dom v6. Inline SVG. NO external deps.
- 3-4 routes (/, /features, /pricing, /contact). Each 40+ lines.
- `function App()` with <Routes>/<Route>. End with `export default App;`.
- Pure JSX only — no markdown, no fences."""

# Llama style: Bold neon cyberpunk — electric colors, tech-forward, high contrast
SYSTEM_LLAMA = """You are a cyberpunk UI engineer. Build BOLD, HIGH-ENERGY websites with neon accents and futuristic tech aesthetics.

DESIGN DNA — UNIQUE TO LLAMA:
- Background: Pure black `bg-black text-white` with neon grid lines via CSS
- Headings: `text-5xl md:text-7xl font-black text-white` with a neon color `drop-shadow-[0_0_20px_#00ff88]`
- Cards: `bg-gray-950 border border-green-500/30 rounded-xl p-8 hover:border-green-400 hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] transition-all duration-300`
- Buttons: `px-8 py-4 rounded-lg font-bold bg-green-500 text-black hover:bg-green-400 hover:shadow-[0_0_30px_rgba(0,255,136,0.6)] hover:scale-105 transition-all duration-300`
- Navbar: `fixed top-0 w-full z-50 bg-black border-b border-green-500/20 flex justify-between items-center px-8 py-4`
- Accents: Neon green `#00ff88`, electric cyan `#00e5ff`, hot magenta `#ff007a` — pick ONE dominant color
- Layouts: Terminal-style code snippets as UI elements, grid overlays, tech dashboard feel

CONTENT RULES:
- Write bold, high-energy, tech-forward copy. Never use placeholders.
- Use tech jargon fitting the niche (APIs, dashboards, algorithms, real-time data).
- Include impressive metrics in neon-highlighted stat blocks.

TECHNICAL:
- React hooks + react-router-dom v6. Inline SVG. NO external deps.
- 3-4 routes (/, /features, /pricing, /contact). Each 40+ lines.
- `function App()` with <Routes>/<Route>. End with `export default App;`.
- Pure JSX only — no markdown, no fences."""


def _system_for(model_id):
    if model_id and model_id.startswith("claude"):
        return SYSTEM_CLAUDE
    if model_id and model_id.startswith("gemini"):
        return SYSTEM_GEMINI
    if model_id and model_id.startswith("llama"):
        return SYSTEM_LLAMA
    return SYSTEM_OPENAI


CHAT_SYSTEM = """You are Nexa AI, a brilliant and friendly co-founder and lead engineer. 
Your goal is to talk with the user like a human partner. Be proactive, analytical, but also warm and encouraging.

GUIDELINES:
- Speak like a person, not a robot. Use "I" and "we".
- If the user asks about their project, look at the project context and give specific, clever advice.
- Don't just list facts. Explain WHY something is a good idea for their business.
- Be concise but insightful.
- If you see a way to make their app better, suggest it!

Format your response with helpful sections like **Suggestions** or **Engineering Tip**, but keep the overall tone natural."""


def _get_openai_direct_client():
    """Direct OpenAI client using the user's own API key (used for gpt-4o, gpt-4o-mini)."""
    if not USER_OPENAI_KEY:
        return None
    return openai.OpenAI(
        api_key=USER_OPENAI_KEY,
        max_retries=1,
        timeout=300,
    )


def _get_emergent_client():
    """Emergent-proxied OpenAI-compat client (used as fallback + for Claude routing)."""
    if not EMERGENT_KEY:
        return None
    return openai.OpenAI(
        api_key=EMERGENT_KEY,
        base_url="https://integrations.emergentagent.com/llm",
        max_retries=1,
        timeout=300,
    )


# ---------- Supported models + per-model config ----------
SUPPORTED_MODELS = {
    "gpt-4o-mini",
    "gpt-4o",
    "claude-sonnet-4-5",
    "gemini-3-flash",
    "gemini-3-1-pro",
    "llama-3-3-70b",
}
DEFAULT_MODEL = "gemini-3-1-pro"

# Per-model temperature (higher = more creative variation between runs)
MODEL_TEMPERATURES = {
    "gpt-4o-mini": 0.7,
    "gpt-4o": 0.7,
    "claude-sonnet-4-5": 0.8,
    "gemini-3-flash": 0.9,
    "gemini-3-1-pro": 0.8,
    "llama-3-3-70b": 0.7,
}

# Maps for providers that aren't routable through the OpenAI-compat proxy
GEMINI_PROVIDER_MAP = {
    "gemini-3-flash": ("gemini", "gemini-3-flash"),
    "gemini-3-1-pro": ("gemini", "gemini-3.1-pro"),
    "llama": ("nvidia", "meta/llama-3.3-70b-instruct"),
}


def _resolve_model(requested):
    if requested and requested in SUPPORTED_MODELS:
        return requested
    return DEFAULT_MODEL


def _is_gemini(model_id):
    return model_id in GEMINI_PROVIDER_MAP


def _temperature_for(model_id):
    return MODEL_TEMPERATURES.get(model_id, 0.7)


NVIDIA_KEY = os.environ.get("NVIDIA_API_KEY")

def _get_nvidia_client():
    if not NVIDIA_KEY:
        return None
    return openai.OpenAI(
        api_key=NVIDIA_KEY,
        base_url="https://integrate.api.nvidia.com/v1"
    )

class AIService:
    def __init__(self):
        print(f"DEBUG: Initializing AIService. OpenAI: {bool(USER_OPENAI_KEY)}, Google: {bool(USER_GOOGLE_KEY)}, NVIDIA: {bool(NVIDIA_KEY)}")
        self.openai_direct = _get_openai_direct_client()
        self.nvidia_client = _get_nvidia_client()
        self.emergent_client = _get_emergent_client()
        self.gemini_native = bool(USER_GOOGLE_KEY)
        if self.gemini_native:
            genai.configure(api_key=USER_GOOGLE_KEY)

    # ----- Provider transports -----

    async def _call_gemini_native(self, system, user, max_tokens, temperature, model_name="gemini-2.5-flash"):
        """Call Gemini directly with the user's Google API key (google-generativeai SDK)."""
        import asyncio

        def _run():
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                ),
            )
            resp = model.generate_content(user)
            return getattr(resp, "text", "") or ""

        return await asyncio.to_thread(_run)

    async def _call_emergent_chat(self, system, user, max_tokens, provider, model_name, temperature, session_id="default"):
        """Used as a fallback for providers we don't have direct keys for (e.g. Anthropic)."""
        if not self.emergent_client:
            raise ValueError("Emergent client is not configured (missing key).")
        # Refactored to use standard OpenAI client against the Emergent proxy instead of LlmChat library
        model = f"{provider}/{model_name}"
        import asyncio
        return await asyncio.to_thread(
            self._call_openai_compat,
            self.emergent_client, system, user, max_tokens, model, temperature
        )

    def _call_openai_compat(self, client, system, user, max_tokens, model, temperature):
        """Synchronous OpenAI-format chat completion. Used for both direct OpenAI and the Emergent proxy."""
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    async def _call_llm_async(self, system, user, max_tokens=3000, model=DEFAULT_MODEL, temperature=None):
        import asyncio
        if temperature is None:
            temperature = _temperature_for(model)

        # GEMINI → user's Google API key, native SDK
        if model.startswith("gemini"):
            if self.gemini_native:
                try:
                    # Use the exact model name requested
                    target_model = f"models/{model}"
                    if model == "gemini-3-1-pro":
                        target_model = "models/gemini-3.1-pro"
                    elif model == "gemini-3-flash":
                        target_model = "models/gemini-3-flash"
                    else:
                        target_model = f"models/{model}"
                    return await self._call_gemini_native(
                        system, user, 4000, temperature,
                        model_name=target_model,
                    )
                except Exception as e:
                    print(f"[ai_service] Native Gemini failed: {e}")
                    # Continue to NVIDIA fallback

        # LLAMA → user selected Llama from the UI, route directly to NVIDIA NIM
        if model.startswith("llama"):
            if self.nvidia_client:
                # Explicitly requested Llama 3.3 70B
                nvidia_model = "meta/llama-3.3-70b-instruct"
                return await asyncio.to_thread(
                    self._call_openai_compat,
                    self.nvidia_client, system, user, max_tokens, nvidia_model, temperature,
                )
            else:
                print("[ai_service] Llama requested but no NVIDIA_API_KEY found.")

        # CLAUDE → Emergent LLM key (user did not provide an Anthropic key)
        if model.startswith("claude"):
            if not self.emergent_client:
                raise ValueError("Claude is not available because the Emergent proxy key is missing.")
            return await asyncio.to_thread(
                self._call_openai_compat,
                self.emergent_client, system, user, max_tokens, model, temperature,
            )

        # GPT → user's OpenAI key, direct (with auto-fallback to Emergent if user's key is rate-limited)
        if self.openai_direct:
            try:
                return await asyncio.to_thread(
                    self._call_openai_compat,
                    self.openai_direct, system, user, max_tokens, model, temperature,
                )
            except (openai.RateLimitError, openai.AuthenticationError, openai.NotFoundError) as e:
                # User's OpenAI account has issues — fall back to Emergent
                print(f"[ai_service] User OpenAI call failed, falling back to Emergent: {e}")
            except Exception as e:
                print(f"[ai_service] Unexpected error in direct OpenAI call: {e}")

        # Fallback 1: NVIDIA NIM (High quality, high speed, free credits)
        if self.nvidia_client:
            try:
                # Use Llama 3.3 70B Instruct for high-quality code generation
                # The 8B model is too small and makes syntax errors (like mapping over undefined objects)
                nvidia_model = "meta/llama-3.3-70b-instruct"
                return await asyncio.to_thread(
                    self._call_openai_compat,
                    self.nvidia_client, system, user, max_tokens, nvidia_model, temperature,
                )
            except Exception as e:
                print(f"[ai_service] NVIDIA fallback failed: {e}")

        # Fallback 2: Emergent proxy
        if self.emergent_client:
            return await asyncio.to_thread(
                self._call_openai_compat,
                self.emergent_client, system, user, max_tokens, model, temperature,
            )
            
        raise ValueError(f"No valid API keys configured to handle model request: {model}")

    # ----- User prompt builder -----

    def _build_code_prompt(self, prompt, existing_code=None):
        if existing_code:
            return (
                f"MODIFY this code:\n\n{existing_code}\n\n"
                f"CHANGE: {prompt}\n\n"
                "Keep ALL pages/routes. Return COMPLETE modified code."
            )

        p = random.choice(PALETTES)
        # A small extra random nonce nudges the model toward different layouts run-to-run
        layout_seed = random.choice([
            "asymmetric two-column hero",
            "centered hero with floating cards",
            "split-screen hero (visual right, text left)",
            "editorial left-aligned hero with oversized headline",
            "full-bleed hero with overlay panel",
        ])

        return (
            f"BUILD: {prompt}\n\n"
            f"PALETTE \"{p['name']}\" — accent={p['accent']}, gradient={p['gradient']}, btn={p['btn']}.\n"
            f"USE THIS PALETTE for accents, icons, badges, button. Dark page background (bg-gray-950).\n\n"
            f"HERO LAYOUT THIS RUN: {layout_seed}.\n\n"
            f"Layout must be SPECIFIC to \"{prompt}\" — components matched to this product, not a generic landing page template.\n\n"
            "CRITICAL: Break the UI down into beautifully separated, modular React components (e.g., Navbar, Hero, Features, Footer). DO NOT put everything inside one giant App function.\n\n"
            "4-5 essential routes (Home, Features, Pricing, Contact). Homepage hero + niche-specific sections + footer.\n\n"
            "~300-400 lines total. Premium dark theme. Code only — no markdown."
        )

    # ----- Public API -----

    async def generate_code(self, prompt, session_id, existing_code=None, model=None):
        import asyncio
        user_prompt = self._build_code_prompt(prompt, existing_code)
        is_mod = existing_code is not None
        resolved_model = _resolve_model(model)
        system_prompt = _system_for(resolved_model)
        temperature = _temperature_for(resolved_model)

        last_error = None
        # LITE MODE: If using user's own keys (Free Tier) and no NVIDIA fallback, reduce token budget
        is_lite = (self.gemini_native or self.openai_direct) and not self.nvidia_client
        max_tokens_budget = 3000 if is_lite else 8192
        
        if is_lite:
            system_prompt += "\n\nLITE MODE: Build 3-4 ESSENTIAL pages (Home, Dashboard, Contact) instead of 9. Keep code under 200 lines to ensure completion on free tier."

        for attempt in range(2):
            try:
                ai_response = await asyncio.wait_for(
                    self._call_llm_async(
                        system_prompt, user_prompt,
                        max_tokens=max_tokens_budget,
                        model=resolved_model,
                        temperature=temperature,
                    ),
                    timeout=300,
                )
                code = self._clean_code(ai_response)

                # Validate the response actually contains a usable React App component
                has_app_component = (
                    'function App' in code
                    or 'const App ' in code
                    or 'const App=' in code
                    or 'const App:' in code  # rare
                )
                has_jsx_return = 'return (' in code or 'return <' in code

                if not code or len(code) < 500 or not has_app_component or not has_jsx_return:
                    raise ValueError(
                        f"{resolved_model} returned incomplete output ({len(code)} chars, App component={'yes' if has_app_component else 'NO'}). "
                        f"Try again or pick another model."
                    )

                files = self._build_files(code)
                code_lines = len(code.split('\n'))

                analysis = ""
                if not is_mod:
                    try:
                        analysis = await asyncio.wait_for(
                            self._call_llm_async(
                                "Product analyst. Concise.",
                                f'Analyze "{prompt}" ({code_lines} lines). Format:\n'
                                "**What Was Built:** [pages/features]\n"
                                "**Missing Improvements:** [list]\n"
                                "**Next Features:** [3]\n"
                                "**Revenue Idea:** [one]",
                                max_tokens=500,
                                model=resolved_model,
                                temperature=0.4,
                            ),
                            timeout=30,
                        )
                    except Exception:
                        pass  # analysis is best-effort

                return {
                    "message": f"Modified: {prompt}" if is_mod else f"Built premium {prompt}",
                    "files": files,
                    "steps": [f"Applied: {prompt}"] if is_mod else [
                        f"{code_lines} lines of premium code",
                        f"Generated by {resolved_model} (temp {temperature})",
                        f"Unique layout designed for {prompt}",
                    ],
                    "analysis": analysis,
                    "model": resolved_model,
                }
            except asyncio.TimeoutError:
                last_error = f"{resolved_model} timed out after 120s. Please try a faster model (e.g. GPT-4o Mini or Gemini 3 Flash)."
                if attempt < 1:
                    await asyncio.sleep(2)
                    continue
                raise RuntimeError(last_error)
            except Exception as e:
                last_error = f"{resolved_model} failed: {str(e)[:200]}"
                if attempt < 1:
                    await asyncio.sleep(2)
                    continue
                raise RuntimeError(last_error)

    async def chat_message(self, message, session_id, conversation_history=None, project=None, model=None):
        ctx = self._extract_project_context(project) if project else None
        
        # Build history context
        history_text = ""
        if conversation_history:
            history_text = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in conversation_history[-10:]])
        
        user_prompt = f"PROJECT CONTEXT:\n{ctx}\n\n" if ctx else ""
        user_prompt += f"RECENT CONVERSATION:\n{history_text}\n\n" if history_text else ""
        user_prompt += f"USER: {message}\n\nNexa, respond as a human co-founder:"
        
        resolved = _resolve_model(model)
        return await self._call_llm_async(CHAT_SYSTEM, user_prompt, max_tokens=1000, model=resolved)

    async def analyze_project(self, project, session_id, model=None):
        ctx = self._extract_project_context(project)
        if not ctx:
            return "No project to analyze."
        resolved = _resolve_model(model)
        return await self._call_llm_async(
            CHAT_SYSTEM,
            f"FULL AUDIT:\n{ctx}\n\nCheck all aspects.",
            max_tokens=1000,
            model=resolved,
        )

    # ----- Helpers -----

    def _extract_project_context(self, project):
        if not project:
            return None
        parts = [f"Project: {project.name}"]
        if project.files:
            for f in project.files:
                fp = f.get("path", "") if isinstance(f, dict) else f.path
                content = f.get("content", "") if isinstance(f, dict) else f.content
                if "App.jsx" in fp:
                    lines = content.split('\n') if content else []
                    parts.append(f"App.jsx ({len(lines)} lines)")
                    parts.append('\n'.join(lines[:80]))
                    break
        return '\n'.join(parts)

    def _clean_code(self, raw):
        if not raw:
            return ""
        code = raw.strip()
        # Strip markdown fences if any
        if '```' in code:
            lines = code.split('\n')
            in_block, cl = False, []
            for line in lines:
                if line.strip().startswith('```'):
                    in_block = not in_block
                    continue
                if in_block:
                    cl.append(line)
            if cl:
                code = '\n'.join(cl)
        # Skip leading explanation paragraphs
        if not code.startswith('import'):
            for i, line in enumerate(code.split('\n')):
                if line.strip().startswith(('import', 'function', 'const')):
                    code = '\n'.join(code.split('\n')[i:])
                    break
        if 'export default' not in code:
            code += "\n\nexport default App;"
        if 'import React' not in code:
            code = "import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';\n" + code
        return code

    def _build_files(self, code):
        return [
            {"path": "/package.json", "content": '{"name":"app","private":true,"dependencies":{"react":"^19.0.0","react-dom":"^19.0.0","react-router-dom":"^6.20.0"}}', "language": "json"},
            {"path": "/index.html", "content": '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>', "language": "html"},
            {"path": "/src/main.jsx", "content": "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);", "language": "javascript"},
            {"path": "/src/App.jsx", "content": code, "language": "javascript"},
            {"path": "/src/index.css", "content": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n*{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\nbody{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#050505;color:#e5e5e5}\n\n@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}\n@keyframes fadeIn{from{opacity:0}to{opacity:1}}\n\n::-webkit-scrollbar{width:6px}\n::-webkit-scrollbar-track{background:#0a0a0a}\n::-webkit-scrollbar-thumb{background:#333;border-radius:3px}", "language": "css"},
        ]
