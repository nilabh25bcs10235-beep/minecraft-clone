import { useState, useRef } from 'react'
import Game from './components/Game'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const gameRef = useRef(null)

  const sendToAI = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      })

      const data = await res.json()
      const aiResponse = data.response || 'No response from AI'

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }])

      // Simple AI command execution
      executeAICommand(currentInput.toLowerCase(), aiResponse.toLowerCase())

    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Could not reach backend' }])
    } finally {
      setLoading(false)
    }
  }

  const executeAICommand = (userPrompt, aiResponse) => {
    const game = gameRef.current
    if (!game) return

    // Simple keyword-based building
    if (userPrompt.includes('build') || userPrompt.includes('tower') || userPrompt.includes('house')) {
      const positions = []
      for (let i = 0; i < 5; i++) {
        positions.push({ x: 5 + i, y: 1, z: 5 })
        positions.push({ x: 5 + i, y: 2, z: 5 })
      }
      game.addBlocks(positions, 0x854d0e)
      setMessages(prev => [...prev, { role: 'ai', content: 'Built a small structure for you!' }])
    }

    if (userPrompt.includes('clear') || userPrompt.includes('reset')) {
      game.clearWorld()
      setMessages(prev => [...prev, { role: 'ai', content: 'World cleared.' }])
    }

    if (userPrompt.includes('tree') || userPrompt.includes('forest')) {
      const positions = []
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 20) - 10
        const z = Math.floor(Math.random() * 20) - 10
        positions.push({ x, y: 1, z })
        positions.push({ x, y: 2, z })
      }
      game.addBlocks(positions, 0x166534)
      setMessages(prev => [...prev, { role: 'ai', content: 'Added some trees!' }])
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: 'white', fontFamily: 'system-ui' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Game ref={gameRef} />
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(15,23,42,0.8)', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          Click to lock mouse • WASD to move • Left/Right click blocks
        </div>
      </div>

      <div style={{ width: 420, background: '#1e2937', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #334155' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Fusion AI</h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#94a3b8' }}>Ask me to build things in the world</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, fontSize: 14 }}>
          {messages.length === 0 && (
            <div style={{ color: '#64748b' }}>
              Try saying:<br />
              • "build a tower here"<br />
              • "add some trees"<br />
              • "clear the world"
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: msg.role === 'user' ? '#f59e0b' : '#60a5fa' }}>
                {msg.role === 'user' ? 'You' : 'Fusion'}
              </div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          {loading && <div style={{ color: '#64748b' }}>Fusion is thinking...</div>}
        </div>

        <div style={{ padding: 20, borderTop: '1px solid #334155' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
            placeholder="Tell Fusion what to build..."
            style={{ width: '100%', padding: '12px 16px', background: '#334155', border: 'none', borderRadius: 8, color: 'white', fontSize: 15 }}
          />
        </div>
      </div>
    </div>
  )
}

export default App