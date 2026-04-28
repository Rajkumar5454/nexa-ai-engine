import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load env - look one level up from scratch/
load_dotenv(Path(__file__).parent.parent / '.env')
key = os.environ.get("USER_GOOGLE_API_KEY")

if not key:
    print(f"No Google API Key found in .env (Looked in {Path(__file__).parent.parent / '.env'})")
    # Try alternate name
    key = os.environ.get("GOOGLE_API_KEY")

if not key:
    print("Could not find key.")
    exit(1)

genai.configure(api_key=key)

print("--- Available Gemini Models ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, Display: {m.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")
