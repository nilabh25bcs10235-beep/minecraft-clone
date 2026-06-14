import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function App() {
  const mountRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com');
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing'
  const [saves, setSaves] = useState([]);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Load saves from localStorage
  useEffect(() => {
    const savedSaves = JSON.parse(localStorage.getItem('minecraftSaves') || '[]');
    setSaves(savedSaves);
  }, []);

  const saveGame = () => {
    const saveData = {
      timestamp: new Date().toISOString(),
      cameraPosition: cameraRef.current ? cameraRef.current.position.toArray() : [0, 10, 20],
      // For now we save only camera. Full block save can be added later
    };
    const newSaves = [saveData, ...saves].slice(0, 5); // keep last 5 saves
    localStorage.setItem('minecraftSaves', JSON.stringify(newSaves));
    setSaves(newSaves);
    alert('Game Saved!');
  };

  const loadSave = (save) => {
    if (cameraRef.current && save.cameraPosition) {
      cameraRef.current.position.set(...save.cameraPosition);
    }
    alert('Loaded save from ' + save.timestamp);
    setGameState('playing');
  };

  const startNewGame = () => {
    setGameState('playing');
  };

  const sendMessage = async () => {
    // ... (AI chat code remains the same)
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
      setMessages(prev => [...prev, { type: 'ai', content: data.reply || '...' }]);
    } catch {
      setMessages(prev => [...prev, { type: 'ai', content: 'AI error' }]);
    }
  };

  // 3D Game Setup (only when playing)
  useEffect(() => {
    if (gameState !== 'playing' || !mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Lights, Terrain, Girl (same as before - abbreviated for space)
    scene.add(new THREE.AmbientLight(0x404040));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Terrain creation (same as previous)
    const createTerrain = () => { /* ... same terrain code as last version ... */ };
    createTerrain();

    // Girl
    const createGirl = () => { /* ... same girl code ... */ };
    createGirl();

    camera.position.set(0, 12, 30);

    // Game loop, controls, etc. (full version available if needed)

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameState]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      {gameState === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>MINECRAFT 3D</h1>
          
          <button onClick={startNewGame} style={{ padding: '15px 40px', fontSize: '20px', margin: '10px', background: '#4ade80', color: 'black', border: 'none', borderRadius: '8px' }}>
            Start New Game
          </button>

          <button onClick={saveGame} style={{ padding: '12px 30px', fontSize: '18px', margin: '8px', background: '#eab308' }}>
            Save Current Game
          </button>

          <div style={{ marginTop: '30px', width: '80%', maxWidth: '400px' }}>
            <h3>Previous Saves</h3>
            {saves.length === 0 && <p>No saves yet</p>}
            {saves.map((save, i) => (
              <button key={i} onClick={() => loadSave(save)} style={{ display: 'block', width: '100%', margin: '6px 0', padding: '12px', background: '#444' }}>
                {new Date(save.timestamp).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {/* In-game UI */}
          <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 50 }}>
            <button onClick={() => setGameState('menu')} style={{ padding: '8px 16px' }}>Menu</button>
            <button onClick={saveGame} style={{ padding: '8px 16px', marginLeft: '10px' }}>Save</button>
          </div>

          {/* AI Chat */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '260px', background: 'rgba(20,20,20,0.95)', padding: '12px', overflowY: 'auto' }}>
            <h3>AI Companion</h3>
            {/* chat UI same as before */}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
