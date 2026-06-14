# 🌲 Minecraft 3D + AI (Full Stack)

**React (Vite) + Three.js** frontend  
**Java Spring Boot** backend  
**OpenRouter Fusion** AI integration

## Project Structure

```
minecraft-clone/
├── frontend/          # React + Vite + Three.js
├── backend/           # Java Spring Boot
└── README.md
```

## Tech Stack
- **Frontend**: React 18 + Vite + Three.js
- **Backend**: Java 17+ + Spring Boot 3
- **AI**: OpenRouter Fusion (via backend)

## Running Locally

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API calls to backend.

## Deployment on Render
- Frontend → Static Site
- Backend → Web Service

## Future Plans
- Move Three.js game fully into React
- Add user accounts / world saving
- Improve AI command execution (build structures from chat)
