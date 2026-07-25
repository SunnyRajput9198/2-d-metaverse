import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Avatar Component: Loads .glb model, plays Walking animation loop, handles WASD movement & rotation
function Avatar({ modelPath = '/models/walking.glb' }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);

  // Track WASD / Arrow key presses
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const isMoving = keys.forward || keys.backward || keys.left || keys.right;

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') setKeys((prev) => ({ ...prev, forward: true }));
      if (k === 's' || k === 'arrowdown') setKeys((prev) => ({ ...prev, backward: true }));
      if (k === 'a' || k === 'arrowleft') setKeys((prev) => ({ ...prev, left: true }));
      if (k === 'd' || k === 'arrowright') setKeys((prev) => ({ ...prev, right: true }));
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') setKeys((prev) => ({ ...prev, forward: false }));
      if (k === 's' || k === 'arrowdown') setKeys((prev) => ({ ...prev, backward: false }));
      if (k === 'a' || k === 'arrowleft') setKeys((prev) => ({ ...prev, left: false }));
      if (k === 'd' || k === 'arrowright') setKeys((prev) => ({ ...prev, right: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Animation Playback: Play Walking animation on loop (or pause clip when idle)
  useEffect(() => {
    if (!actions || names.length === 0) return;

    // Find "Walking" action (case-insensitive fallback)
    const walkName = names.find((n) => n.toLowerCase().includes('walk')) || names[0];
    const action = actions[walkName];

    if (action) {
      if (isMoving) {
        if (action.paused) action.paused = false;
        action.reset().fadeIn(0.2).play();
      } else {
        // Pause clip when no keys pressed
        action.paused = true;
      }
    }
  }, [isMoving, actions, names]);

  // Movement & Rotation loop on every frame
  useFrame((_, delta) => {
    if (!group.current) return;

    const speed = 4;
    const dir = new THREE.Vector3(0, 0, 0);

    if (keys.forward) dir.z -= 1;
    if (keys.backward) dir.z += 1;
    if (keys.left) dir.x -= 1;
    if (keys.right) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();

      // Move avatar position on plane
      group.current.position.addScaledVector(dir, speed * delta);

      // Rotate avatar towards movement direction
      const targetRotation = Math.atan2(dir.x, dir.z);
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotation,
        0.15
      );
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

// Minimal R3F Scene Container
export default function AvatarScene() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        {/* 1. Basic Ambient + Directional Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />

        {/* 2. Camera Controls */}
        <OrbitControls />

        {/* 3. Simple Flat Ground Plane (Gray/Green) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#374151" />
        </mesh>

        {/* 4. Avatar Character */}
        <Avatar modelPath="/models/walking.glb" />
      </Canvas>
    </div>
  );
}
