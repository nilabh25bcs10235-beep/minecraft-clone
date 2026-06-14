import { useState } from 'react'
import Game from './components/Game'

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_key') || '')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const saveApiKey = () => {
    localStorage.setItem('openrouter_key', apiKey)
    alert('API Key saved')
  }

  const sendToAI = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      })

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error connecting to backend' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: 'white' }}>
      {/* 3D Game Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Game />
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8 }}>
          <strong>3D Minecraft + AI</strong>
        </div>
      </div>

      {/* Sidebar - AI Chat */}
      <div style={{ width: 380, background: '#1e2937', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: 0 }}>Fusion AI</h3>
          <div style={{ marginTop: 8 }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="OpenRouter API Key"
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />
            <button onClick={saveApiKey} style={{ width: '100%' }}>Save Key</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong>{msg.role === 'user' ? 'You' : 'Fusion'}:</strong>
              <div>{msg.content}</div>
            </div>
          ))}
          {loading && <div>Fusion is thinking...</div>}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #334155' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
            placeholder="Ask Fusion to build..."
            style={{ width: '100%', padding: 10 }}
          />
        </div>
      </div>
    </div>
  )
}

export default App