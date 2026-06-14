import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com'); // ← CHANGE THIS to your actual Render URL

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { type: 'user', content: userMsg }]);
    setInput('');

    try {
      const res = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      const aiReply = data.reply || data.choices?.[0]?.message?.content || JSON.stringify(data);
      setMessages(prev => [...prev, { type: 'ai', content: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', content: 'Error: Cannot connect to AI backend' }]);
    }
  };

  // Simple 3D placeholder
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 800 / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 500);
    const container = document.getElementById('game');
    if (container) container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Game Area */}
      <div style={{ flex: 7, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id="game" style={{ border: '2px solid #333' }}></div>
      </div>

      {/* AI Chat */}
      <div style={{ flex: 3, background: '#1a1a1a', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2>Minecraft Fusion AI</h2>
        <p>Try: "build a house", "add trees", "make a tower"</p>

        <div style={{ flex: 1, overflowY: 'auto', margin: '15px 0', border: '1px solid #444', padding: '10px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '12px', textAlign: m.type === 'user' ? 'right' : 'left' }}>
              <strong>{m.type === 'user' ? 'You' : 'AI'}:</strong><br />{m.content}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type command here..."
            style={{ flex: 1, padding: '12px', fontSize: '16px' }}
          />
          <button onClick={sendMessage} style={{ padding: '0 20px', marginLeft: '8px' }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
