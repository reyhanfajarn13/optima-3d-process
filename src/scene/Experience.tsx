import { AdaptiveDpr, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { OVERVIEW_CAMERA } from '../data/process';
import { useApp } from '../store';
import { Stations } from './assets/Stations';
import { CameraRig, ViewOffset } from './CameraRig';
import { Couriers } from './Couriers';
import { Flows } from './Flows';
import { Labels } from './Labels';
import { World } from './World';

const BG = '#e5f1eb';
const MAX_DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.75) : 1;

export default function Experience({ onReady }: { onReady: () => void }) {
  const animate = useApp((s) => s.animate);
  const [dpr, setDpr] = useState(MAX_DPR);
  const labelPortal = useRef<HTMLDivElement>(null!);

  return (
    <>
    <div ref={labelPortal} className="scene-labels" />
    <Canvas
      className="scene-canvas"
      flat
      dpr={dpr}
      frameloop={animate ? 'always' : 'demand'}
      camera={{ position: OVERVIEW_CAMERA.position, fov: 42, near: 0.5, far: 420 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={() => requestAnimationFrame(onReady)}
      onPointerMissed={() => useApp.getState().setHovered(null)}
      aria-label="Peta proses bisnis 3D"
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 200, 420]} />
      <hemisphereLight args={['#ffffff', '#aab6c4', 2.1]} />
      <directionalLight position={[18, 30, 22]} intensity={1.7} />

      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(MAX_DPR)}
        onFallback={() => setDpr(1)}
      />
      <AdaptiveDpr pixelated />

      <World />
      <Stations />
      <Flows />
      <Couriers portal={labelPortal} />
      <Labels portal={labelPortal} />

      <OrbitControls
        makeDefault
        regress
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={320}
        maxPolarAngle={Math.PI * 0.46}
        screenSpacePanning={false}
        zoomToCursor
        target={OVERVIEW_CAMERA.target}
      />
      <CameraRig />
      <ViewOffset />
    </Canvas>
    </>
  );
}
