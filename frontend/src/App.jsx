import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function App() {
  const mountRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com');
  const [showStart, setShowStart] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const keysRef = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isLockedRef = useRef(false);

  // Touch controls for mobile
  const touchRef = useRef({ moveX: 0, moveZ: 0 });

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

  useEffect(() => {
    if (!mountRef.current) return;

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

    // Terrain + Trees
    const createTerrain = () => {
      const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
      const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      for (let x = -60; x <= 60; x++) {
        for (let z = -60; z <= 60; z++) {
          const height = Math.floor(Math.sin(x * 0.08) * 4 + Math.cos(z * 0.1) * 3.5) + 6;
          for (let y = 0; y < height; y++) {
            const mat = y === height - 1 ? grassMat : dirtMat;
            const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            block.position.set(x + 0.5, y + 0.5, z + 0.5);
            scene.add(block);
            blocksRef.current.push(block);
          }
          if (Math.random() < 0.05 && height > 5) {
            for (let t = 0; t < 5; t++) {
              const tree = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x166534 }));
              tree.position.set(x + 0.5, height + t + 0.5, z + 0.5);
              scene.add(tree);
              blocksRef.current.push(tree);
            }
          }
        }
      }
    };
    createTerrain();

    // Girl
    const createGirl = () => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xff69b4 }));
      body.position.y = 1.6;
      group.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: 0xffdbac }));
      head.position.y = 3;
      group.add(head);
      group.position.set(10, 2, 10);
      scene.add(group);
    };
    createGirl();

    camera.position.set(0, 12, 30);

    // Touch controls for mobile movement
    let touchStartX = 0, touchStartY = 0;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const dx = (e.touches[0].clientX - touchStartX) / 50;
        const dz = (e.touches[0].clientY - touchStartY) / 50;
        touchRef.current.moveX = Math.max(-1, Math.min(1, dx));
        touchRef.current.moveZ = Math.max(-1, Math.min(1, dz));
      }
    };

    const handleTouchEnd = () => {
      touchRef.current.moveX = 0;
      touchRef.current.moveZ = 0;
    };

    mountRef.current.addEventListener('touchstart', handleTouchStart);
    mountRef.current.addEventListener('touchmove', handleTouchMove);
    mountRef.current.addEventListener('touchend', handleTouchEnd);

    // Start game
    const startGame = () => {
      setShowStart(false);
      setIsPlaying(true);
      renderer.domElement.requestPointerLock();
    };

    renderer.domElement.addEventListener('click', startGame);

    // Game loop
    const animate = () => {
      requestAnimationFrame(animate);

      const speed = 0.2;
      const vel = velocityRef.current;
      const touch = touchRef.current;

      let mx = touch.moveX;
      let mz = touch.moveZ;

      if (mx !== 0 || mz !== 0) {
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

      camera.rotation.order = 'YXZ';
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeEventListener('touchstart', handleTouchStart);
      mountRef.current.removeEventListener('touchmove', handleTouchMove);
      mountRef.current.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      {showStart && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center'
        }}>
          <h1>Minecraft 3D</h1>
          <p>Tap anywhere to start playing</p>
          <p style={{ fontSize: '14px', marginTop: '20px' }}>Drag finger on screen to move • Tap to look around</p>
        </div>
      )}

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* AI Chat */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '260px',
        background: 'rgba(20,20,20,0.95)', padding: '12px', overflowY: 'auto', borderLeft: '1px solid #444'
      }}>
        <h3>AI Companion</h3>
        <div style={{ height: '65%', overflowY: 'auto', marginBottom: '10px' }}>
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
    </div>
  );
}

export default App;
