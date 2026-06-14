from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from pydantic import BaseModel

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
async def health():
    return {"status": "healthy"}

@app.post("/api/ai/chat")
async def chat_with_fusion(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        return {"reply": "Error: API key not configured on server"}
    
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
                "model": "openrouter/fusion",
                "messages": [
                    {"role": "system", "content": "You are a helpful Minecraft AI assistant. Help the player with building, commands, and ideas."},
                    {"role": "user", "content": request.message}
                ]
            }
        )
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Error: {str(e)}"}
