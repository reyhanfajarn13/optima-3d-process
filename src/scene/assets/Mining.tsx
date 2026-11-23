import { COLORS, type Vec3 } from '../../data/process';
import { Box, Cone, Cyl, Shadow } from './primitives';
import { G, mat, PALETTE } from '../materials';
import { Sign } from './Signs';

export function DumpTruck({ position, rotation = 0, scale = 1 }: { position: Vec3; rotation?: number; scale?: number }) {
  return <group position={position} rotation={[0, rotation, 0]} scale={scale}>
    <Shadow size={[3.5, 1.8]} />
    <Box color="#eebd3f" position={[1, 0.9, 0]} scale={[0.9, 1.2, 1.3]} />
    <Box color="#35556b" position={[1.46, 1.1, 0]} scale={[0.03, 0.45, 1.1]} />
    <Box color="#c99023" position={[-0.55, 0.65, 0]} scale={[2, 0.25, 1.5]} />
    <Box color="#f6c346" position={[-0.55, 1.1, -0.7]} scale={[2, 0.9, 0.1]} />
    <Box color="#f6c346" position={[-0.55, 1.1, 0.7]} scale={[2, 0.9, 0.1]} />
    <Box color="#eab33d" position={[-1.5, 1.1, 0]} scale={[0.1, 0.9, 1.4]} />
    <Cone color={PALETTE.coal} position={[-0.55, 1.25, 0]} scale={[1.8, 0.8, 1.25]} />
    {[-1, 0, 1].flatMap((x) => [-0.74, 0.74].map((z) => <Cyl key={`${x}-${z}`} color="#252b2c" position={[x, 0.38, z]} rotation={[Math.PI/2,0,0]} scale={[0.76,0.25,0.76]} />))}
  </group>;
}

function Excavator() {
  return <group position={[4.7, 1.3, -3.2]} rotation={[0, -0.7, 0]}>
    {[-0.65,0.65].map((z) => <Box key={z} color="#303b39" position={[0,0.2,z]} scale={[2.4,0.55,0.4]} />)}
    <Box color="#ecb830" position={[0,0.75,0]} scale={[1.8,0.7,1.5]} />
    <Box color="#29444f" position={[0.45,1.4,0.1]} scale={[0.8,0.9,1]} />
    <Box color="#efbc3a" position={[-1,1.8,0]} rotation={[0,0,-0.65]} scale={[0.3,2.7,0.4]} />
    <Box color="#dfa92c" position={[-2.1,1.95,0]} rotation={[0,0,0.9]} scale={[0.25,2.1,0.35]} />
    <Box color="#3b403b" position={[-2.9,1.3,0]} rotation={[0,0,-0.3]} scale={[0.8,0.6,0.9]} />
  </group>;
}

/** Tambang terbuka berteras menjadi elemen utama area customer. */
export function MiningLandscape() {
  return <group>
    <Box color="#b7a17c" position={[0,0.02,0]} scale={[19,0.16,23]} />
    <group position={[0,0,-3]}>
      {[{outer:8,inner:6.4,y:1.5,c:'#ad9270'}, {outer:6.4,inner:4.9,y:1.05,c:'#c2a57d'}, {outer:4.9,inner:3.3,y:0.6,c:'#987c5c'}].map((r) => <group key={r.outer}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,r.y,0]} scale={[1,0.75,1]} material={mat(r.c)}><ringGeometry args={[r.inner,r.outer,32]} /></mesh>
        <mesh position={[0,r.y-0.2,0]} scale={[1,1,0.75]} material={mat(r.c)}><cylinderGeometry args={[r.inner,r.inner,0.4,32,1,true]} /></mesh>
      </group>)}
      <mesh geometry={G.circle} rotation={[-Math.PI/2,0,0]} position={[0,0.15,0]} material={mat('#44443a')} scale={[6.6,5,1]} />
      <Cone color="#252b2c" position={[-0.8,0.65,0]} scale={[3.6,1,2.8]} />
      <Cone color="#363833" position={[1.5,0.55,-0.5]} scale={[2.6,0.8,2]} />
    </group>
    <Excavator />
    <Box color="#877557" position={[0,0.13,7.1]} scale={[18,0.04,3]} />
    <DumpTruck position={[2.8,0.2,7]} rotation={Math.PI} scale={1.2} />
    <DumpTruck position={[-3,1.5,-7]} rotation={0.45} scale={0.85} />
    <group position={[5,0.1,2]}>
      {[0,1,2].map((i) => <Cone key={i} color={i%2 ? '#343938' : '#252d30'} position={[i*1.2-1,1.1,0]} scale={[3.3,2.2,3.4]} />)}
      <Box color="#4c5a57" position={[0,2.4,-1]} rotation={[0,0,-0.2]} scale={[6,0.28,0.7]} />
      {[-2,2].map((x) => <Box key={x} color="#75847b" position={[x,1.1,-1]} scale={[0.2,2.2,0.2]} />)}
    </group>
    <Sign text="CUSTOMER TAMBANG" subtitle="Batu bara · operasional & tender" position={[0,2.6,10.4]} width={10} color={COLORS.customer} />
    {[-8.5,8.5].map((x) => <Cyl key={x} color="#d4c9a8" position={[x,1,9.7]} scale={[0.18,2,0.18]} />)}
  </group>;
}
