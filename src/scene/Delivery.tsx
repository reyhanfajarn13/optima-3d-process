import { Html, Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { DELIVERY_WAYPOINTS } from '../data/logistics';
import { deliveryProgress } from '../lib/revenue';
import { fmtRpCompact } from '../lib/format';
import { useApp } from '../store';
import { Box, Cyl, Shadow } from './assets/primitives';
import { LogoPanel, Sign } from './assets/Signs';

export const DELIVERY_PATH = new THREE.CatmullRomCurve3(DELIVERY_WAYPOINTS.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
const ROAD_POINTS = DELIVERY_PATH.getPoints(90);

export function DeliveryRoad() {
  return <>
    <Line points={ROAD_POINTS} color="#a5a995" lineWidth={28} />
    <Line points={ROAD_POINTS.map((p) => p.clone().add(new THREE.Vector3(0,0.02,0)))} color="#fff0be" lineWidth={1.7} dashed dashSize={1} gapSize={1} />
  </>;
}

function TankerTruck({ wheels }: { wheels: RefObject<THREE.Group | null> }) {
  return <group>
    <Shadow size={[9,3.5]} />
    <Box color="#2f443e" position={[0,0.9,0]} scale={[8,0.35,2]} />
    <Cyl color="#e2e8df" position={[-0.8,2.15,0]} rotation={[0,0,Math.PI/2]} scale={[2.5,5.4,2.5]} />
    <Cyl color="#d1a444" position={[-0.8,2.15,0]} rotation={[0,0,Math.PI/2]} scale={[2.53,0.6,2.53]} />
    <LogoPanel brand="tem" width={3} position={[-0.8,2.2,1.28]} />
    <Box color="#f6b832" position={[3,1.65,0]} scale={[1.8,2.25,2.3]} />
    <Box color="#436575" position={[3.91,2,0]} scale={[0.03,0.9,1.9]} />
    <Box color="#63818a" position={[3,2,1.16]} scale={[1.35,0.85,0.03]} />
    <Box color="#a6c0bf" position={[3,2,-1.16]} scale={[1.35,0.85,0.03]} />
    <Box color="#c4d1c4" position={[3.95,0.8,0]} scale={[0.18,0.2,2.4]} />
    {[-0.75,0.75].map((z) => <Box key={z} color="#fff4c2" glow position={[3.94,1.25,z]} scale={[0.04,0.35,0.4]} />)}
    <Sign text="HSD" width={1.5} position={[3,1.2,1.17]} />
    <group ref={wheels}>
      {[-2.8,-1.3,2.8].flatMap((x) => [-1.15,1.15].map((z) => <group key={`${x}-${z}`} position={[x,0.65,z]}>
        <Cyl color="#263330" rotation={[Math.PI/2,0,0]} scale={[1.25,0.4,1.25]} />
        <Cyl color="#9baaa2" rotation={[Math.PI/2,0,0]} scale={[0.7,0.42,0.7]} />
        <Box color="#d1d9cc" scale={[0.12,0.7,0.44]} />
      </group>))}
    </group>
  </group>;
}

export function Delivery({ portal }: { portal: RefObject<HTMLDivElement> }) {
  const delivery = useApp((s) => s.delivery);
  const proposal = useApp((s) => s.proposal);
  const paid = useApp((s) => s.proposalStatus === 'paid');
  const truck = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const temp = useMemo(() => new THREE.Vector3(), []);
  const distance = useMemo(() => DELIVERY_PATH.getLength(), []);
  useFrame(() => {
    if (!truck.current) return;
    const t = delivery ? deliveryProgress(delivery) : 0;
    DELIVERY_PATH.getPointAt(t, temp);
    truck.current.position.copy(temp);
    DELIVERY_PATH.getTangentAt(t, temp);
    truck.current.rotation.y = Math.atan2(-temp.z, temp.x);
    if (wheels.current) wheels.current.children.forEach((w) => { w.rotation.z = -t * distance / 0.63; });
    if (delivery && Date.now() < delivery.arrivesAt) invalidate();
    if (delivery && t === 1) useApp.getState().finishDelivery(delivery.id);
  });
  return <group ref={truck} position={DELIVERY_WAYPOINTS[0]} name="HSD delivery truck">
    <TankerTruck wheels={wheels} />
    {delivery && proposal && !paid && <Html portal={portal} position={[0,4.5,0]} center zIndexRange={[25,21]} style={{pointerEvents:'none'}}>
      <span className="delivery-flight-label" data-gp={proposal.grossProfitRp}>HSD · GP {fmtRpCompact(proposal.grossProfitRp)}</span>
    </Html>}
  </group>;
}
