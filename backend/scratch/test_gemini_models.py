import os
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

key = os.environ.get("USER_GOOGLE_API_KEY")
genai.configure(api_key=key)

models_to_test = [
    "models/gemini-3.1-pro-preview",
    "models/gemini-3-flash-preview",
]

for model_name in models_to_test:
    print(f"\nTesting model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name=model_name)
        response = model.generate_content("Hello, respond with just one word: Success.")
        print(f"SUCCESS for {model_name}: {response.text.strip()}")
    except Exception as e:
        print(f"FAILED for {model_name}: {e}")
