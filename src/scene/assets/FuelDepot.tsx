import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { DEPOT_POSITION } from '../../data/logistics';
import { useApp } from '../../store';
import { Box, Cyl, Shadow } from './primitives';
import { LogoPanel, Sign } from './Signs';

export function FuelDepot() {
  const pump = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const delivery = useApp((s) => s.delivery);
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    const at = Date.now();
    const loading = delivery && at >= delivery.startedAt && at < delivery.departedAt;
    if (pump.current) {
      pump.current.visible = !!loading;
      if (loading) pump.current.children.forEach((p, i) => { p.position.x = 3.7 + ((at / 350 + i / 3) % 1) * 5; });
    }
    if (beacon.current) beacon.current.visible = !!loading && Math.floor(at / 260) % 2 === 0;
    if (delivery && at < delivery.departedAt) invalidate();
  });
  return <group position={DEPOT_POSITION} name="TEM HSD fuel depot">
    <Shadow size={[23,14]} />
    <Box color="#e3dcc5" position={[0,0.04,0]} scale={[21,0.2,12]} />
    <Box color="#e4ad37" position={[0,0.18,-5.6]} scale={[21,0.18,0.2]} />
    {[-6,1].map((x, i) => <group key={x} position={[x,0,0]}>
      <Cyl color="#a4afaa" position={[0,0.35,0]} scale={[6,0.5,6]} />
      <Cyl color="#edf1e8" position={[0,3.2,0]} scale={[5.2,5.2,5.2]} />
      <Cyl color="#286898" position={[0,1.6,0]} scale={[5.24,0.45,5.24]} />
      <Cyl color="#b7c9c4" position={[0,5.85,0]} scale={[5.35,0.2,5.35]} />
      <Cyl color="#849a93" position={[0,6.1,0]} scale={[1.1,0.3,1.1]} />
      <Sign text={`HSD 0${i+1}`} position={[0,3.4,2.64]} width={3.8} />
      {[-0.45,0.45].map((r) => <Box key={r} color="#80958e" position={[r,3.3,2.8]} scale={[0.08,5.6,0.08]} />)}
      {Array.from({length:10},(_,j) => <Box key={j} color="#9aaba4" position={[0,0.8+j*0.5,2.8]} scale={[1,0.07,0.07]} />)}
    </group>)}
    <LogoPanel brand="tem" width={6.8} position={[-3,7.1,0]} />
    {/* Pipa dan gantry pemuatan di luar kantor. */}
    <Box color="#336c82" position={[5.9,1.1,0]} scale={[6.2,0.22,0.22]} />
    <Box color="#336c82" position={[8.7,2.5,0]} scale={[0.25,3,0.25]} />
    <Box color="#336c82" position={[9.4,4,0]} scale={[1.65,0.25,0.25]} />
    <Box color="#43564b" position={[10.1,3.4,0.6]} scale={[0.18,1.1,1.2]} />
    <group ref={pump}>{[0,1,2].map((i) => <Box key={i} color="#f5b832" glow position={[4,1.1,0]} scale={[0.4,0.4,0.4]} />)}</group>
    <Cyl ref={beacon} color="#ffb527" glow position={[8.7,4.4,0]} scale={[0.45,0.5,0.45]} />
    <Sign text="TANGKI HSD · TEM" subtitle="Pemuatan & pengiriman ke customer" width={13} position={[-1,1.5,5.7]} />
    {[-10,10].map((x) => <Box key={x} color="#cf9d35" position={[x,0.65,5.3]} scale={[0.15,1.3,0.15]} />)}
  </group>;
}
