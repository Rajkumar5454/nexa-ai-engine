import os
from dotenv import load_dotenv
import openai
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

key = os.environ.get("USER_OPENAI_API_KEY")

client = openai.OpenAI(api_key=key)

models_to_test = [
    "gpt-5.5",
    "gpt-5.4",
]

for model in models_to_test:
    print(f"\nTesting model: {model}...")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hi, reply with one word."}],
            max_completion_tokens=10
        )
        print(f"SUCCESS: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"FAILED: {e}")
