import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '../data/process';
import { useApp, type Courier, type CourierRoute } from '../store';
import { Envelope } from './assets/Furniture';
import { FLOW_CURVES } from './Flows';
import { G, glowMat } from './materials';
import { RevenuePacket } from './assets/RevenuePacket';
import { revenueProgress } from '../lib/revenue';
import { fmtRpCompact } from '../lib/format';

const ROUTES: Record<CourierRoute, { flow: string; color: string }> = {
  toGM: { flow: 'sales-gm', color: COLORS.sales },
  toCustomer: { flow: 'gm-customer', color: COLORS.approve },
  toSales: { flow: 'gm-sales', color: COLORS.reject },
  revenue: { flow: 'customer-revenue', color: COLORS.revenue },
};

const DURATION = 2.6;

/** Amplop besar yang terbang satu kali saat Sales/GM mengambil aksi */
function CourierFlight({ courier, portal }: { courier: Courier; portal: RefObject<HTMLDivElement> }) {
  const ref = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const done = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  const route = ROUTES[courier.route];
  const curve = FLOW_CURVES[route.flow];
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const payment = useApp((s) => s.revenue);
  const isRevenue = courier.route === 'revenue';

  useFrame((_, dt) => {
    if (!ref.current || done.current) return;
    elapsed.current += Math.min(dt, 0.05);
    if (isRevenue && !payment) return;
    if (isRevenue && payment && Date.now() < payment.startedAt) {
      ref.current.visible = false;
      invalidate();
      return;
    }
    ref.current.visible = true;
    const raw = isRevenue && payment ? revenueProgress(payment) : Math.min(1, elapsed.current / DURATION);
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2; // ease in-out
    curve.getPointAt(t, tmp);
    ref.current.position.copy(tmp);
    curve.getTangentAt(t, tmp);
    if (!isRevenue) ref.current.rotation.set(Math.sin(raw * Math.PI * 4) * 0.25, Math.atan2(tmp.x, tmp.z) + Math.PI / 2, 0);
    const s = isRevenue ? 2.3 : 1.6 + Math.sin(raw * Math.PI) * 0.6;
    ref.current.scale.setScalar(s);
    if (raw >= 1) {
      done.current = true;
      useApp.getState().finishCourier(courier.id);
    } else {
      invalidate(); // tetap bergerak walau mode hemat (frameloop "demand")
    }
  });

  return (
    <group ref={ref} position={curve.getPointAt(0)} scale={isRevenue ? 2.3 : 1.6} visible={!isRevenue}>
      {isRevenue ? <>
        <Billboard><RevenuePacket /></Billboard>
        <Html portal={portal} center position={[0, 1.6, 0]} zIndexRange={[25, 21]} style={{pointerEvents: 'none'}}>
          <span className="revenue-flight-label">Revenue · {payment && fmtRpCompact(payment.amountRp)}</span>
        </Html>
      </> : <Envelope color={route.color} />}
      <mesh geometry={G.sphere} material={glowMat(route.color)} position={[0, -0.12, 0]} scale={[0.25, 0.25, 0.25]} />
    </group>
  );
}

export function Couriers({ portal }: { portal: RefObject<HTMLDivElement> }) {
  const couriers = useApp((s) => s.couriers);
  return (
    <>
      {couriers.map((c) => (
        <CourierFlight key={c.id} courier={c} portal={portal} />
      ))}
    </>
  );
}
