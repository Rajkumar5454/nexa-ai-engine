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

# MANDATORY AESTHETIC RULES - Applied to ALL models to ensure WOW factor
MANDATORY_AESTHETIC_RULES = """
MANDATORY STYLING RULES — DO NOT IGNORE:
- NO LOREM IPSUM: NEVER use "Lorem ipsum" or placeholder text. You MUST write REAL, compelling, niche-specific copy. Invent realistic details if needed.
- UI COMPONENTS & IMAGES: Build 8-10 distinct UI sections (Hero, Feature Grid, Gallery, Pricing, Testimonials, FAQ, Footer). EVERY SECTION MUST INCLUDE REAL IMAGES using Unsplash URLs (e.g., `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80`). Do NOT build text-only blocks.
- MOTION & ANIMATION: Every build MUST feel alive. Use `animate-fadeInUp` for section entrances, `animate-float` for icons/images, and `hover:scale-105` for all cards.
- CONTRAST & READABILITY: Ensure high contrast. NEVER use dark text on dark backgrounds or light on light.
- NEVER use plain white backgrounds for the whole page. Use `bg-slate-950` for dark themes or `bg-gray-50` for light.
- FULL MASTERPIECE: Every build MUST hit at least 600-1000 lines of code. Build 7-8 distinct pages/routes.
- Use the PROVIDED PALETTE for all primary actions, icons, and accents.
- Every HERO SECTION must use a `bg-gradient-to-br` with the provided gradient colors.
- Every card MUST have `shadow-2xl` or `shadow-[0_0_50px_rgba(0,0,0,0.1)]`.
- Use `rounded-[2.5rem]` or `rounded-full` for a modern, high-end feel. No sharp corners.
"""

# ---------- Per-model SYSTEM prompts (EACH model has a UNIQUE visual identity) ----------

# GPT style: Bento Box / Modern SaaS — Grid-heavy, clean, conversion-focused
SYSTEM_OPENAI = f"""You are a senior product designer. Build BENTO BOX style SaaS websites.
DESIGN DNA — UNIQUE TO GPT:
- Architecture: GRID-HEAVY BENTO BOX layout. 
- Detail: `bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-8`
- Colors: White/Gray with bold primary accents.
{MANDATORY_AESTHETIC_RULES}"""

# Claude style: Ultra-Minimalist Editorial — High fashion, vertical typography, huge whitespace
SYSTEM_CLAUDE = f"""You are a luxury brand director. Build MINIMALIST EDITORIAL magazine-style websites.
DESIGN DNA — UNIQUE TO CLAUDE:
- Style: Pitch Black `bg-black` or Stark White `bg-white`.
- Typography: SERIF fonts. `text-[12vw] tracking-tighter italic`
- Detail: Use thin 1px border lines and high-contrast palette accents.
{MANDATORY_AESTHETIC_RULES}"""

# Gemini style: Immersive Glassmorphism — Glowing 3D, floating layers, futuristic
SYSTEM_GEMINI = f"""You are a creative technologist. Build IMMERSIVE GLASSMORPHISM websites.
DESIGN DNA — UNIQUE TO GEMINI:
- Architecture: FLOATING LAYERS with `backdrop-blur-3xl`.
- Style: Deep dark `bg-[#020617]` with glowing background orbs.
- Typography: Neon-glow text gradients.
{MANDATORY_AESTHETIC_RULES}"""


# Llama style: Neon Cyberpunk — Brutalist, high contrast, tech-heavy
SYSTEM_LLAMA = f"""You are a lead dev for a tech underground. Build NEON CYBERPUNK websites.
DESIGN DNA — UNIQUE TO LLAMA:
- Style: `bg-black` with thick neon borders and scanline textures.
- Typography: Monospace `font-mono` mixed with heavy black headings.
- Detail: Glitch effects and high-contrast neon palette.
{MANDATORY_AESTHETIC_RULES}"""


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
    "gpt-4o-mini": 0.4,
    "gpt-4o": 0.4,
    "claude-sonnet-4-5": 0.4,
    "gemini-3-flash": 0.4,
    "gemini-3-1-pro": 0.4,
    "llama-3-3-70b": 0.4,
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
                        system, user, max_tokens, temperature,
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
                "ACT AS A CODE MODIFIER. I will provide existing code and a change request.\n"
                "MANDATORY: You MUST return the COMPLETE, FULL code of the modified App.jsx.\n"
                "DO NOT use placeholders like '// ... existing code'. Return EVERY line.\n"
                "Keep all existing pages, routes, and logic unless specifically asked to change them.\n\n"
                f"EXISTING CODE:\n{existing_code}\n\n"
                f"CHANGE REQUEST: {prompt}\n\n"
                "Return only the modified React code for App.jsx."
            )

        p = random.choice(PALETTES)
        # Randomize the architectural strategy to prevent repetitive layouts
        layout_seed = random.choice([
            "Bento-box grid with asymmetrical cards",
            "Diagonal-cut section transitions and floating elements",
            "Split-screen immersive hero (Visual Right, Text Left)",
            "Centered minimalist hero with oversized typography",
            "Editorial magazine layout with vertical pull-quotes",
            "3D floating layers and glass-card stacked effects",
            "Brutalist raw-edge cards and bold typography",
            "Storytelling-focused vertical scroll path",
            "Geometric-patterned background with glowing focal points"
        ])
        
        style_mood = random.choice([
            "Futuristic Tech-Forward",
            "Soft Luxury Minimal",
            "Vibrant & Energetic",
            "Corporate High-Trust",
            "Underground Dark Hacker",
            "Apple-style Premium Clean"
        ])

        return (
            f"BUILD: {prompt}\n\n"
            f"STRUCTURAL STRATEGY: {layout_seed}.\n"
            f"AESTHETIC MOOD: {style_mood}.\n"
            f"PALETTE \"{p['name']}\" — accent={p['accent']}, gradient={p['gradient']}, btn={p['btn']}.\n\n"
            f"MANDATORY ARCHITECTURE: You MUST include a fixed, premium Top Navigation Bar (Header) with standard links (Home, About, Services, Login, Sign Up). DO NOT use sidebars for main navigation. Use the STRUCTURAL STRATEGY above for the body content.\n"
            f"Make it SPECIFIC to \"{prompt}\".\n\n"
            "MAX_CAPACITY_MODE: You have a massive token budget. Build a LARGE, detailed masterpiece.\n"
            "Include 6-8 comprehensive routes (Home, About, Services, Case Studies, Pricing, Contact, Blog).\n"
            "Every section must be rich with copy and premium visuals specific to the niche.\n\n"
            "TECHNICAL SANDBOX RULES (CRITICAL):\n"
            "1. NO EXTERNAL DEPENDENCIES. You can ONLY import from 'react' and 'react-router-dom'.\n"
            "2. DO NOT import lucide-react, framer-motion, or heroicons. Use pure inline <svg> tags for all icons.\n"
            "3. The code MUST compile cleanly. All variables must be defined. No syntax errors.\n"
            "4. Return a SINGLE valid React file ending with `export default App;`.\n\n"
            "CRITICAL DESIGN RULES (DO NOT IGNORE):\n"
            "-> ABSOLUTELY NO LOREM IPSUM. You must write real, compelling, niche-specific copy.\n"
            "-> YOU MUST INCLUDE REAL IMAGES. Use realistic Unsplash URLs (e.g., `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80`). NEVER use empty colored boxes or placeholders for images.\n"
            "-> Build a complete, complex UI. Do not just output giant text cards.\n\n"
            "~600-1000 lines total. Code only — no markdown."
        )

    # ----- Public API -----

    async def stream_generate_code(self, prompt, session_id, existing_code=None, model=None):
        """Async generator that yields status updates and final result"""
        import asyncio
        yield {"type": "status", "content": "Analyzing your requirements..."}
        await asyncio.sleep(0.5)
        
        resolved_model = _resolve_model(model)
        yield {"type": "status", "content": f"Routing request to {resolved_model}..."}
        
        # In a future update, we can implement full token-by-token streaming here.
        # For now, we simulate progress steps while the blocking call runs.
        try:
            yield {"type": "status", "content": "Writing JS and HTML structure..."}
            # Start the actual generation
            result = await self.generate_code(prompt, session_id, existing_code, model)
            
            # Simulate "streaming" the result for visual effect
            code = ""
            for f in result.get("files", []):
                if "App.jsx" in f.get("path", ""):
                    code = f.get("content", "")
                    break
            
            if code:
                # Send chunks of code to make it look live
                chunk_size = 500
                for i in range(0, min(len(code), 2000), chunk_size):
                    yield {"type": "token", "content": code[i:i+chunk_size]}
                    await asyncio.sleep(0.1)
            
            yield {"type": "done", "result": result}
            
        except Exception as e:
            yield {"type": "error", "content": str(e)}

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
        # Increased budgets for richer code generation
        max_tokens_budget = 8192 if is_lite else 16384

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

                # Relax validation for modifications
                min_len = 100 if is_mod else 500
                if not code or len(code) < min_len or not has_app_component or not has_jsx_return:
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

                    msg = f"I've updated your project for {prompt}! 🛠️ It's looking even better now. Check it out!" if is_mod else f"I've finished building your {prompt}! 🚀 I focused on making it look professional and high-end. Let me know what you think, or if we should tweak anything together!"
                    return {
                        "message": msg,
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
            formatted_history = []
            for m in conversation_history[-10:]:
                # Handle both dict and object (Message model)
                role = m.get('role', 'user') if isinstance(m, dict) else getattr(m, 'role', 'user')
                content = m.get('content', '') if isinstance(m, dict) else getattr(m, 'content', '')
                formatted_history.append(f"{role.upper()}: {content}")
            history_text = "\n".join(formatted_history)
        
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
            {"path": "/src/index.css", "content": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n*{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\nbody{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#050505;color:#e5e5e5}\n\n@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}\n@keyframes fadeIn{from{opacity:0}to{opacity:1}}\n@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}\n@keyframes pulse-glow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.05)}}\n\n.animate-fadeInUp{animation:fadeInUp 0.8s ease-out forwards}\n.animate-float{animation:float 4s ease-in-out infinite}\n.animate-pulse-glow{animation:pulse-glow 3s ease-in-out infinite}\n\n::-webkit-scrollbar{width:6px}\n::-webkit-scrollbar-track{background:#0a0a0a}\n::-webkit-scrollbar-thumb{background:#333;border-radius:3px}", "language": "css"},
        ]
