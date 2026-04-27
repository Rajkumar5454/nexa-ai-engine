import asyncio
import os
import sys

# Add current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.ai_service import AIService

async def run():
    print("Testing AIService...")
    svc = AIService()
    print("Initializing...")
    try:
        res = await svc.generate_code(
            prompt="add a login button",
            session_id="test",
            existing_code="import React from 'react';\nfunction App() { return <div>hello</div>; }\nexport default App;",
            model="gemini-3-flash"
        )
        print("SUCCESS")
        print("Generated files:", len(res.get("files", [])))
    except Exception as e:
        print("FAILED")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
