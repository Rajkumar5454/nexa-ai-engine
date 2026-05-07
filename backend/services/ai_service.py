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
CRITICAL VISUAL RULES:
1. IMAGERY: YOU MUST USE REAL IMAGES. Use <img src="https://images.unsplash.com/photo-...?auto=format&fit=crop&w=800&q=80" />.
2. NO PLACEHOLDERS: Prohibited to use empty divs, icons, or color blocks as image replacements.
3. STYLING: Every element must have a `style={{...}}` prop.
4. GLASSMORPHISM: Use `rgba(255,255,255,0.05)` and `backdropFilter:'blur(20px)'` for all containers.
5. GRADIENTS: Use `linear-gradient` for all buttons and backgrounds.
6. TYPOGRAPHY: High-end fonts only (Inter/system-ui).
"""

SYSTEM_OPENAI = f"You are a WORLD-CLASS SOFTWARE ENGINEER. Your #1 PRIORITY is REAL IMAGERY. Build ELITE landing pages. {MANDATORY_AESTHETIC_RULES}"
SYSTEM_CLAUDE = f"You are a luxury brand director. Your #1 PRIORITY is STUNNING PHOTOGRAPHY. Build MINIMALIST EDITORIAL websites. {MANDATORY_AESTHETIC_RULES}"
SYSTEM_GEMINI = f"You are a creative technologist. Your #1 PRIORITY is IMMERSIVE VISUALS. Build INTERACTIVE UI products. {MANDATORY_AESTHETIC_RULES}"
SYSTEM_LLAMA = f"You are a master of Modern UI. Your #1 PRIORITY is WOW-FACTOR IMAGES. Build ELITE websites. {MANDATORY_AESTHETIC_RULES}"

def _system_for(model_id):
    if model_id and model_id.startswith("claude"): return SYSTEM_CLAUDE
    if model_id and model_id.startswith("gemini"): return SYSTEM_GEMINI
    if model_id and model_id.startswith("llama"): return SYSTEM_LLAMA
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
    "gemini-3-flash": ("gemini", "gemini-3-flash-preview"),
    "gemini-3-1-pro": ("gemini", "gemini-3.1-pro-preview"),
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
            # Include robust fallbacks that are most likely to work on both Free and Paid tiers
            fallbacks = [
                model_name, 
                "gemini-1.5-pro-latest", 
                "gemini-1.5-flash-latest",
                "gemini-pro"
            ]
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
            
            # GPT-5 (and newer reasoning models like o1/o3) require max_completion_tokens instead of max_tokens
            kwargs = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            response = client.chat.completions.create(**kwargs)
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
        # Map Nexa UI names to real, valid OpenAI API model IDs
        elif model == "gpt-5.5":
            provider_model = "gpt-4o"   # Best available OpenAI model
        elif model == "gpt-5.4":
            provider_model = "gpt-4o"   # Fast, capable OpenAI model

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
                try:
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.nvidia_client, system, user, max_tokens, provider_model, temperature,
                    )
                except Exception as e:
                    print(f"[AI_SERVICE] ❌ NVIDIA NIM failed for {model}: {e}")
            if self.emergent_client:
                try:
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.emergent_client, system, user, max_tokens, f"meta/{provider_model}", temperature,
                    )
                except Exception as e:
                    print(f"[AI_SERVICE] ❌ Emergent fallback for llama failed: {e}")

        # CLAUDE → Emergent proxy
        if model.startswith("claude"):
            if self.emergent_client:
                try:
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.emergent_client, system, user, max_tokens, provider_model, temperature,
                    )
                except Exception as e:
                    print(f"[AI_SERVICE] ❌ Emergent Claude proxy failed: {e}")

        # GPT → user's OpenAI key, direct; Emergent as fallback
        if model.startswith("gpt"):
            if self.openai_direct:
                try:
                    result = await asyncio.to_thread(
                        self._call_openai_compat,
                        self.openai_direct, system, user, max_tokens, provider_model, temperature,
                    )
                    if result and len(result.strip()) > 10:
                        return result
                    print(f"[AI_SERVICE] ⚠️ OpenAI direct returned empty for {model}, trying Emergent fallback...")
                except Exception as e:
                    print(f"[ai_service] User OpenAI call failed: {e}")
            if self.emergent_client:
                try:
                    return await asyncio.to_thread(
                        self._call_openai_compat,
                        self.emergent_client, system, user, max_tokens, provider_model, temperature,
                    )
                except Exception as e:
                    print(f"[AI_SERVICE] ❌ Emergent GPT fallback failed: {e}")

        # Final safeguard if no provider was triggered or all failed
        raise Exception(f"Failed to generate response with the selected model: {model}")

    # ----- Unsplash image library -----
    UNSPLASH_LIBRARY = """
REAL UNSPLASH PHOTO URLS (USE THESE EXACT URLs - THEY ARE GUARANTEED TO WORK):
- Fashion/Clothing: https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80 | https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80 | https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80 | https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80 | https://images.unsplash.com/photo-1558171813-1e9e6fd8b1c9?w=800&q=80 | https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80
- Shoes/Footwear: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80 | https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80 | https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80 | https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80 | https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80 | https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80
- Food/Restaurant: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80 | https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80 | https://images.unsplash.com/photo-1476224203421-9ac39bcb3df1?w=800&q=80 | https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80 | https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80
- Fitness/Gym: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80 | https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80 | https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80 | https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80
- Tech/SaaS: https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80 | https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80 | https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80 | https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80
- Travel: https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80 | https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80 | https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80 | https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=800&q=80
- Beauty/Spa: https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80 | https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80 | https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80
- Real Estate: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80 | https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80 | https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80
- Education: https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80 | https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80 | https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&q=80
- General Hero/People: https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80 | https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&q=80 | https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80

INSTRUCTION: Pick the MOST RELEVANT category above and use those exact URLs in your <img> tags.
"""

    def _build_code_prompt(self, prompt, existing_code=None):
        if existing_code:
            return (
                "ACT AS AN EXPERT CODE MODIFIER. I will provide existing code and a change request.\n"
                "CRITICAL RULES FOR MODIFICATION:\n"
                "1. You MUST return the ENTIRE, COMPLETE code of the modified App.jsx from start to finish.\n"
                "2. NEVER use placeholders like '// ... existing code'. I am piping this to a compiler.\n"
                "3. NO EXTERNAL DEPENDENCIES. Only import from 'react'.\n"
                "4. RETAIN THE NICHE: Match the theme of the existing code.\n"
                f"5. MANDATORY IMAGES: Use these EXACT working Unsplash URLs — do NOT invent fake paths like /shoe1.jpg:\n{self.UNSPLASH_LIBRARY}\n"
                f"{MANDATORY_AESTHETIC_RULES}\n\n"
                f"EXISTING CODE:\n{existing_code}\n\n"
                f"CHANGE REQUEST: {prompt}\n\n"
                "Return only the full, modified React code. No explanations, no markdown wrappers."
            )

        p = random.choice(PALETTES)
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
            f"BUILD A STUNNING FRONTEND UI FOR: {prompt}\n\n"
            f"AESTHETIC: {style_mood} with {p['name']} palette. Layout: {layout_seed}.\n\n"
            "MANDATORY OUTPUT FORMAT:\n"
            "Return a SINGLE valid React file inside a ```javascript block.\n"
            "The component MUST be named App and end with: export default App;\n\n"
            f"MANDATORY IMAGE LIBRARY — USE THESE EXACT WORKING URLs (NO FAKE PATHS LIKE /shoe1.jpg):\n{self.UNSPLASH_LIBRARY}\n"
            "TECHNICAL RULES:\n"
            "- IMAGES: Pick the relevant category above and use those exact Unsplash URLs in every <img> tag.\n"
            "- NO EXTERNAL DEPS. Use ONLY 'react'.\n"
            "- ALL STYLES INLINE via style={{...}}.\n"
            "- USE SVGS for all icons.\n"
            "- ~1000+ lines total."
        )

    # ----- Public API -----

    async def stream_generate_code(self, prompt, session_id, existing_code=None, model=None, **kwargs):
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

    async def generate_code(self, prompt, session_id, existing_code=None, model=None, **kwargs):
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
                
                # Hard fail immediately if model returned nothing — try cross-model fallback
                if not ai_response or len(ai_response.strip()) < 50:
                    print(f"[AI_SERVICE] ⚠️ {resolved_model} returned empty. Activating fallback chain...")
                    FALLBACK_CHAIN = ["gemini-3-flash", "gpt-4o", "gemini-3-1-pro"]
                    fallback_models = [m for m in FALLBACK_CHAIN if m != resolved_model]
                    for fb_model in fallback_models:
                        try:
                            fb_system = _system_for(fb_model)
                            print(f"[AI_SERVICE] 🔄 Fallback attempt with {fb_model}...")
                            fb_response = await asyncio.wait_for(
                                self._call_llm_async(fb_system, user_prompt, max_tokens=max_tokens_budget, model=fb_model, temperature=temperature),
                                timeout=300,
                            )
                            if fb_response and len(fb_response.strip()) > 50:
                                ai_response = fb_response
                                resolved_model = fb_model
                                print(f"[AI_SERVICE] ✅ Fallback succeeded with {fb_model} ({len(ai_response)} chars)")
                                break
                        except Exception as fb_err:
                            print(f"[AI_SERVICE] ❌ Fallback {fb_model} also failed: {fb_err}")
                    else:
                        raise ValueError(
                            f"All models failed to generate code. Primary model '{resolved_model}' returned empty. "
                            f"Please check your API keys or try again later."
                        )

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
            has_closed = False
            for line in lines:
                if line.strip().startswith('```'):
                    if in_block:
                        has_closed = True
                    in_block = not in_block
                    continue
                if in_block:
                    cl.append(line)
                    
            if not has_closed and len(cl) > 50:
                raise ValueError("The code is too large and the AI hit its maximum output limit. Please try breaking your request into smaller pieces, or ask the AI to summarize the code.")
                
            if cl:
                code = '\n'.join(cl)
        # Skip leading explanation paragraphs
        if not code.startswith('import'):
            for i, line in enumerate(code.split('\n')):
                if line.strip().startswith(('import', 'function', 'const')):
                    code = '\n'.join(code.split('\n')[i:])
                    break
        if 'import React' not in code:
            code = "import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';\n" + code
        return code

    def _build_files(self, raw_output):
        import re
        js_blocks = re.findall(r"```(?:javascript|jsx|js)?\s*([\s\S]*?)```", raw_output, re.IGNORECASE)
        frontend_code = js_blocks[0].strip() if js_blocks else raw_output
        frontend_code = self._clean_code(frontend_code)

        baseline_css = """
        body { background: #020617; color: white; margin: 0; font-family: Inter, sans-serif; overflow-x: hidden; }
        #root { min-height: 100vh; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        """

        return [
            {"path": "/package.json", "content": '{"name":"nexa-app","version":"1.0.0","dependencies":{"react":"^18.2.0","react-dom":"^18.2.0"}}', "language": "json"},
            {"path": "/index.html", "content": f'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Nexa AI</title><style>{baseline_css}</style></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>', "language": "html"},
            {"path": "/src/main.jsx", "content": "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport '../index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);", "language": "javascript"},
            {"path": "/src/App.jsx", "content": frontend_code, "language": "javascript"},
            {"path": "/index.css", "content": "/* Core Styling */\n*{box-sizing:border-box;margin:0;padding:0}\nbody{background:#020617;color:white;font-family:Inter,sans-serif}\n", "language": "css"},
        ]
