import type { ThreeElements } from '@react-three/fiber';
import type { Vec3 } from '../../data/process';
import { G, glowMat, mat, shadowMaterial } from '../materials';

type MeshProps = Omit<ThreeElements['mesh'], 'geometry' | 'material'> & { color: string; glow?: boolean };

/** Kotak satuan yang di-scale — memakai geometri bersama */
export function Box({ color, glow, ...rest }: MeshProps) {
  return <mesh geometry={G.box} material={glow ? glowMat(color) : mat(color)} {...rest} />;
}

export function Cyl({ color, glow, low, ...rest }: MeshProps & { low?: boolean }) {
  return <mesh geometry={low ? G.cylLow : G.cyl} material={glow ? glowMat(color) : mat(color)} {...rest} />;
}

export function Ball({ color, glow, ...rest }: MeshProps) {
  return <mesh geometry={G.sphere} material={glow ? glowMat(color) : mat(color)} {...rest} />;
}

export function Cone({ color, ...rest }: MeshProps) {
  return <mesh geometry={G.cone} material={mat(color)} {...rest} />;
}

/** Bayangan blob di lantai */
export function Shadow({ position = [0, 0, 0], size = [1.6, 1.6] }: { position?: Vec3; size?: [number, number] }) {
  return (
    <mesh
      geometry={G.plane}
      material={shadowMaterial}
      position={[position[0], position[1] + 0.09, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[size[0], size[1], 1]}
      renderOrder={-1}
    />
  );
}
