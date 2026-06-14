    import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function App() {
  const mountRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com'); // ← Update this

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const keysRef = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isLockedRef = useRef(false);

  // Simple AI chat (optional)
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
      setMessages(prev => [...prev, { type: 'ai', content: 'Connection error' }]);
    }
  };

  // ==================== 3D GAME ====================
  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.68 / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.68, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 30);
    scene.add(sun);

    // Create terrain + trees
    const createTerrain = () => {
      const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
      const dirtMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
      const treeMat = new THREE.MeshLambertMaterial({ color: 0x166534 });

      for (let x = -40; x <= 40; x++) {
        for (let z = -40; z <= 40; z++) {
          const height = Math.floor(
            Math.sin(x * 0.1) * 3 + Math.cos(z * 0.13) * 3 + 4
          );

          for (let y = 0; y < height; y++) {
            const mat = y === height - 1 ? grassMat : dirtMat;
            const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
            block.position.set(x + 0.5, y + 0.5, z + 0.5);
            scene.add(block);
            blocksRef.current.push(block);
          }

          // Trees
          if (Math.random() < 0.06 && height > 2) {
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

    // Simple 3D Girl Companion (placeholder model)
    const createGirl = () => {
      const girlGroup = new THREE.Group();

      // Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.5, 0.6),
        new THREE.MeshLambertMaterial({ color: 0xff69b4 })
      );
      body.position.y = 1.5;
      girlGroup.add(body);

      // Head
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshLambertMaterial({ color: 0xffdbac })
      );
      head.position.y = 2.8;
      girlGroup.add(head);

      // Hair
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.6, 0.85),
        new THREE.MeshLambertMaterial({ color: 0x4a2c0a })
      );
      hair.position.y = 3.1;
      girlGroup.add(hair);

      girlGroup.position.set(5, 0, 5);
      scene.add(girlGroup);
      return girlGroup;
    };

    const girl = createGirl();

    camera.position.set(0, 8, 15);

    // ==================== CONTROLS ====================
    const handleKeyDown = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse look
    const handleMouseMove = (e) => {
      if (!isLockedRef.current) return;
      yawRef.current -= e.movementX * 0.002;
      pitchRef.current -= e.movementY * 0.002;
      pitchRef.current = Math.max(-1.5, Math.min(1.5, pitchRef.current));
    };

    const handleClick = () => renderer.domElement.requestPointerLock();
    const handlePointerLock = () => {
      isLockedRef.current = document.pointerLockElement === renderer.domElement;
    };

    renderer.domElement.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLock);
    document.addEventListener('mousemove', handleMouseMove);

    // Block interaction
    const raycaster = new THREE.Raycaster();
    const handleMouseDown = (e) => {
      if (!isLockedRef.current) return;

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(blocksRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (e.button === 0) {
          // Break
          scene.remove(hit.object);
          blocksRef.current = blocksRef.current.filter(b => b !== hit.object);
        } else if (e.button === 2) {
          // Place
          const pos = hit.object.position.clone();
          pos.add(hit.face.normal);
          const newBlock = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0x854d0e })
          );
          newBlock.position.set(
            Math.floor(pos.x) + 0.5,
            Math.floor(pos.y) + 0.5,
            Math.floor(pos.z) + 0.5
          );
          scene.add(newBlock);
          blocksRef.current.push(newBlock);
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', e => e.preventDefault());

    // ==================== GAME LOOP ====================
    const animate = () => {
      requestAnimationFrame(animate);

      const speed = 0.18;
      const keys = keysRef.current;
      const vel = velocityRef.current;

      let mx = 0, mz = 0;
      if (keys['w'] || keys['arrowup']) mz -= 1;
      if (keys['s'] || keys['arrowdown']) mz += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;

      if (mx !== 0 || mz !== 0) {
        const angle = yawRef.current;
        vel.x = (mx * Math.cos(angle) - mz * Math.sin(angle)) * speed;
        vel.z = (mx * Math.sin(angle) + mz * Math.cos(angle)) * speed;
      } else {
        vel.x *= 0.85;
        vel.z *= 0.85;
      }

      camera.position.x += vel.x;
      camera.position.z += vel.z;

      // Gravity
      vel.y -= 0.025;
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: 'white' }}>
      <div ref={mountRef} style={{ flex: 7 }} />

      {/* Chat Sidebar */}
      <div style={{ flex: 3, background: '#111', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2>3D Minecraft + AI</h2>
        <p style={{ fontSize: '13px', color: '#888' }}>Left = Break • Right = Place • WASD + Mouse</p>

        <div style={{ flex: 1, overflowY: 'auto', margin: '15px 0', padding: '10px', border: '1px solid #333' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <strong style={{ color: m.type === 'user' ? '#f59e0b' : '#60a5fa' }}>{m.type}:</strong> {m.content}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="Talk to AI..."
            style={{ flex: 1, padding: '12px', background: '#222', color: 'white', border: 'none' }}
          />
          <button onClick={sendMessage} style={{ padding: '12px 18px', marginLeft: '8px' }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
