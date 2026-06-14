import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function App() {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu' or 'playing'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com');

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const keysRef = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Start Game
  const startGame = () => {
    setGameState('playing');
  };

  // AI Chat
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
      setMessages(prev => [...prev, { type: 'ai', content: data.reply || '...' }]);
    } catch {
      setMessages(prev => [...prev, { type: 'ai', content: 'AI error' }]);
    }
  };

  // Full 3D Game
  useEffect(() => {
    if (gameState !== 'playing' || !mountRef.current) return;

    // Clear previous canvas
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Create Minecraft-like Terrain + Trees
    const createTerrain = () => {
      const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
      const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      const treeMat = new THREE.MeshLambertMaterial({ color: 0x166534 });

      for (let x = -55; x <= 55; x++) {
        for (let z = -55; z <= 55; z++) {
          const height = Math.floor(Math.sin(x * 0.08) * 4 + Math.cos(z * 0.1) * 3.5) + 6;

          for (let y = 0; y < height; y++) {
            const mat = y === height - 1 ? grassMat : dirtMat;
            const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            block.position.set(x + 0.5, y + 0.5, z + 0.5);
            scene.add(block);
            blocksRef.current.push(block);
          }

          // Add trees
          if (Math.random() < 0.055 && height > 5) {
            for (let t = 0; t < 5; t++) {
              const tree = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), treeMat);
              tree.position.set(x + 0.5, height + t + 0.5, z + 0.5);
              scene.add(tree);
              blocksRef.current.push(tree);
            }
          }
        }
      }
    };
    createTerrain();

    // 3D Girl Companion
    const createGirl = () => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xff69b4 }));
      body.position.y = 1.6;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: 0xffdbac }));
      head.position.y = 3;
      group.add(head);

      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), new THREE.MeshLambertMaterial({ color: 0x4a2c0a }));
      hair.position.y = 3.3;
      group.add(hair);

      group.position.set(8, 2, 8);
      scene.add(group);
    };
    createGirl();

    camera.position.set(0, 12, 30);

    // First-person controls
    const handleKeyDown = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const animate = () => {
      requestAnimationFrame(animate);

      const speed = 0.22;
      const vel = velocityRef.current;
      const keys = keysRef.current;

      let mx = 0, mz = 0;
      if (keys['w'] || keys['arrowup']) mz -= 1;
      if (keys['s'] || keys['arrowdown']) mz += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;

      if (mx || mz) {
        const angle = yawRef.current;
        vel.x = (mx * Math.cos(angle) - mz * Math.sin(angle)) * speed;
        vel.z = (mx * Math.sin(angle) + mz * Math.cos(angle)) * speed;
      } else {
        vel.x *= 0.8;
        vel.z *= 0.8;
      }

      camera.position.x += vel.x;
      camera.position.z += vel.z;

      vel.y -= 0.03;
      camera.position.y += vel.y;
      if (camera.position.y < 2) {
        camera.position.y = 2;
        vel.y = 0;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      {gameState === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <h1 style={{ fontSize: '44px', marginBottom: '30px' }}>MINECRAFT 3D</h1>
          <button 
            onClick={startGame} 
            style={{ padding: '18px 60px', fontSize: '22px', background: '#4ade80', color: 'black', border: 'none', borderRadius: '10px' }}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {/* Top Bar */}
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 50 }}>
            <button onClick={() => setGameState('menu')} style={{ padding: '8px 16px' }}>Menu</button>
          </div>

          {/* AI Chat Sidebar */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '260px', background: 'rgba(20,20,20,0.95)', padding: '12px', overflowY: 'auto' }}>
            <h3>AI Companion</h3>
            <div style={{ height: '60%', overflowY: 'auto', marginBottom: '10px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: '12px', fontSize: '14px' }}>
                  <strong>{m.type === 'user' ? 'You' : 'AI'}:</strong> {m.content}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Talk to AI..."
                style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: 'none' }}
              />
              <button onClick={sendMessage} style={{ padding: '10px 16px' }}>Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
