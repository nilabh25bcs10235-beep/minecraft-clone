from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import requests

app = FastAPI(title="MC3D AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/ai/chat")
async def chat_with_fusion(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        return {"reply": "Error: API key not configured"}

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mc3d-ai.vercel.app",
                "X-Title": "MC3D AI",
            },
            json={
                "model": "meta-llama/llama-3.1-8b-instruct",   # More reliable model
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful Minecraft AI assistant inside a 3D game. Keep answers short and useful."
                    },
                    {"role": "user", "content": request.message}
                ]
            },
            timeout=30
        )

        data = response.json()

        # Better error handling
        if "choices" in data and len(data["choices"]) > 0:
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
        elif "error" in data:
            return {"reply": f"OpenRouter Error: {data['error'].get('message', 'Unknown error')}"}
        else:
            return {"reply": "AI returned an unexpected response"}

    except Exception as e:
        return {"reply": f"Error: {str(e)}"}


# Serve frontend (must be last)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
