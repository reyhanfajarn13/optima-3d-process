import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
import { COLORS, STATIONS, type StationId, type Vec3 } from '../../data/process';
import { useApp, type ProposalStatus } from '../../store';
import { G, glowMat, hitMaterial, mat, PALETTE } from '../materials';
import { screenMaterial, type ScreenKind } from '../screens';
import { BigScreen, Cabinet, Calculator, Chair, Desk, Envelope, Laptop, Monitor, Printer } from './Furniture';
import { LogoPanel, Sign } from './Signs';
import { MiningLandscape } from './Mining';
import { Person, type Pose } from './Person';
import { Ball, Box, Cyl, Shadow } from './primitives';

const animating = () => useApp.getState().animate;

/** Grup stasiun + hitbox tak terlihat untuk klik/hover (hanya hitbox yang di-raycast) */
function Hotspot({ id, size, offset = [0, 0, 0], children }: { id: StationId; size: Vec3; offset?: Vec3; children: ReactNode }) {
  const st = STATIONS[id];
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // abaikan klik hasil drag kamera
    useApp.getState().setStep(st.step, id);
  };
  return (
    <group position={st.position}>
      {children}
      <mesh
        geometry={G.box}
        material={hitMaterial}
        position={[offset[0], size[1] / 2 + offset[1], offset[2]]}
        scale={size}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          useApp.getState().setHovered(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          useApp.getState().setHovered(null);
          document.body.style.cursor = '';
        }}
      />
    </group>
  );
}

function Workstation({ screen, shirt, pose = 'type', phase, children }: { screen: ScreenKind; shirt: string; pose?: Pose; phase?: number; children?: ReactNode }) {
  return (
    <group>
      <Desk />
      <Monitor screen={screen} position={[-0.1, 0.83, -0.15]} size={1.15} />
      <Box color={PALETTE.dark} position={[-0.1, 0.84, 0.22]} scale={[0.5, 0.02, 0.16]} />
      <Person position={[0.5, 0, 0.85]} rotation={Math.PI} shirt={shirt} pose={pose} phase={phase} />
      {children}
    </group>
  );
}

/* ───────────── Langkah 1: sumber data eksternal ───────────── */

function SiteData() {
  return <Hotspot id="src-site" size={[5, 3.5, 2.5]}>
    <BigScreen screen="site" width={3.5} />
    <Cabinet position={[2.1, 0, 0]} />
    <Sign text="DATA SITE CUSTOMER" width={4.2} position={[0, 0.7, 0.5]} color={COLORS.risk} />
  </Hotspot>;
}

function NcBoard() {
  const globe = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (animating() && globe.current) globe.current.rotation.y += dt * 0.4;
  });
  return (
    <Hotspot id="src-nc" size={[4, 3.8, 1.6]}>
      <group rotation={[0, 0.45, 0]}>
        <Shadow size={[4, 1.2]} />
        <Box color={PALETTE.dark} position={[-1.3, 1.0, -0.05]} scale={[0.12, 2.0, 0.12]} />
        <Box color={PALETTE.dark} position={[1.3, 1.0, -0.05]} scale={[0.12, 2.0, 0.12]} />
        <Box color={PALETTE.darker} position={[0, 2.55, -0.06]} scale={[3.5, 2.2, 0.1]} />
        <mesh geometry={G.plane} material={screenMaterial('nc')} position={[0, 2.55, 0.0]} scale={[3.36, 2.1, 1]} />
      </group>
      <group ref={globe} position={[2.2, 1.0, 0.9]}>
        <Cyl color={PALETTE.dark} position={[0, -0.6, 0]} scale={[0.1, 0.6, 0.1]} />
        <Ball color="#3d7fc1" scale={0.95} />
        <mesh geometry={G.ico} scale={0.98}>
          <meshBasicMaterial color="#d6e8f7" wireframe />
        </mesh>
      </group>
    </Hotspot>
  );
}

function InternalData() {
  return <Hotspot id="src-internal" size={[5, 3.5, 2.5]}>
    <Shadow size={[5, 3]} />
    <Box color="#f3f5f4" position={[0, 1.3, 0]} scale={[4.3, 2.6, 0.8]} />
    <LogoPanel brand="oracle-netsuite" width={3.8} position={[0, 2.2, 0.47]} />
    <Sign text="ERP PERUSAHAAN" subtitle="Data Transaksi TEM" width={3.8} position={[0, 0.85, 0.47]} color={COLORS.fat} />
    <Cabinet position={[2.7, 0, 0]} />
  </Hotspot>;
}

function Competitors() {
  return <Hotspot id="src-comp" size={[5, 3.5, 2.5]}>
    <BigScreen screen="marketing" width={3.6} />
    <Sign text="COMPETITOR BENCHMARK" width={4.5} position={[0, 0.65, 0.5]} color={COLORS.marketing} />
    <group position={[2.5, 0, 0]}>
      {[0.8,1.2,1.65].map((h,i) => <Box key={i} color={COLORS.marketing} position={[i*0.4,h/2,0]} scale={[0.3,h,0.6]} />)}
    </group>
  </Hotspot>;
}



/* ───────────── Langkah 1: tim internal ───────────── */

function RiskTeam() {
  return (
    <Hotspot id="risk" size={[2.4, 2.2, 2.6]} offset={[0.2, 0, 0.3]}>
      <Workstation screen="risk" shirt={COLORS.risk} phase={0.3}>
        {/* kaca pembesar */}
        <group position={[0.62, 0.86, 0.12]} rotation={[-Math.PI / 2, 0, 0.5]}>
          <mesh geometry={G.torus} material={mat(PALETTE.dark)} scale={0.24} />
          <Box color={PALETTE.dark} position={[0, -0.22, 0]} scale={[0.04, 0.2, 0.04]} />
        </group>
      </Workstation>
    </Hotspot>
  );
}

function FatTeam() {
  return (
    <Hotspot id="fat" size={[2.4, 2.2, 2.6]} offset={[0.2, 0, 0.3]}>
      <Workstation screen="fat" shirt={COLORS.fat} phase={1.7}>
        <Calculator position={[0.6, 0.83, 0.12]} />
      </Workstation>
    </Hotspot>
  );
}

function MarketingTeam() {
  return (
    <Hotspot id="marketing" size={[2.4, 2.2, 2.6]} offset={[0.2, 0, 0.3]}>
      <Workstation screen="marketing" shirt={COLORS.marketing} phase={2.9}>
        <group position={[0.62, 0.84, 0.05]}>
          {[0.12, 0.22, 0.17].map((h, i) => (
            <Box key={i} color={COLORS.marketing} position={[-0.08 + i * 0.08, h / 2, 0]} scale={[0.06, h, 0.06]} />
          ))}
        </group>
      </Workstation>
    </Hotspot>
  );
}

/* ───────────── Langkah 2: PostgreSQL Data Warehouse ───────────── */

function WarehouseHub() {
  const leds = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!animating() || !leds.current) return;
    leds.current.children.forEach((l, i) => { l.visible = (Math.floor(clock.elapsedTime * 3) + i) % 5 !== 0; });
  });
  return <Hotspot id="warehouse" size={[7, 5.5, 4]}>
    <Shadow size={[8, 5]} />
    <Box color="#c7dce6" position={[0, 0.15, 0]} scale={[7.5,0.3,4.5]} />
    {[-2.4,0,2.4].map((x) => <group key={x} position={[x,0.3,0]}>
      <Box color="#1c354b" position={[0,1.65,0]} scale={[1.75,3.3,1.5]} />
      {[0.5,1.2,1.9,2.6].map((y) => <Box key={y} color="#496a80" position={[0,y,0.77]} scale={[1.5,0.55,0.04]} />)}
    </group>)}
    <group ref={leds}>{[-2.4,0,2.4].flatMap((x) => [0.8,1.5,2.2,2.9].map((y) => <Box key={`${x}-${y}`} color="#6fe7c4" glow position={[x+0.5,y,0.81]} scale={[0.1,0.1,0.02]} />))}</group>
    <group position={[0,4.25,0]}>
      {[0,1,2].map((i) => <Cyl key={i} color={i===2 ? '#5694ba' : COLORS.warehouse} position={[0,i*0.35,0]} scale={[1.5,0.3,1.5]} />)}
    </group>
    <Sign text="PostgreSQL" subtitle="INTEGRATED DATA WAREHOUSE" width={6.7} position={[0,3.85,0.85]} color={COLORS.warehouse} />
  </Hotspot>;
}



/* ───────────── Langkah 3: OPTIMA ───────────── */

function Optima() {
  return <Hotspot id="optima" size={[10, 6.3, 5]}>
    <Shadow size={[11,6]} />
    <Box color="#d8eaf2" position={[0,0.15,0]} scale={[10.2,0.3,4.5]} />
    <BigScreen screen="optima" position={[-2.5,0,0]} width={4} />
    <BigScreen screen="analytics" position={[2.5,0,0]} width={4} />
    <LogoPanel brand="optima" width={3.2} position={[0,4.9,-0.25]} />
    <Sign text="KALKULATOR" width={3.8} position={[-2.5,0.7,0.5]} color={COLORS.optima} />
    <Sign text="DASHBOARD ANALYTICS" width={3.8} position={[2.5,0.7,0.5]} color={COLORS.optima} />
    <Sign text="HARGA & PROPOSAL UNTUK SALES" width={7} position={[0,0.8,2.2]} color="#173a63" />
  </Hotspot>;
}



/* ───────────── Langkah 3: Sales, pengguna OPTIMA ───────────── */

function SalesDesk() {
  const status = useApp((s) => s.proposalStatus);
  return (
    <Hotspot id="sales" size={[3.6, 2.4, 3]} offset={[0.3, 0, 0.3]}>
      <Desk width={2.2} depth={0.95} />
      <Laptop screen="sales" position={[-0.45, 0.83, 0]} rotation={0.15} />
      <Monitor screen="analytics" position={[0.5, 0.83, -0.2]} rotation={-0.25} size={0.9} />
      <Person position={[0.15, 0, 0.9]} rotation={Math.PI} shirt={COLORS.sales} pose="type" tie="#2b2f6b" phase={0.9} />
      <Chair position={[0.15, 0, 1.4]} rotation={Math.PI} color="#4a4f80" />
      <Printer position={[1.7, 0, 0.2]} printing={status === 'generated'} />
      <Sign text="SALES TEM" subtitle="Pengguna OPTIMA · harga & proposal" width={5.2} position={[0, 0.7, 2.3]} color={COLORS.sales} />
    </Hotspot>
  );
}

/* ───────────── Langkah 4: GM Sales & Customer ───────────── */

const STATUS_COLOR: Record<ProposalStatus, string> = {
  draft: '#9aa3ad',
  generated: '#9aa3ad',
  sent: '#fab219',
  approved: COLORS.approve,
  submitted: COLORS.approve,
  won: COLORS.approve,
  paid: COLORS.approve,
  rejected: COLORS.reject,
};

function DecisionSymbol({ status }: { status: ProposalStatus }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = 3.35 + (animating() ? Math.sin(clock.elapsedTime * 2) * 0.1 : 0);
    if (animating()) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.5;
  });
  const color = STATUS_COLOR[status];
  return (
    <group ref={g} position={[0, 3.35, -0.2]}>
      <mesh geometry={G.circle} material={glowMat(color)} scale={1.0} />
      <mesh geometry={G.circle} material={glowMat(color)} scale={1.0} rotation={[0, Math.PI, 0]} />
      {(['approved', 'submitted', 'won', 'paid'].includes(status)) && (
        <group position={[0, 0, 0.02]}>
          <Box color="#ffffff" glow position={[-0.12, -0.05, 0]} rotation={[0, 0, -0.8]} scale={[0.26, 0.08, 0.02]} />
          <Box color="#ffffff" glow position={[0.1, 0.05, 0]} rotation={[0, 0, 0.9]} scale={[0.5, 0.08, 0.02]} />
        </group>
      )}
      {status === 'rejected' && (
        <group position={[0, 0, 0.02]}>
          <Box color="#ffffff" glow rotation={[0, 0, 0.78]} scale={[0.5, 0.08, 0.02]} />
          <Box color="#ffffff" glow rotation={[0, 0, -0.78]} scale={[0.5, 0.08, 0.02]} />
        </group>
      )}
      {status === 'sent' && <Box color="#ffffff" glow scale={[0.08, 0.36, 0.02]} position={[0, 0.06, 0.02]} />}
    </group>
  );
}

function GmOffice() {
  const status = useApp((s) => s.proposalStatus);
  return (
    <Hotspot id="gm" size={[3.6, 4, 3]}>
      <Shadow size={[4, 3]} />
      <Box color="#d9cbb8" position={[0, 0.03, -0.2]} scale={[3.8, 0.06, 3]} />
      <Desk width={2.4} depth={1.0} color={PALETTE.wood} />
      <Box color="#8c6342" position={[0, 0.42, 0.45]} scale={[2.3, 0.76, 0.05]} />
      <Monitor screen="gm" position={[-0.65, 0.83, 0.05]} rotation={2.5} size={0.9} />
      <group position={[0.05, 0.86, 0.25]} rotation={[0, -0.3, 0]}>
        <Envelope color={COLORS.sales} scale={0.8} />
      </group>
      <Box color={PALETTE.paper} position={[0.45, 0.85, 0.1]} rotation={[0, 0.2, 0]} scale={[0.42, 0.02, 0.56]} />
      <Box color="#c94a3a" position={[0.85, 0.9, 0.15]} scale={[0.14, 0.12, 0.14]} />
      <Person position={[0, 0, -0.75]} shirt={COLORS.gm} tie="#c94a3a" pose={status === 'sent' ? 'think' : 'talk'} hair="#5b5b5b" phase={2.2} />
      <Chair position={[0, 0, -1.25]} color="#3b2c22" high />
      <Cyl color={PALETTE.metal} position={[0, 1.5, -0.2]} scale={[0.04, 3, 0.04]} />
      <DecisionSymbol status={status} />
    </Hotspot>
  );
}

function CustomerSite() {
  const status = useApp((s) => s.proposalStatus);
  const submitted = ['submitted', 'won', 'paid'].includes(status);
  const won = status === 'won' || status === 'paid';
  return <Hotspot id="customer" size={[19,6,23]} offset={[0,0,0]}>
    <MiningLandscape />
    {won && <Sign text="WIN" subtitle="CUSTOMER SETUJU" color={COLORS.approve} position={[0, 5, 0]} width={5} />}
    {/* Kantor site lebih kecil daripada tambang. */}
    <group position={[-5.8,0.2,4.8]} scale={0.7}>
      <Box color="#f3ead4" position={[0,1.8,0]} scale={[3.2,3.6,2.6]} />
      <mesh geometry={G.plane} material={screenMaterial('building')} position={[0,1.85,1.31]} scale={[3,3.2,1]} />
      <Box color="#536e69" position={[0,3.7,0]} scale={[3.5,0.2,2.9]} />
      <Box color="#304542" position={[0,0.5,1.32]} scale={[0.8,1,0.02]} />
    </group>
    <group position={[-6,0.2,2]}>
      <Box color={submitted ? COLORS.approve : COLORS.customer} position={[0,0.6,0]} scale={[1.2,1.2,0.9]} />
      <Box color={PALETTE.darker} position={[0,1.21,0]} scale={[0.7,0.02,0.1]} />
      <Sign text="TENDER" width={1} position={[0,0.7,0.46]} color={submitted ? COLORS.approve : COLORS.customer} />
    </group>
    <Person position={[-4.2,0.2,7]} rotation={-0.4} shirt="#4e7a3a" hardhat pose="talk" phase={4.1} />
  </Hotspot>;
}



export function Stations() {
  return (
    <>
      <SiteData />
      <NcBoard />
      <InternalData />
      <Competitors />
      <RiskTeam />
      <FatTeam />
      <MarketingTeam />
      <WarehouseHub />
      <Optima />
      <SalesDesk />
      <GmOffice />
      <CustomerSite />
    </>
  );
}
