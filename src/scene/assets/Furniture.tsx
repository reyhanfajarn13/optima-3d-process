import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import type { Vec3 } from '../../data/process';
import { G, PALETTE } from '../materials';
import { screenMaterial, type ScreenKind } from '../screens';
import { Box, Cyl, Shadow } from './primitives';

export function Desk({ position = [0, 0, 0], width = 1.7, depth = 0.85, color = PALETTE.desk }: { position?: Vec3; width?: number; depth?: number; color?: string }) {
  const lx = width / 2 - 0.08;
  const lz = depth / 2 - 0.08;
  return (
    <group position={position}>
      <Shadow size={[width + 0.6, depth + 0.6]} />
      <Box color={color} position={[0, 0.8, 0]} scale={[width, 0.06, depth]} />
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], i) => (
        <Box key={i} color={PALETTE.deskLeg} position={[x, 0.39, z]} scale={[0.05, 0.78, 0.05]} />
      ))}
    </group>
  );
}

/** Monitor desktop dengan isi layar dari tekstur canvas */
export function Monitor({ position = [0, 0.83, 0], rotation = 0, screen, size = 1 }: { position?: Vec3; rotation?: number; screen: ScreenKind; size?: number }) {
  const w = 1.0 * size;
  const h = 0.62 * size;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box color={PALETTE.dark} position={[0, 0.02, 0]} scale={[0.36, 0.04, 0.24]} />
      <Box color={PALETTE.dark} position={[0, 0.2, -0.03]} scale={[0.06, 0.36, 0.05]} />
      <Box color={PALETTE.darker} position={[0, 0.25 + h / 2, 0]} scale={[w + 0.06, h + 0.06, 0.05]} />
      <mesh geometry={G.plane} material={screenMaterial(screen)} position={[0, 0.25 + h / 2, 0.027]} scale={[w, h, 1]} />
    </group>
  );
}

export function Laptop({ position = [0, 0.83, 0], rotation = 0, screen }: { position?: Vec3; rotation?: number; screen: ScreenKind }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box color={PALETTE.metal} position={[0, 0.015, 0.1]} scale={[0.72, 0.03, 0.46]} />
      <group position={[0, 0.03, -0.12]} rotation={[-0.25, 0, 0]}>
        <Box color={PALETTE.metal} position={[0, 0.23, 0]} scale={[0.72, 0.46, 0.025]} />
        <mesh geometry={G.plane} material={screenMaterial(screen)} position={[0, 0.23, 0.014]} scale={[0.66, 0.41, 1]} />
      </group>
    </group>
  );
}

/** Wall screen besar dengan dua kaki */
export function BigScreen({ position = [0, 0, 0], rotation = 0, screen, width = 3.6 }: { position?: Vec3; rotation?: number; screen: ScreenKind; width?: number }) {
  const h = width * 0.625;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Shadow size={[width + 0.8, 1.4]} />
      <Box color={PALETTE.dark} position={[-width / 2 + 0.3, 0.75, -0.05]} scale={[0.1, 1.5, 0.1]} />
      <Box color={PALETTE.dark} position={[width / 2 - 0.3, 0.75, -0.05]} scale={[0.1, 1.5, 0.1]} />
      <Box color={PALETTE.dark} position={[-width / 2 + 0.3, 0.03, 0]} scale={[0.5, 0.06, 0.6]} />
      <Box color={PALETTE.dark} position={[width / 2 - 0.3, 0.03, 0]} scale={[0.5, 0.06, 0.6]} />
      <Box color={PALETTE.darker} position={[0, 1.5 + h / 2, -0.05]} scale={[width + 0.14, h + 0.14, 0.12]} />
      <mesh geometry={G.plane} material={screenMaterial(screen)} position={[0, 1.5 + h / 2, 0.012]} scale={[width, h, 1]} />
    </group>
  );
}

export function Cabinet({ position = [0, 0, 0] }: { position?: Vec3 }) {
  return (
    <group position={position}>
      <Shadow size={[1.6, 1.3]} />
      <Box color="#9aa6b4" position={[0, 0.7, 0]} scale={[0.9, 1.4, 0.7]} />
      {[0.3, 0.72, 1.14].map((y) => (
        <group key={y}>
          <Box color="#b8c2ce" position={[0, y, 0.36]} scale={[0.8, 0.36, 0.02]} />
          <Box color={PALETTE.dark} position={[0, y + 0.08, 0.38]} scale={[0.22, 0.04, 0.03]} />
        </group>
      ))}
      {/* map dokumen di atas lemari */}
      <Box color="#f5a524" position={[-0.18, 1.48, 0]} rotation={[0, 0.2, 0]} scale={[0.4, 0.06, 0.3]} />
      <Box color="#2a78d6" position={[0.15, 1.53, 0.02]} rotation={[0, -0.15, 0]} scale={[0.4, 0.06, 0.3]} />
    </group>
  );
}

export function Calculator({ position = [0, 0.83, 0] }: { position?: Vec3 }) {
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      <Box color={PALETTE.dark} position={[0, 0.02, 0]} scale={[0.22, 0.04, 0.3]} />
      <Box color="#a7d3a2" glow position={[0, 0.045, -0.08]} scale={[0.16, 0.01, 0.07]} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <Box key={`${r}${c}`} color="#e1e0d9" position={[-0.06 + c * 0.06, 0.045, 0.0 + r * 0.05]} scale={[0.04, 0.01, 0.035]} />),
      )}
    </group>
  );
}

export function Chair({ position = [0, 0, 0], rotation = 0, color = PALETTE.dark, high = false }: { position?: Vec3; rotation?: number; color?: string; high?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cyl color={PALETTE.metal} low position={[0, 0.25, 0]} scale={[0.07, 0.5, 0.07]} />
      <Box color={PALETTE.metal} position={[0, 0.03, 0]} scale={[0.6, 0.04, 0.08]} />
      <Box color={PALETTE.metal} position={[0, 0.03, 0]} scale={[0.08, 0.04, 0.6]} />
      <Box color={color} position={[0, 0.52, 0]} scale={[0.6, 0.1, 0.58]} />
      <Box color={color} position={[0, high ? 1.05 : 0.85, -0.27]} scale={[0.6, high ? 1.0 : 0.6, 0.08]} />
    </group>
  );
}

/** Amplop email — dipakai untuk alur proposal */
export function Envelope({ color = '#d03b3b', scale = 1 }: { color?: string; scale?: number }) {
  return (
    <group scale={scale}>
      <Box color={PALETTE.paper} scale={[0.6, 0.05, 0.4]} />
      <Box color="#c9c6bc" position={[-0.14, 0.03, -0.06]} rotation={[0, 0.6, 0]} scale={[0.36, 0.012, 0.025]} />
      <Box color="#c9c6bc" position={[0.14, 0.03, -0.06]} rotation={[0, -0.6, 0]} scale={[0.36, 0.012, 0.025]} />
      <Box color={color} position={[0, 0.035, 0.03]} scale={[0.1, 0.02, 0.1]} />
    </group>
  );
}

/** Printer — kertas proposal keluar saat proposal dibuat */
export function Printer({ position = [0, 0, 0], printing }: { position?: Vec3; printing: boolean }) {
  const paper = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  useFrame((_, dt) => {
    if (!paper.current) return;
    progress.current = printing ? Math.min(1, progress.current + dt * 0.6) : Math.max(0, progress.current - dt * 2);
    paper.current.position.z = 0.05 + progress.current * 0.45;
    paper.current.visible = progress.current > 0.01;
  });
  return (
    <group position={position}>
      <Box color={PALETTE.metal} position={[0, 0.4, 0]} scale={[0.5, 0.8, 0.5]} />
      <Box color="#e9edf1" position={[0, 0.98, 0]} scale={[0.7, 0.36, 0.55]} />
      <Box color={PALETTE.dark} position={[0, 1.07, 0.28]} scale={[0.5, 0.04, 0.02]} />
      <Box color="#0ca30c" glow position={[0.25, 1.17, 0.2]} scale={[0.05, 0.02, 0.05]} />
      <mesh ref={paper} geometry={G.box} position={[0, 1.02, 0.05]} scale={[0.42, 0.01, 0.55]} visible={false}>
        <meshLambertMaterial color={PALETTE.paper} />
      </mesh>
    </group>
  );
}
