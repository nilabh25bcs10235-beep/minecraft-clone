import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

const Game = forwardRef(({ onWorldChange }, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const blocksRef = useRef([]);
  const keysRef = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isLockedRef = useRef(false);

  // Expose methods to parent (for AI to modify world)
  useImperativeHandle(ref, () => ({
    addBlocks: (positions, color = 0x854d0e) => {
      if (!sceneRef.current) return;
      positions.forEach(pos => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color });
        const block = new THREE.Mesh(geometry, material);
        block.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
        sceneRef.current.add(block);
        blocksRef.current.push(block);
      });
      if (onWorldChange) onWorldChange(blocksRef.current.length);
    },
    clearWorld: () => {
      if (!sceneRef.current) return;
      blocksRef.current.forEach(block => sceneRef.current.remove(block));
      blocksRef.current = [];
    }
  }));

  useEffect(() => {
    // Setup Three.js
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.6 / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.6, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Ground
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Initial blocks
    const initialBlocks = [];
    for (let x = -10; x <= 10; x++) {
      for (let z = -10; z <= 10; z++) {
        const block = createBlock(x, 0, z, 0x4ade80);
        scene.add(block);
        initialBlocks.push(block);
      }
    }
    blocksRef.current = initialBlocks;

    camera.position.set(0, 5, 15);

    // Controls
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

    const handleClick = () => {
      renderer.domElement.requestPointerLock();
    };

    const handlePointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === renderer.domElement;
    };

    renderer.domElement.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    // Raycaster for block interaction
    const raycaster = new THREE.Raycaster();

    const handleMouseDown = (e) => {
      if (!isLockedRef.current) return;

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(blocksRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (e.button === 0) {
          // Left click - break
          scene.remove(hit.object);
          blocksRef.current = blocksRef.current.filter(b => b !== hit.object);
        } else if (e.button === 2) {
          // Right click - place
          const pos = hit.object.position.clone();
          const normal = hit.face.normal.clone();
          pos.add(normal);
          const newBlock = createBlock(
            Math.floor(pos.x),
            Math.floor(pos.y),
            Math.floor(pos.z),
            0x854d0e
          );
          scene.add(newBlock);
          blocksRef.current.push(newBlock);
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', e => e.preventDefault());

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const speed = 0.12;
      const keys = keysRef.current;
      const velocity = velocityRef.current;

      let moveX = 0, moveZ = 0;
      if (keys['w'] || keys['arrowup']) moveZ -= 1;
      if (keys['s'] || keys['arrowdown']) moveZ += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const angle = yawRef.current;
        velocity.x = (moveX * Math.cos(angle) - moveZ * Math.sin(angle)) * speed;
        velocity.z = (moveX * Math.sin(angle) + moveZ * Math.cos(angle)) * speed;
      } else {
        velocity.x *= 0.8;
        velocity.z *= 0.8;
      }

      camera.position.x += velocity.x;
      camera.position.z += velocity.z;

      // Simple gravity
      velocity.y -= 0.02;
      camera.position.y += velocity.y;
      if (camera.position.y < 2) {
        camera.position.y = 2;
        velocity.y = 0;
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

  function createBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x + 0.5, y + 0.5, z + 0.5);
    return block;
  }

  return <div ref={mountRef} style={{ width: '100%', height: '100%', background: '#111' }} />;
});

export default Game;