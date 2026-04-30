import asyncio
from services.ai_service import AIService
import os
from dotenv import load_dotenv
import json

load_dotenv()

async def test():
    ai = AIService()
    res = await ai.generate_code('test_session', 'build a portfolio website', model='gpt-4o')
    with open('debug_output.txt', 'w') as f:
        # Check if it's a dict and write accordingly
        if isinstance(res, dict):
            f.write(json.dumps(res, indent=2))
        else:
            f.write(str(res))
    print("Done writing to debug_output.txt")

asyncio.run(test())
