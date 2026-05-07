import os
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

key = os.environ.get("USER_GOOGLE_API_KEY")
genai.configure(api_key=key)

print("Available models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
