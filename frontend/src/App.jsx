import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function App() {
  const mountRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [backendUrl] = useState('https://mc3d-ai.onrender.com');
  const [showStart, setShowStart] = useState(true);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const keysRef = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isLockedRef = useRef(false);

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
      setMessages(prev => [...prev, { type: 'ai', content: 'AI connection error' }]);
    }
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Terrain
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
          // Trees
          if (Math.random() < 0.055 && height > 5) {
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

    // Simple 3D Girl Companion
    const createGirl = () => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xff69b4 }));
      body.position.y = 1.6;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color:
