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

MANDATORY_AESTHETIC_RULES = """
- Every card MUST have `backdrop-blur-md bg-white/5 border border-white/10` or `shadow-2xl`.

CRITICAL FORMATTING RULES:
- RETURN ONLY THE REACT CODE. 
- DO NOT wrap the code in markdown blocks like ```jsx. 
- NO conversational text before or after the code.
- Return a SINGLE valid React file that includes all styles.
- The file MUST end with exactly: export default App;
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
SYSTEM_GEMINI = f"""You are a creative technologist. Build IMMERSIVE, VISUALLY STUNNING glassmorphism websites.
DESIGN DNA — MANDATORY FOR EVERY SECTION:
- BACKGROUND: ALWAYS start with `style={{background:'linear-gradient(135deg,#020617 0%,#0f172a 50%,#1e1b4b 100%)'}}`. NEVER use plain black or white.
- GLOWING ORBS: Every hero section MUST have at least 2 glowing blurred orbs like: `<div style={{position:'absolute',width:'600px',height:'600px',background:'radial-gradient(circle,rgba(139,92,246,0.4),transparent)',borderRadius:'50%',filter:'blur(80px)',top:'-100px',left:'-100px'}}></div>`
- GLASS CARDS: ALL cards MUST use `style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px'}}`
- GRADIENT TEXT: Hero headings MUST use `style={{background:'linear-gradient(135deg,#fff,#a78bfa,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}`
- BUTTONS: Use `style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)',padding:'14px 32px',borderRadius:'50px',color:'#fff',fontWeight:700}}`
- IMAGES: Use `https://loremflickr.com/1200/800/TOPIC` with niche-specific keywords to ensure they load.
{MANDATORY_AESTHETIC_RULES}"""


# Llama style: Master of Modern UI — Versatile, high-end, extremely detailed
SYSTEM_LLAMA = f"""You are a world-class senior frontend architect. Build ELITE, "WOW-FACTOR" websites.
DESIGN DNA — UNIQUE TO LLAMA:
- NO PLAIN WHITE: Strictly FORBIDDEN to use a plain white background for the whole page. Use `bg-slate-950` (Dark) or `bg-slate-50` (Light) with deep colored accents.
- GRADIENT OBSESSED: Every section MUST use a `bg-gradient-to-br` or have floating glowing orbs in the background.
- GLASSMORPHISM: Use `backdrop-blur-xl bg-white/5 border border-white/10` for all cards and sections.
- DEPTH: Build MASSIVE pages with 8-10 distinct vertical sections. 
- Detail: Every section MUST be rich with niche-specific copy and unique layouts.
{MANDATORY_AESTHETIC_RULES}"""


def _system_for(model_id):
    if model_id and model_id.startswith("claude"):
        return SYSTEM_CLAUDE
    if model_id and model_id.startswith("gemini"):
        return SYSTEM_GEMINI
    if model_id and model_id.startswith("llama"):
        return SYSTEM_LLAMA
    return SYSTEM_OPENAI


CHAT_SYSTEM = """You are Nexa AI, a brilliant co-founder and lead engineer. 
Your goal is to talk with the user like a human partner. Be proactive, analytical, and visionary.

CRITICAL RULES:
1. ALWAYS include a **Suggestions** section with 3 distinct ideas for the next feature or design tweak.
2. ALWAYS include an **Engineering Tip** about code quality, React best practices, or UI/UX.
3. Keep the tone human, "founder-to-founder", and highly technical.
4. If you just built something, explain the architectural choice you made.
"""


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
    "gpt-5.5",
    "gpt-5.4",
    "gpt-4o",
    "claude-sonnet-4-5",
    "gemini-3-flash",
    "gemini-3-1-pro",
    "llama-3-3-70b",
}

# Per-model temperature (higher = more creative variation between runs)
MODEL_TEMPERATURES = {
    "gpt-5.5": 0.4,
    "gpt-5.4": 0.4,
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
    # If no valid model is requested, use the first supported model as a starting point, 
    # but don't force a "fallback brain" logic elsewhere.
    return "gpt-4o" 


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

    async def _call_gemini_native(self, system, user, max_tokens, temperature, model_name="gemini-3.1-pro"):
        """Call Gemini directly with the user's Google API key, with robust fallbacks."""
        import asyncio

        def _run():
            fallbacks = [model_name, "gemini-1.5-pro", "gemini-1.5-flash"]
            last_err = None
            
            for m_name in fallbacks:
                try:
                    print(f"[AI_SERVICE] 📡 Sending native request to Google Gemini (Model: {m_name})...")
                    model = genai.GenerativeModel(
                        model_name=m_name,
                        system_instruction=system,
                        generation_config=genai.types.GenerationConfig(
                            max_output_tokens=max_tokens,
                            temperature=temperature,
                        ),
                    )
                    resp = model.generate_content(user)
                    print(f"[AI_SERVICE] 🎯 Response received from Google Gemini ({m_name}).")
                    try:
                        return resp.text
                    except Exception:
                        print("[AI_SERVICE] ⚠️ Gemini response empty or blocked by safety filters.")
                        return ""
                except Exception as e:
                    err_msg = str(e)
                    print(f"[AI_SERVICE] ⚠️ Failed with {m_name}: {err_msg[:200]}")
                    last_err = e
                    
                    # If it's a rate limit, wait a bit before trying the next model in the list
                    if "429" in err_msg or "quota" in err_msg.lower():
                        import time
                        print(f"[AI_SERVICE] ⏳ Quota hit for {m_name}. Waiting 10s before next fallback...")
                        time.sleep(10)
                        
                    continue # Try the next model in the fallback list
                    
            print(f"[AI_SERVICE] ❌ All Gemini models failed. Last error: {last_err}")
            raise last_err

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
        try:
            print(f"[AI_SERVICE] 📡 Sending request to OpenAI-compatible API (Model: {model})...")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            print(f"[AI_SERVICE] 🎯 Response received from OpenAI-compatible API.")
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[AI_SERVICE] ❌ OpenAI-compatible API error: {e}")
            raise e

    async def _call_llm_async(self, system, user, max_tokens=3000, model="gpt-4o", temperature=None):
        import asyncio
        if temperature is None:
            temperature = _temperature_for(model)

        # Map internal Nexa names to exact provider model IDs (confirmed from API key's ListModels)
        provider_model = model
        if model == "gemini-3-1-pro":
            provider_model = "gemini-3.1-pro-preview"
        elif model == "gemini-3-flash":
            provider_model = "gemini-3-flash-preview"
        elif model == "llama-3-3-70b":
            provider_model = "meta/llama-3.3-70b-instruct"
        elif model == "claude-sonnet-4-5":
            provider_model = "anthropic/claude-3-5-sonnet"

        print(f"[AI_SERVICE] 🤖 Calling LLM: {model} (Provider ID: {provider_model}, Temp: {temperature}, Tokens: {max_tokens})")

        # GEMINI → user's Google API key, native SDK
        if model.startswith("gemini"):
            if self.gemini_native:
                try:
                    return await self._call_gemini_native(
                        system, user, max_tokens, temperature,
                        model_name=provider_model,
                    )
                except Exception as e:
                    print(f"[ai_service] Native Gemini failed: {e}")
                    # Continue to Emergent fallback specifically for Gemini
            
            if self.emergent_client:
                # Map to Emergent's OpenAI-compat model names for Google
                emergent_model = f"google/{provider_model}"
                try:
                    print(f"[AI_SERVICE] 🔄 Routing Gemini to Emergent Proxy (Model: {emergent_model})...")
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.emergent_client, system, user, max_tokens, emergent_model, temperature,
                    )
                except Exception as e:
                    print(f"[AI_SERVICE] ❌ Emergent Gemini proxy failed: {e}")

        # LLAMA → route directly to NVIDIA NIM
        if model.startswith("llama"):
            if self.nvidia_client:
                return await asyncio.to_thread(
                    self._call_openai_compat,
                    self.nvidia_client, system, user, max_tokens, provider_model, temperature,
                )

        # CLAUDE → Emergent proxy
        if model.startswith("claude"):
            if self.emergent_client:
                return await asyncio.to_thread(
                    self._call_openai_compat,
                    self.emergent_client, system, user, max_tokens, provider_model, temperature,
                )

        # GPT → user's OpenAI key, direct
        if model.startswith("gpt"):
            if self.openai_direct:
                try:
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.openai_direct, system, user, max_tokens, provider_model, temperature,
                    )
                except Exception as e:
                    print(f"[ai_service] User OpenAI call failed: {e}")

        # Final safeguard if no provider was triggered or all failed
        raise Exception(f"Failed to generate response with the selected model: {model}")

    # ----- User prompt builder -----

    def _build_code_prompt(self, prompt, existing_code=None):
        if existing_code:
            return (
                "ACT AS AN EXPERT CODE MODIFIER. I will provide existing code and a change request.\n"
                "CRITICAL RULES FOR MODIFICATION:\n"
                "1. You MUST return the ENTIRE, COMPLETE code of the modified App.jsx from start to finish.\n"
                "2. NEVER use placeholders like '// ... existing code'. I am piping this to a compiler.\n"
                "3. NO EXTERNAL DEPENDENCIES. Only import from 'react'.\n"
                "4. RETAIN THE NICHE: Look at the existing code's theme (e.g., Fitness, SaaS, Portfolio) and ENSURE any new images or text you add MATCH that theme exactly.\n"
                "5. NO WATCHES/CATS: Do not use generic images unless the website is actually about watches or cats. Use Unsplash or loremflickr with relevant keywords.\n"
                f"{MANDATORY_AESTHETIC_RULES}\n\n"
                f"EXISTING CODE:\n{existing_code}\n\n"
                f"CHANGE REQUEST: {prompt}\n\n"
                "Return only the full, modified React code. No explanations, no markdown wrappers."
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
            f"MANDATORY ARCHITECTURE: You MUST include a fixed, premium Top Navigation Bar (Header) with a SOLID, non-transparent background (use `bg-slate-900/95` or similar) and standard links. It MUST be clearly distinct from the Hero section. DO NOT use sidebars for main navigation. Use the STRUCTURAL STRATEGY above for the body content.\n"
            f"Make it SPECIFIC to \"{prompt}\".\n\n"
            "MAX_CAPACITY_MODE: You have a massive token budget. Build a LARGE, detailed masterpiece.\n"
            "ARCHITECTURE: Build a MASSIVE, long-scrolling Single-Page Application (Landing Page style).\n"
            "You MUST include at least 6-8 distinct vertical sections (e.g., Hero, Features, Gallery, Pricing, Testimonials, FAQ, About Us, Footer).\n"
            "DO NOT build separate routes or use react-router. Stack the components vertically so the user can scroll down through a rich experience.\n"
            "Every section must be rich with copy and premium visuals specific to the niche. DO NOT output a short 200-line stub.\n\n"
            "TECHNICAL SANDBOX RULES (CRITICAL):\n"
            "1. NO EXTERNAL DEPENDENCIES. You can ONLY import from 'react'. Do not use react-router-dom.\n"
            "2. DO NOT import lucide-react, framer-motion, or heroicons. Use pure inline <svg> tags for all icons.\n"
            "3. The code MUST compile cleanly. All variables must be defined. No syntax errors.\n"
            "4. Return a SINGLE valid React file ending with `export default App;`.\n\n"
            "CRITICAL DESIGN RULES (DO NOT IGNORE):\n"
            "-> ABSOLUTELY NO LOREM IPSUM. You must write real, compelling, niche-specific copy.\n"
            "-> YOU MUST INCLUDE REAL, NICHE-SPECIFIC IMAGES using LoremFlickr:\n"
            "   Format: `https://loremflickr.com/1200/800/KEYWORD` (e.g. `https://loremflickr.com/1200/800/architecture`)\n"
            "   YOU MUST USE DIFFERENT KEYWORDS for each image so every image is unique and relevant.\n"
            "   YOU MUST USE DIFFERENT KEYWORDS for each image so every image is unique and relevant.\n"
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

        print(f"\n[AI_SERVICE] 🚀 {'MODIFYING' if is_mod else 'GENERATING'} project: '{prompt[:60]}...'")
        print(f"[AI_SERVICE] 📍 Selected Model: {resolved_model}")

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
                print(f"[AI_SERVICE] ✅ Generation successful with {resolved_model} ({len(ai_response)} chars)")
                code = self._clean_code(ai_response)

                has_app_component = 'export default' in code or 'function ' in code or 'const ' in code
                has_jsx_return = 'return (' in code or 'return <' in code

                # Relax validation for modifications
                min_len = 100 if is_mod else 500
                if not code or len(code) < min_len or not has_app_component or not has_jsx_return:
                    raise ValueError(
                        f"{resolved_model} returned incomplete output ({len(code)} chars). "
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
                err_str = str(e)
                last_error = f"{resolved_model} failed: {err_str[:200]}"
                
                # If we hit a Rate Limit (429), wait longer and try multiple times
                if "429" in err_str or "quota" in err_str.lower():
                    wait_time = 15 if attempt == 0 else 30
                    print(f"[AI_SERVICE] ⏳ Rate limit hit ({attempt+1}/3). Waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    if attempt < 2: continue

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
