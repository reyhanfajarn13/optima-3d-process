import * as THREE from 'three';
import { STEPS, ZONES, type Vec3 } from '../data/process';
import { useApp } from '../store';
import { G, mat, PALETTE } from './materials';
import { Box, Cone, Cyl } from './assets/primitives';
import { LogoPanel, Sign } from './assets/Signs';
import { FuelDepot } from './assets/FuelDepot';
import { DeliveryRoad } from './Delivery';

const tint = (hex: string, amount: number) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), amount).getHexString();

function Zone({ step }: { step: number }) {
  const zone = ZONES.find((z) => z.step === step)!;
  const activeStep = useApp((s) => s.activeStep);
  const active = activeStep === step;
  const color = STEPS[step - 1].color;
  const [w, d] = zone.size;
  const surface = active ? tint(color, 0.72) : activeStep === 0 ? tint(color, 0.89) : '#e5eee7';
  return (
    <group position={zone.center}>
      <Box color={active ? color : tint(color, 0.45)} position={[0, 0.03, 0]} scale={[w + 0.4, 0.06, d + 0.4]} />
      <Box color={surface} position={[0, 0.04, 0]} scale={[w, 0.08, d]} />
    </group>
  );
}

const TREES: Vec3[] = [
  [-47, 0, -15], [-47, 0, 16], [-30, 0, -20], [-12, 0, -20], [8, 0, -20], [28, 0, -20],
  [-37, 0, 20], [-18, 0, 20], [4, 0, 20], [24, 0, 20], [56, 0, -14], [56, 0, 15],
];

function Tree({ position, s = 1 }: { position: Vec3; s?: number }) {
  return (
    <group position={position} scale={s}>
      <Cyl color="#8a6a4d" low position={[0, 0.5, 0]} scale={[0.25, 1, 0.25]} />
      <Cone color="#5fa36a" position={[0, 1.5, 0]} scale={[1.5, 1.6, 1.5]} />
      <Cone color="#6fb47a" position={[0, 2.3, 0]} scale={[1.1, 1.2, 1.1]} />
    </group>
  );
}

/** Gedung cutaway: dinding belakang dan sisi, bagian depan terbuka agar alur terbaca. */
function TemOffice() {
  return <group>
    <Box color="#d4d1ba" position={[-6, -0.22, 1]} scale={[77, 0.4, 33]} />
    <Box color="#f5f0dd" position={[-6, -0.015, 1]} scale={[76, 0.06, 32]} />
    {/* Lantai kantor dengan pola sambungan ubin. */}
    {Array.from({length: 20}, (_, i) => <Box key={`x${i}`} color="#e3dcc7" position={[-43+i*4,0.02,1]} scale={[0.025,0.01,32]} />)}
    {Array.from({length: 9}, (_, i) => <Box key={`z${i}`} color="#e3dcc7" position={[-6,0.02,-15+i*4]} scale={[76,0.01,0.025]} />)}
    {/* Fasade belakang: jendela, kolom, dan identitas TEM. */}
    <Box color="#f9f5e8" position={[-6,2.8,-15]} scale={[76,5.6,0.45]} />
    <Box color="#173a63" position={[-6,0.5,-14.7]} scale={[76,1,0.1]} />
    {[-39,-29,-19,-9,1,11,21,28].map((x) => <group key={x} position={[x,0,-14.7]}>
      <Box color="#d2e6e5" position={[0,3,0.1]} scale={[5.6,3.2,0.1]} />
      <Box color="#98b4b7" position={[0,3,0.17]} scale={[0.09,3.3,0.04]} />
      <Box color="#98b4b7" position={[0,3,0.17]} scale={[5.7,0.09,0.04]} />
    </group>)}
    {[-44,-24,-4,16,32].map((x) => <group key={x}>
      <Box color="#d5d6c7" position={[x,3.2,-14.6]} scale={[0.7,6.4,0.7]} />
      <Box color="#d5d6c7" position={[x,0.55,16.7]} scale={[0.7,1.1,0.7]} />
    </group>)}
    <Box color="#173a63" position={[-6,6,-14.6]} scale={[77,0.5,1]} />
    <Box color="#f9f5e8" position={[-44,1.7,1]} scale={[0.45,3.4,32]} />
    <Box color="#d9e7e2" position={[32,0.55,1]} scale={[0.35,1.1,32]} />
    <Box color="#1d4f60" position={[-6,0.3,16.8]} scale={[77,0.6,0.25]} />
    <LogoPanel brand="tem" position={[-6,4.5,-14.1]} width={14} />
    <Sign text="DATA & ANALISIS" position={[-32,2,-14.1]} width={8} color="#466959" />
    <Sign text="SALES & APPROVAL" position={[23,2,-14.1]} width={10} color="#466959" />
    {/* Area kerja, meja rapat, dan tanaman di dalam kantor. */}
    <Box color="#b58a59" position={[8,0.85,-10.5]} scale={[7,0.2,2.2]} />
    {[-2,2].map((x) => <Box key={x} color="#5d746e" position={[8+x,0.4,-10.5]} scale={[0.15,0.8,1.5]} />)}
    {[5.5,8,10.5].flatMap((x) => [-12.2,-8.8].map((z) => <group key={`${x}-${z}`}>
      <Box color="#31576c" position={[x,0.6,z]} scale={[0.8,0.15,0.8]} />
      <Cyl color="#56716d" position={[x,0.3,z]} scale={[0.13,0.6,0.13]} />
    </group>))}
    {[-21,-5,20,29].map((x) => <group key={x} position={[x,0,12]}>
      <Cyl color="#d2a97a" position={[0,0.4,0]} scale={[0.9,0.8,0.9]} />
      <Cone color="#568367" position={[0,1.3,0]} scale={[1.4,1.4,1.4]} />
    </group>)}
  </group>;
}

export function World() {
  return (
    <>
      <mesh geometry={G.plane} material={mat(PALETTE.ground)} rotation={[-Math.PI / 2, 0, 0]} scale={[1000, 1000, 1]} />
      <TemOffice />
      <DeliveryRoad />
      <FuelDepot />
      <Box color="#e3d0a6" position={[34,0.03,3]} scale={[5,0.06,3]} />
      {ZONES.map((z) => (
        <Zone key={z.step} step={z.step} />
      ))}
      {TREES.map((p, i) => (
        <Tree key={i} position={p} s={0.8 + ((i * 37) % 5) * 0.1} />
      ))}
    </>
  );
}
