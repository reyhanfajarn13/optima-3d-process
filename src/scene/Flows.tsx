import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FLOWS, STATIONS, STEP, type Flow } from '../data/process';
import { useApp, type ProposalStatus } from '../store';
import { Envelope } from './assets/Furniture';
import { G, glowMat } from './materials';

/** Kurva bezier tiap alur dihitung sekali dan dipakai bersama (alur & kurir dokumen) */
export const FLOW_CURVES: Record<string, THREE.Curve<THREE.Vector3>> = Object.fromEntries(
  FLOWS.map((f) => {
    const a = new THREE.Vector3(...STATIONS[f.from].port);
    const b = new THREE.Vector3(...STATIONS[f.to].port);
    // Pembayaran kembali melalui sisi depan kantor, terpisah dari arus data.
    if (f.kind === 'revenue') return [f.id, new THREE.CubicBezierCurve3(
      a, new THREE.Vector3(38, 9, 30), new THREE.Vector3(-42, 9, 30), b,
    )];
    const mid = a.clone().lerp(b, 0.5);
    mid.y += f.arc ?? 1.6;
    // alur balik (iterasi) dibelokkan agar tidak menimpa alur maju
    if (f.conditional === 'reject') mid.z -= 5;
    return [f.id, new THREE.QuadraticBezierCurve3(a, mid, b)];
  }),
);

type Emphasis = 'focus' | 'normal' | 'dim' | 'hidden';

function emphasisFor(flow: Flow, step: number, status: ProposalStatus): Emphasis {
  if (flow.conditional === 'win') return status === 'won' ? 'focus' : status === 'paid' ? 'normal' : 'hidden';
  if (flow.conditional) {
    const fired =
      (flow.conditional === 'approve' && ['approved', 'submitted', 'won', 'paid'].includes(status)) ||
      (flow.conditional === 'reject' && status === 'rejected');
    if (fired) return 'focus';
    return step === STEP.decision || step === 0 ? 'normal' : 'dim';
  }
  if (step === 0) return 'normal';
  return flow.step === step ? 'focus' : 'dim';
}

const PACKETS = 3;

function FlowLine({ flow }: { flow: Flow }) {
  const step = useApp((s) => s.activeStep);
  const status = useApp((s) => s.proposalStatus);
  const emphasis = emphasisFor(flow, step, status);
  const curve = FLOW_CURVES[flow.id];
  const points = useMemo(() => curve.getPoints(48), [curve]);
  const speed = useMemo(() => 3.2 / curve.getLength(), [curve]);
  // Line2 dari drei: material dashed, offset dianimasikan agar terlihat "mengalir"
  const lineRef = useRef<{ material: { dashOffset: number } } | null>(null);
  const packets = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const showPackets = flow.kind !== 'revenue' && (emphasis === 'focus' || (emphasis === 'normal' && !flow.conditional));

  const time = useRef(0);
  const placed = useRef(false);
  useEffect(() => {
    placed.current = false;
  }, [showPackets, emphasis]);

  useFrame((_, dt) => {
    const animate = useApp.getState().animate;
    if (animate) {
      time.current += Math.min(dt, 0.1);
      if (lineRef.current) lineRef.current.material.dashOffset -= dt * (emphasis === 'focus' ? 1.6 : 0.8);
    } else if (placed.current) {
      return;
    }
    if (packets.current && showPackets) {
      placed.current = packets.current.children.length > 0;
      packets.current.children.forEach((p, i) => {
        const t = (time.current * speed + i / PACKETS) % 1;
        curve.getPointAt(t, tmp);
        p.position.copy(tmp);
        if (flow.kind === 'doc') {
          curve.getTangentAt(t, tmp);
          p.rotation.y = Math.atan2(tmp.x, tmp.z) + Math.PI / 2;
        } else {
          p.rotation.x = p.rotation.y = time.current * 2 + i;
        }
      });
    }
  });

  if (emphasis === 'hidden') return null;
  const width = emphasis === 'focus' ? 4 : emphasis === 'normal' ? 2.4 : 1.4;
  const opacity = emphasis === 'focus' ? 1 : emphasis === 'normal' ? 0.75 : 0.18;

  return (
    <group>
      <Line
        ref={lineRef as never}
        points={points}
        color={flow.color}
        lineWidth={width}
        dashed
        dashSize={0.6}
        gapSize={0.35}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
      {flow.kind === 'revenue' && [0.2, 0.5, 0.8].map((t) => {
        const point = curve.getPointAt(t);
        const direction = curve.getTangentAt(t);
        const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        return <mesh key={t} geometry={G.cone} material={glowMat(flow.color)} position={point} quaternion={rotation} scale={[0.8, 1.2, 0.8]} />;
      })}
      {showPackets && (
        <group ref={packets}>
          {Array.from({ length: PACKETS }, (_, i) =>
            flow.kind === 'doc' ? (
              <group key={i}>
                <Envelope color={flow.color} scale={emphasis === 'focus' ? 0.9 : 0.6} />
              </group>
            ) : (
              <mesh key={i} geometry={G.box} material={glowMat(flow.color)} scale={emphasis === 'focus' ? 0.32 : 0.22} />
            ),
          )}
        </group>
      )}
    </group>
  );
}

export function Flows() {
  return (
    <>
      {FLOWS.map((f) => (
        <FlowLine key={f.id} flow={f} />
      ))}
    </>
  );
}
