import google.generativeai as genai
import os

key = os.environ.get("GOOGLE_API_KEY", "your-api-key-here")
genai.configure(api_key=key)

for model_name in ["gemini-2.0-flash", "models/gemini-2.0-flash", "gemini-1.5-flash"]:
    print(f"Testing model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name=model_name)
        response = model.generate_content("Hi")
        print(f"SUCCESS for {model_name}: {response.text[:20]}...")
        break
    except Exception as e:
        print(f"FAILED for {model_name}: {e}")
