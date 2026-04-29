import asyncio
import os
import sys
from pathlib import Path

# Add the current directory to sys.path so we can import services
sys.path.append(str(Path(__file__).parent))

from services.ai_service import AIService

async def test_models():
    service = AIService()
    
    # The prompt we will use for all models
    test_prompt = "A high-end landing page for a futuristic AI-powered drone company called 'AeroNexa'. Deep dark theme, neon accents, and immersive visuals."
    
    # The list of models to test
    models_to_test = [
        "gpt-4o",
        "gpt-4o-mini",
        "gemini-3-1-pro",
        "gemini-3-flash",
        "llama-3-3-70b",
        "claude-sonnet-4-5"
    ]
    
    print("\n" + "="*60)
    print("🚀 NEXA AI - MULTI-MODEL INTEGRATION TEST")
    print("="*60)
    print(f"PROMPT: {test_prompt}\n")

    for model_id in models_to_test:
        print(f"\n--- Testing Model: {model_id} ---")
        try:
            # We'll use a smaller token budget for the test to keep it fast
            result = await service.generate_code(
                prompt=test_prompt,
                session_id="test_session",
                model=model_id
            )
            
            # Check the result
            if result and "files" in result:
                code_len = len(result["files"][-1]["content"])
                print(f"✅ SUCCESS: {model_id} generated {code_len} characters of code.")
                print(f"   Message: {result.get('message', 'No message')}")
            else:
                print(f"❌ FAILED: {model_id} returned no files.")
                
        except Exception as e:
            print(f"❌ ERROR with {model_id}: {str(e)}")
            
    print("\n" + "="*60)
    print("🏁 TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(test_models())
