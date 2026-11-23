import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import type { Vec3 } from '../../data/process';
import { useApp } from '../../store';
import { G, mat, PALETTE } from '../materials';
import { Ball, Box, Shadow } from './primitives';
import { CELEBRATION_DURATION_MS } from '../../lib/revenue';

export type Pose = 'type' | 'talk' | 'idle' | 'think' | 'celebrate';

interface PersonProps {
  position?: Vec3;
  rotation?: number;
  shirt: string;
  pose?: Pose;
  skin?: string;
  hair?: string;
  tie?: string;
  hardhat?: boolean;
  phase?: number;
  celebrationAt?: number | null;
}

/** Karakter low-poly (± 1,9 m) dengan animasi idle / mengetik / bicara */
export function Person({ position = [0, 0, 0], rotation = 0, shirt, pose = 'idle', skin = PALETTE.skin, hair = PALETTE.hair, tie, hardhat, phase = 0, celebrationAt = null }: PersonProps) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useFrame(({ clock }) => {
    if (!body.current) return;
    if (pose === 'celebrate' && armL.current && armR.current) {
      const elapsed = celebrationAt === null ? CELEBRATION_DURATION_MS : Date.now() - celebrationAt;
      const dancing = elapsed < CELEBRATION_DURATION_MS;
      const t = elapsed / 1000 + phase;
      body.current.position.y = dancing ? Math.abs(Math.sin(t * 5)) * 0.4 : 0;
      body.current.rotation.z = dancing ? Math.sin(t * 4) * 0.1 : 0;
      armL.current.rotation.set(-2.7 + (dancing ? Math.sin(t * 7) * 0.3 : 0), 0, -0.45);
      armR.current.rotation.set(-2.7 - (dancing ? Math.sin(t * 7) * 0.3 : 0), 0, 0.45);
      if (head.current) head.current.rotation.set(0, dancing ? Math.sin(t * 3) * 0.25 : 0, 0);
      if (dancing) invalidate();
      return;
    }
    body.current.rotation.z = 0;
    if (!useApp.getState().animate) { body.current.position.y = 0; return; }
    const t = clock.elapsedTime + phase;
    body.current.position.y = Math.sin(t * 2) * 0.015;
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * (pose === 'talk' ? 0.35 : 0.15);
      head.current.rotation.x = pose === 'think' ? 0.15 + Math.sin(t) * 0.05 : Math.sin(t * 0.9) * 0.04;
    }
    if (armL.current && armR.current) {
      armL.current.rotation.z = 0;
      armR.current.rotation.z = 0;
      if (pose === 'type') {
        armL.current.rotation.x = -1.15 + Math.sin(t * 14) * 0.06;
        armR.current.rotation.x = -1.15 + Math.cos(t * 13) * 0.06;
      } else if (pose === 'talk') {
        armR.current.rotation.x = -0.7 + Math.sin(t * 2.2) * 0.35;
        armR.current.rotation.z = -0.2;
        armL.current.rotation.x = Math.sin(t * 1.3) * 0.08;
      } else if (pose === 'think') {
        armR.current.rotation.x = -2.2;
        armR.current.rotation.z = 0.35;
        armL.current.rotation.x = -0.4;
      } else {
        armL.current.rotation.x = Math.sin(t * 1.4) * 0.08;
        armR.current.rotation.x = -Math.sin(t * 1.4) * 0.08;
      }
    }
  });

  const initialArm = pose === 'celebrate' ? -2.7 : pose === 'type' ? -1.15 : pose === 'think' ? -2.2 : 0;

  return (
    <group position={position} rotation={[0, rotation, 0]} name={pose === 'celebrate' ? 'Happy celebrating person' : 'Person'}>
      <Shadow size={[1.1, 1.1]} />
      <group ref={body}>
        {/* kaki */}
        <Box color={PALETTE.pants} position={[-0.13, 0.43, 0]} scale={[0.19, 0.86, 0.22]} />
        <Box color={PALETTE.pants} position={[0.13, 0.43, 0]} scale={[0.19, 0.86, 0.22]} />
        <Box color={PALETTE.darker} position={[-0.13, 0.04, 0.05]} scale={[0.2, 0.08, 0.3]} />
        <Box color={PALETTE.darker} position={[0.13, 0.04, 0.05]} scale={[0.2, 0.08, 0.3]} />
        {/* badan */}
        <mesh geometry={G.capsule} material={mat(shirt)} position={[0, 1.2, 0]} scale={[0.6, 0.42, 0.42]} />
        <Box color="#ffffff" position={[0.13, 1.3, 0.2]} scale={[0.1, 0.13, 0.02]} />
        {tie && <Box color={tie} position={[0, 1.25, 0.21]} scale={[0.07, 0.36, 0.02]} />}
        {/* lengan */}
        <group ref={armL} position={[-0.37, 1.45, 0]} rotation={[initialArm, 0, 0]}>
          <mesh geometry={G.capsule} material={mat(shirt)} position={[0, -0.27, 0]} scale={[0.16, 0.3, 0.16]} />
          <Ball color={skin} position={[0, -0.58, 0]} scale={0.14} />
        </group>
        <group ref={armR} position={[0.37, 1.45, 0]} rotation={[initialArm, 0, 0]}>
          <mesh geometry={G.capsule} material={mat(shirt)} position={[0, -0.27, 0]} scale={[0.16, 0.3, 0.16]} />
          <Ball color={skin} position={[0, -0.58, 0]} scale={0.14} />
        </group>
        {/* kepala */}
        <group ref={head} position={[0, 1.78, 0]}>
          <Ball color={skin} scale={[0.42, 0.46, 0.42]} />
          <Box color={PALETTE.darker} position={[-0.08, 0.03, 0.2]} scale={[0.045, 0.06, 0.02]} />
          <Box color={PALETTE.darker} position={[0.08, 0.03, 0.2]} scale={[0.045, 0.06, 0.02]} />
          {pose === 'celebrate' && <mesh material={mat('#6c3524')} position={[0,-0.05,0.21]} rotation={[0,0,Math.PI]}><torusGeometry args={[0.1,0.015,5,14,Math.PI]} /></mesh>}
          {hardhat ? (
            <>
              <mesh geometry={G.sphere} material={mat('#f5c518')} position={[0, 0.1, 0]} scale={[0.46, 0.36, 0.46]} />
              <Box color="#f5c518" position={[0, 0.1, 0.08]} scale={[0.5, 0.03, 0.56]} />
            </>
          ) : (
            <mesh geometry={G.sphere} material={mat(hair)} position={[0, 0.12, -0.07]} scale={[0.45, 0.3, 0.42]} />
          )}
        </group>
      </group>
    </group>
  );
}
